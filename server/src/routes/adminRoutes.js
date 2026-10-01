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


router.use(requireAuth, requireAdmin);


router.route('/products')
  .get(getAdminProducts)
  .post(createProduct);

router.route('/products/:id')
  .patch(updateProduct)
  .delete(deleteProduct);


router.route('/orders')
  .get(getAdminOrders);

router.route('/orders/:id')
  .get(getAdminOrderById);

router.route('/orders/:id/status')
  .patch(updateAdminOrderStatus);

module.exports = router;
