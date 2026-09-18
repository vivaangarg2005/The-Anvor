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
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
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

  // Ensure cart exists safely (first-cart creation race)
  await Cart.updateOne(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true }
  );

  // Atomic operation: Push the item with quantity 0 ONLY if it does not already exist
  await Cart.updateOne(
    { user: userId, 'items.product': { $ne: productId } },
    { $push: { items: { product: productId, quantity: 0 } } }
  );

  // Atomic operation: Increment the quantity safely
  const incCart = await Cart.findOneAndUpdate(
    { user: userId, 'items.product': productId },
    { $inc: { 'items.$.quantity': qty } },
    { new: true }
  );

  // Enforce the maximum cap of 10
  if (incCart) {
    const item = incCart.items.find(i => i.product.toString() === productId.toString());
    if (item && item.quantity > 10) {
      await Cart.updateOne(
        { user: userId, 'items.product': productId },
        { $set: { 'items.$.quantity': 10 } }
      );
    }
  }

  // Return the fully populated and calculated cart
  return getCart(userId);
};

/**
 * Update the exact quantity of an existing cart item.
 */
const updateItemQuantity = async (userId, productId, quantity) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0 || qty > 10) {
    const err = new Error('Quantity must be between 1 and 10.');
    err.statusCode = 400;
    throw err;
  }

  const result = await Cart.updateOne(
    { user: userId, 'items.product': productId },
    { $set: { 'items.$.quantity': qty } }
  );

  if (result.matchedCount === 0) {
    const err = new Error('Product not found in cart.');
    err.statusCode = 404;
    throw err;
  }

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

/**
 * Merge an array of guest items into the authenticated user's cart.
 */
const mergeGuestCart = async (userId, items) => {
  if (!items || !Array.isArray(items)) {
    return getCart(userId);
  }

  // Iterate sequentially to avoid massive concurrent spikes if the guest cart is large
  for (const item of items) {
    if (item.productId && item.quantity > 0) {
      try {
        await addItem(userId, item.productId, item.quantity);
      } catch (err) {
        // Silently ignore individual failures (e.g. out of stock, max 10 exceeded)
        // so the rest of the merge succeeds
      }
    }
  }

  return getCart(userId);
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
};
