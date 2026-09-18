/**
 * cartController.js
 * Thin HTTP layer for cart operations.
 */

const cartService = require('../services/cartService');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.getCart(userId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const cart = await cartService.addItem(userId, productId, quantity || 1);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const updateItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateItemQuantity(userId, productId, quantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const cart = await cartService.removeItem(userId, productId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.clearCart(userId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items array is required for merging.' });
    }

    const cart = await cartService.mergeGuestCart(userId, items);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeCart,
};
