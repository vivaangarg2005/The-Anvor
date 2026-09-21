const productService = require('../services/productService');

exports.getProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.json({ 
      success: true, 
      count: result.products.length, 
      data: result.products,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount
      }
    });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdOrSlug(req.params.identifier);
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};


