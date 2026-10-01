const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('../utils/slugify');

exports.getAllProducts = async (filters = {}) => {
  const query = {};
  
  
  if (filters.category) {
    
    const categoryDoc = await Category.findOne({ slug: filters.category });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else {
      
      return { products: [], currentPage: 1, totalPages: 0, totalCount: 0 };
    }
  }

  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 12;
  const skip = (page - 1) * limit;

  
  const totalCount = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .skip(skip)
    .limit(limit);

  return {
    products,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount
  };
};

exports.getProductByIdOrSlug = async (identifier) => {
  
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
