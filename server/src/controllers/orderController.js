const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Product = require('../models/Product');

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

    // 4. Validate Products and compute totals
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      
      // Ensure product exists and is active/purchasable
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          success: false, 
          error: `Product ${cartItem.product} is no longer available.` 
        });
      }

      const unitPrice = product.price;
      const quantity = cartItem.quantity;
      const lineTotal = unitPrice * quantity;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images && product.images.length > 0 ? product.images[0] : null,
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

    // 5. Create Order
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
        paymentStatus: 'PENDING'
      });
    } catch (err) {
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
 * Get a specific order by ID, verifying ownership
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

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
