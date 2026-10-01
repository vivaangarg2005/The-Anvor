const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Product = require('../models/Product');




exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { addressId, idempotencyKey } = req.body;

    if (!addressId || !idempotencyKey) {
      return res.status(400).json({ success: false, error: 'addressId and idempotencyKey are required' });
    }

    
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      if (existingOrder.user.toString() !== userId) {
        return res.status(403).json({ success: false, error: 'Idempotency key reuse across users is not allowed' });
      }
      return res.status(200).json({ success: true, data: existingOrder });
    }

    
    const address = await Address.findById(addressId);
    if (!address || address.user.toString() !== userId) {
      return res.status(404).json({ success: false, error: 'Address not found or does not belong to user' });
    }

    
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      
      
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

    
    const nowIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); 
    const dateStr = nowIST.replace(/-/g, ''); 
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ANV-${dateStr}-${randomStr}`;

    
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
        
        const concurrentOrder = await Order.findOne({ idempotencyKey });
        if (concurrentOrder && concurrentOrder.user.toString() === userId) {
          return res.status(200).json({ success: true, data: concurrentOrder });
        }
      }
      throw err;
    }

    
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    next(error);
  }
};




exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};




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
