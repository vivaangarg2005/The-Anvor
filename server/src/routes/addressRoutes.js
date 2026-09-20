const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth); // All address routes require authentication

router.get('/', addressController.getAddresses);
router.post('/', addressController.createAddress);
router.patch('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.post('/:id/default', addressController.setDefaultAddress);

module.exports = router;