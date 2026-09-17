const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price must be positive'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    attributes: {
      // Flexible key-value pairs. Enables adding 'laptop_compartment' later 
      // without changing the core Mongoose schema.
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// Indexes
// (slug and sku are already indexed automatically because of unique: true)
// 3. Category for quickly finding all products in a category
productSchema.index({ category: 1 });
// 4. isActive to efficiently filter out disabled products on the public store
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
