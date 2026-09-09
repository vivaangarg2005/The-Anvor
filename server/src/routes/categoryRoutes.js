const express = require('express');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(createCategory); // TODO: Protect with Admin Auth later

router.route('/:id')
  .get(getCategory)
  .put(updateCategory)   // TODO: Protect with Admin Auth later
  .delete(deleteCategory); // TODO: Protect with Admin Auth later

module.exports = router;
