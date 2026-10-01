const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  let subtotal = 0;
  let itemCount = 0;
  const validItems = [];
  let requiresSave = false;

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      requiresSave = true;
      continue;
    }

    const qty = item.quantity;
    const price = product.price;
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
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : null,
      },
      quantity: qty,
      lineTotal,
    });
  }

  if (requiresSave) {
    await Cart.updateOne(
      { user: userId },
      {
        $set: {
          items: validItems.map((vi) => ({
            product: vi.product._id,
            quantity: vi.quantity,
          })),
        },
      },
    );
  }

  return {
    id: cart._id,
    items: validItems,
    itemCount,
    subtotal,
  };
};

const addItem = async (userId, productId, quantity) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    const err = new Error("Quantity must be a positive integer.");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error("Product not found.");
    err.statusCode = 404;
    throw err;
  }

  if (!product.isActive) {
    const err = new Error("This product is currently unavailable.");
    err.statusCode = 400;
    throw err;
  }

  if (product.stockQuantity <= 0) {
    const err = new Error("This product is currently out of stock.");
    err.statusCode = 400;
    throw err;
  }

  await Cart.updateOne(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true },
  );

  await Cart.updateOne(
    { user: userId, "items.product": { $ne: productId } },
    { $push: { items: { product: productId, quantity: 0 } } },
  );

  const incCart = await Cart.findOneAndUpdate(
    { user: userId, "items.product": productId },
    { $inc: { "items.$.quantity": qty } },
    { new: true },
  );

  if (incCart) {
    const item = incCart.items.find(
      (i) => i.product.toString() === productId.toString(),
    );
    if (item && item.quantity > 10) {
      await Cart.updateOne(
        { user: userId, "items.product": productId },
        { $set: { "items.$.quantity": 10 } },
      );
    }
  }

  return getCart(userId);
};

const updateItemQuantity = async (userId, productId, quantity) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0 || qty > 10) {
    const err = new Error("Quantity must be between 1 and 10.");
    err.statusCode = 400;
    throw err;
  }

  const result = await Cart.updateOne(
    { user: userId, "items.product": productId },
    { $set: { "items.$.quantity": qty } },
  );

  if (result.matchedCount === 0) {
    const err = new Error("Product not found in cart.");
    err.statusCode = 404;
    throw err;
  }

  return getCart(userId);
};

const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return getCart(userId);
  }

  await Cart.updateOne(
    { user: userId },
    { $pull: { items: { product: productId } } },
  );

  return getCart(userId);
};

const clearCart = async (userId) => {
  await Cart.updateOne(
    { user: userId },
    { $set: { items: [] } },
    { upsert: true },
  );
  return getCart(userId);
};

const mergeGuestCart = async (userId, items) => {
  if (!items || !Array.isArray(items)) {
    return getCart(userId);
  }

  for (const item of items) {
    if (item.productId && item.quantity > 0) {
      try {
        await addItem(userId, item.productId, item.quantity);
      } catch (err) {}
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
