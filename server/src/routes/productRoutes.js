const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(createProduct); // TODO: Protect with Admin Auth later

// We use :identifier to support both fetching by ID and fetching by slug URL
router.route('/:identifier')
  .get(getProduct);

router.route('/:id')
  .put(updateProduct)   // TODO: Protect with Admin Auth later
  .delete(deleteProduct); // TODO: Protect with Admin Auth later

module.exports = router;
