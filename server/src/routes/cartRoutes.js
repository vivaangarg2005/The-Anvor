/**
 * cartRoutes.js
 * Exposes shopping cart endpoints.
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/authMiddleware');

// All cart routes require authentication
router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/merge', cartController.mergeCart);
router.post('/items', cartController.addItem);
router.patch('/items/:productId', cartController.updateItemQuantity);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
