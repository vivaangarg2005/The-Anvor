const crypto = require('crypto');
const razorpay = require('../config/razorpayClient');
const Order = require('../models/Order');











exports.initiatePayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id: orderId } = req.params;

    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    
    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Order is already paid' });
    }

    
    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        data: {
          razorpayOrderId: order.razorpayOrderId,
          
          amount: Math.round(parseFloat(order.grandTotal.toFixed(2)) * 100),
          currency: order.currency || 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          orderNumber: order.orderNumber,
        },
      });
    }

    
    
    
    
    const amountInPaise = Math.round(parseFloat(order.grandTotal.toFixed(2)) * 100);

    
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: order.currency || 'INR',
      receipt: order.orderNumber, 
      notes: {
        anvorOrderId: order._id.toString(),
        anvorOrderNumber: order.orderNumber,
      },
    });

    
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    
    return res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: order.currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID, 
        orderNumber: order.orderNumber,
      },
    });
  } catch (err) {
    next(err);
  }
};















exports.verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id: orderId } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
      });
    }

    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, data: { paymentStatus: 'PAID' } });
    }

    
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay order ID does not match internal order',
      });
    }

    
    
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'FAILED' });
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'PAID',
        razorpayPaymentId,
        
        status: 'PROCESSING',
      },
      { new: true }
    );

    return res.status(200).json({ success: true, data: { paymentStatus: 'PAID', order: updatedOrder } });
  } catch (err) {
    next(err);
  }
};
