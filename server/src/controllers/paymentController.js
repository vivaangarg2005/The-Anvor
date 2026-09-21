const crypto = require('crypto');
const razorpay = require('../config/razorpayClient');
const Order = require('../models/Order');

/**
 * POST /api/orders/:id/payment
 *
 * Creates a Razorpay payment order for an existing internal Anvor order.
 * - Order must belong to the authenticated user.
 * - Order must not already be PAID.
 * - If a razorpayOrderId already exists on the order, reuse it (idempotent retry).
 * - Amount comes exclusively from Order.grandTotal (never from client).
 * - Returns only safe, public data to the frontend (no secret).
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id: orderId } = req.params;

    // Fetch and verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Do not re-initiate payment for already paid orders
    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, error: 'Order is already paid' });
    }

    // Idempotent: if a Razorpay order was already created for this internal order, reuse it.
    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        data: {
          razorpayOrderId: order.razorpayOrderId,
          // Amount in paise (authoritative from DB)
          amount: Math.round(order.grandTotal * 100),
          currency: order.currency || 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          orderNumber: order.orderNumber,
        },
      });
    }

    // Amount must come from DB — never trust client
    const amountInPaise = Math.round(order.grandTotal * 100); // Razorpay expects paise (integer)

    // Create Razorpay order on the backend using secret credentials
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: order.currency || 'INR',
      receipt: order.orderNumber, // Internal reference
      notes: {
        anvorOrderId: order._id.toString(),
        anvorOrderNumber: order.orderNumber,
      },
    });

    // Store the Razorpay order ID on our internal order for later verification
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Return ONLY what the frontend needs — no secret key
    return res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: order.currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID, // public key only
        orderNumber: order.orderNumber,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/orders/:id/payment/verify
 *
 * Verifies a Razorpay payment callback cryptographically.
 * Frontend sends: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 *
 * Security checks:
 * 1. User must be authenticated.
 * 2. Order must belong to the authenticated user.
 * 3. razorpayOrderId must match what is stored on the internal order.
 * 4. HMAC-SHA256 signature must be valid.
 * 5. Already-paid orders return idempotent success without re-processing.
 * 6. On failure, paymentStatus is set to FAILED (not PAID).
 */
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

    // Fetch and verify ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (order.user.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Idempotent: already paid — return success safely
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, data: { paymentStatus: 'PAID' } });
    }

    // Security: Razorpay order ID must match what we stored — prevents cross-order attacks
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay order ID does not match internal order',
      });
    }

    // Cryptographic signature verification using Razorpay's documented approach
    // Signature = HMAC-SHA256(razorpayOrderId + '|' + razorpayPaymentId, secret)
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // Mark as failed, but do not expose why in detail (prevent timing attacks)
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'FAILED' });
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    // Signature valid — mark as PAID and store payment ID for reconciliation
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'PAID',
        razorpayPaymentId,
        // Move order to PROCESSING after payment confirmed
        status: 'PROCESSING',
      },
      { new: true }
    );

    return res.status(200).json({ success: true, data: { paymentStatus: 'PAID', order: updatedOrder } });
  } catch (err) {
    next(err);
  }
};
