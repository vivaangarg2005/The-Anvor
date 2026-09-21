const Product = require('../models/Product');
const slugify = require('../utils/slugify');

/**
 * Extracts and whitelists allowed product fields from the request body.
 */
const extractProductData = (body) => {
  const allowedFields = [
    'name',
    'price',
    'compareAtPrice',
    'description',
    'sku',
    'category',
    'stockQuantity',
    'isActive',
    'isFeatured',
  ];

  const data = {};
  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  });

  // Images logic (needs to be an array of strings)
  if (Array.isArray(body.images)) {
    data.images = body.images.filter(img => typeof img === 'string' && img.trim() !== '');
  }

  // Generate slug if name is provided and slug is not (or if updating name)
  if (data.name && body.slug) {
    data.slug = body.slug;
  } else if (data.name) {
    data.slug = slugify(data.name);
  }

  // Price validation
  if (data.price !== undefined && data.price < 0) {
    throw Object.assign(new Error('Price cannot be negative'), { statusCode: 400 });
  }

  // Stock validation
  if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
    throw Object.assign(new Error('Stock quantity cannot be negative'), { statusCode: 400 });
  }

  return data;
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Larger limit for admin
    const skip = (page - 1) * limit;

    const totalCount = await Product.countDocuments();
    const products = await Product.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: products.length,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = extractProductData(req.body);
    const product = new Product(data);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = extractProductData(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    // Soft delete by setting isActive to false instead of physical deletion
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deactivated safely', data: product });
  } catch (error) {
    next(error);
  }
};
