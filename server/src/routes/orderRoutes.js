const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/authMiddleware');


router.use(requireAuth);


router.post('/', orderController.createOrder);


router.get('/', orderController.getMyOrders);


router.get('/:id', orderController.getOrderById);


router.post('/:id/payment', paymentController.initiatePayment);


router.post('/:id/payment/verify', paymentController.verifyPayment);

module.exports = router;
