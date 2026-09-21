const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/adminProductController');

const {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
} = require('../controllers/adminOrderController');

const router = express.Router();

// Enforce Auth and Admin role on all routes in this router
router.use(requireAuth, requireAdmin);

// Admin Product Management
router.route('/products')
  .get(getAdminProducts)
  .post(createProduct);

router.route('/products/:id')
  .patch(updateProduct)
  .delete(deleteProduct);

// Admin Order Management
router.route('/orders')
  .get(getAdminOrders);

router.route('/orders/:id')
  .get(getAdminOrderById);

router.route('/orders/:id/status')
  .patch(updateAdminOrderStatus);

module.exports = router;
