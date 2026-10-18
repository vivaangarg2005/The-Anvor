const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Product = require('../models/Product');

// 20-minute payment window in milliseconds
const ORDER_EXPIRY_MS = 20 * 60 * 1000;

/**
 * Creates a new order from the current authenticated user's cart.
 */
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { addressId, idempotencyKey } = req.body;

    if (!addressId || !idempotencyKey) {
      return res.status(400).json({ success: false, error: 'addressId and idempotencyKey are required' });
    }

    // 1. Idempotency Check: Check if an order with this idempotencyKey already exists
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      if (existingOrder.user.toString() !== userId) {
        return res.status(403).json({ success: false, error: 'Idempotency key reuse across users is not allowed' });
      }
      // If the existing order has expired, tell the user to create a new one
      if (existingOrder.status === 'EXPIRED') {
        return res.status(410).json({ success: false, error: 'This order has expired. Please create a new order.' });
      }
      return res.status(200).json({ success: true, data: existingOrder });
    }

    // 2. Fetch the authenticated user's address
    const address = await Address.findById(addressId);
    if (!address || address.user.toString() !== userId) {
      return res.status(404).json({ success: false, error: 'Address not found or does not belong to user' });
    }

    // 3. Fetch the authenticated user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // 4. Validate Products and atomically decrement stock in MongoDB
    // Using atomic condition { stockQuantity: { $gte: quantity } } combined with $inc: { stockQuantity: -quantity }
    // to prevent check-then-act race conditions where concurrent requests both see stock > 0.
    const orderItems = [];
    const reservedStockItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const quantity = cartItem.quantity;

      // ATOMIC UPDATE: Check stockQuantity >= quantity AND decrement in the exact same operation
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: cartItem.product,
          isActive: true,
          stockQuantity: { $gte: quantity },
        },
        {
          $inc: { stockQuantity: -quantity },
        },
        { returnDocument: 'after' }
      );

      if (!updatedProduct) {
        // Atomic decrement failed: either product does not exist, is inactive, or has insufficient stock.
        // Roll back any previously decremented items in this transaction to keep stock consistent
        for (const item of reservedStockItems) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: item.quantity } }
          );
        }

        const product = await Product.findById(cartItem.product);
        if (!product || !product.isActive) {
          return res.status(400).json({ 
            success: false, 
            error: `Product ${cartItem.product} is no longer available.` 
          });
        }

        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${quantity}.`,
        });
      }

      // Track item for rollback if subsequent items fail or Order.create throws
      reservedStockItems.push({
        productId: updatedProduct._id,
        quantity,
      });

      const unitPrice = updatedProduct.price;
      const lineTotal = unitPrice * quantity;

      orderItems.push({
        product: updatedProduct._id,
        productName: updatedProduct.name,
        productSlug: updatedProduct.slug,
        productImage: updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images[0] : null,
        unitPrice,
        quantity,
        lineTotal
      });

      subtotal += lineTotal;
    }

    const shippingTotal = 0;
    const discountTotal = 0;
    const grandTotal = subtotal + shippingTotal - discountTotal;

    // Generate human-readable order number using IST (Asia/Kolkata)
    const nowIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // 'en-CA' gives YYYY-MM-DD
    const dateStr = nowIST.replace(/-/g, ''); // YYYYMMDD
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ANV-${dateStr}-${randomStr}`;

    // Create the Address Snapshot
    const shippingAddressSnapshot = {
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      landmark: address.landmark,
    };

    // 5. Create Order with 20-minute expiry window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_EXPIRY_MS);
    let newOrder;
    try {
      newOrder = await Order.create({
        user: userId,
        orderNumber,
        idempotencyKey,
        items: orderItems,
        shippingAddress: shippingAddressSnapshot,
        subtotal,
        shippingTotal,
        discountTotal,
        grandTotal,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        expiresAt,
      });
    } catch (err) {
      // Roll back reserved stock if order creation failed
      for (const item of reservedStockItems) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } }
        );
      }

      if (err.code === 11000 && err.keyPattern && err.keyPattern.idempotencyKey) {
        // Concurrent duplicate request was caught by the unique index
        const concurrentOrder = await Order.findOne({ idempotencyKey });
        if (concurrentOrder && concurrentOrder.user.toString() === userId) {
          return res.status(200).json({ success: true, data: concurrentOrder });
        }
      }
      throw err;
    }

    // 6. Clear Cart ONLY after successful order creation
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    next(error);
  }
};

/**
 * Get all orders for the authenticated user
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific order by ID, verifying ownership.
 * Lazily expires the order if it's past the expiry window and still unpaid, restoring stock.
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Lazy expiry: if the order is still PENDING payment and past its window, expire it now and restore stock
    if (
      order.status === 'PENDING' &&
      order.paymentStatus === 'PENDING' &&
      order.expiresAt &&
      new Date() > order.expiresAt
    ) {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        {
          $set: {
            status: 'EXPIRED',
            paymentStatus: 'FAILED',
            expiredAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (updatedOrder) {
        for (const item of updatedOrder.items) {
          if (item.product && item.quantity) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stockQuantity: item.quantity } }
            );
          }
        }
        order.status = 'EXPIRED';
        order.paymentStatus = 'FAILED';
        order.expiredAt = updatedOrder.expiredAt;
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
