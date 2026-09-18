/**
 * cartService.js
 * Business logic for the shopping cart.
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Returns a sanitized cart object with authoritative server-side calculations.
 * Prunes items that are no longer active or have been deleted.
 */
const getCart = async (userId) => {
  // Ensure cart exists
  let cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Calculate totals and prune invalid items
  let subtotal = 0;
  let itemCount = 0;
  const validItems = [];
  let requiresSave = false;

  for (const item of cart.items) {
    const product = item.product;

    // Check if product exists and is active
    if (!product || !product.isActive) {
      requiresSave = true; // Needs pruning
      continue;
    }

    const qty = item.quantity;
    const price = product.price; // Authoritative price from DB
    const lineTotal = price * qty;

    subtotal += lineTotal;
    itemCount += qty;

    validItems.push({
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
      },
      quantity: qty,
      lineTotal,
    });
  }

  // If we found deleted/inactive items, prune them from the DB silently
  if (requiresSave) {
    // We only keep the valid ones
    await Cart.updateOne(
      { user: userId },
      { $set: { items: validItems.map(vi => ({ product: vi.product._id, quantity: vi.quantity })) } }
    );
  }

  return {
    id: cart._id,
    items: validItems,
    itemCount,
    subtotal,
  };
};

/**
 * Add an item to the cart or increment its quantity.
 */
const addItem = async (userId, productId, quantity) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const err = new Error('Quantity must be a positive integer.');
    err.statusCode = 400;
    throw err;
  }

  // Authoritative product validation
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!product.isActive) {
    const err = new Error('This product is currently unavailable.');
    err.statusCode = 400;
    throw err;
  }

  // We do not decrement stock, but we should not allow adding if out of stock
  if (product.stockQuantity <= 0) {
    const err = new Error('This product is currently out of stock.');
    err.statusCode = 400;
    throw err;
  }

  // Ensure cart exists
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (existingItemIndex > -1) {
    // Increment existing
    const newQty = cart.items[existingItemIndex].quantity + qty;
    cart.items[existingItemIndex].quantity = Math.min(10, newQty); // Cap at 10
  } else {
    // Add new
    cart.items.push({
      product: productId,
      quantity: Math.min(10, qty),
    });
  }

  await cart.save();

  // Return the fully populated and calculated cart
  return getCart(userId);
};

/**
 * Update the exact quantity of an existing cart item.
 */
const updateItemQuantity = async (userId, productId, quantity) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0 || qty > 10) {
    const err = new Error('Quantity must be between 1 and 10.');
    err.statusCode = 400;
    throw err;
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error('Cart not found.');
    err.statusCode = 404;
    throw err;
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
  if (itemIndex === -1) {
    const err = new Error('Product not found in cart.');
    err.statusCode = 404;
    throw err;
  }

  cart.items[itemIndex].quantity = qty;
  await cart.save();

  return getCart(userId);
};

/**
 * Remove a specific item from the cart.
 */
const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return getCart(userId);
  }

  // Atomic pull to avoid race conditions when removing
  await Cart.updateOne(
    { user: userId },
    { $pull: { items: { product: productId } } }
  );

  return getCart(userId);
};

/**
 * Clear all items from the cart.
 */
const clearCart = async (userId) => {
  await Cart.updateOne(
    { user: userId },
    { $set: { items: [] } },
    { upsert: true }
  );
  return getCart(userId);
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
