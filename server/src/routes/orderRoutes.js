const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(requireAuth);

// Create a new order from current cart
router.post('/', orderController.createOrder);

// Get all orders for the current user
router.get('/', orderController.getMyOrders);

// Get a specific order by ID (verifies ownership inside controller)
router.get('/:id', orderController.getOrderById);

// Initiate Razorpay payment for an existing order
router.post('/:id/payment', paymentController.initiatePayment);

// Verify Razorpay payment signature and mark order PAID
router.post('/:id/payment/verify', paymentController.verifyPayment);

module.exports = router;
