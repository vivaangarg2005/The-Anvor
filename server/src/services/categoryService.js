const Category = require('../models/Category');
const slugify = require('../utils/slugify');

exports.getAllCategories = async () => {
  return await Category.find();
};

exports.getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }
  return category;
};

exports.createCategory = async (data) => {
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const category = new Category(data);
  return await category.save();
};

exports.updateCategory = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  // { new: true } returns the updated document. { runValidators: true } ensures constraints.
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }
  return category;
};

exports.deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }
  return category;
};
