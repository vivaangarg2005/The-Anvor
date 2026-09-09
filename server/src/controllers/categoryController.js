const categoryService = require('../services/categoryService');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) { next(error); }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) { next(error); }
};
