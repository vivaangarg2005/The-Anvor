const express = require('express');
const { getProducts, getProduct } = require('../controllers/productController');
const router = express.Router();

router.route('/')
  .get(getProducts);

// We use :identifier to support both fetching by ID and fetching by slug URL
router.route('/:identifier')
  .get(getProduct);

module.exports = router;
