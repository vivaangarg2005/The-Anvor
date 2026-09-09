const Product = require('../models/Product');
const slugify = require('../utils/slugify');

exports.getAllProducts = async (filters = {}) => {
  const query = {};
  
  // Basic filtering capability
  if (filters.category) query.category = filters.category;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  // Return products and populate the 'category' field with just the name and slug
  return await Product.find(query).populate('category', 'name slug');
};

exports.getProductByIdOrSlug = async (identifier) => {
  // Determine if the identifier is a MongoDB ObjectId or a text slug
  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: identifier } : { slug: identifier };
  
  const product = await Product.findOne(query).populate('category', 'name slug');
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};

exports.createProduct = async (data) => {
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const product = new Product(data);
  return await product.save();
};

exports.updateProduct = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};

exports.deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};
