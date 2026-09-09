const productService = require('../services/productService');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts(req.query);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdOrSlug(req.params.identifier);
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// [TEMPORARY UNPROTECTED DEVELOPMENT ENDPOINT]
exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { next(error); }
};
