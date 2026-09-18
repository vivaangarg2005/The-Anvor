'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';

interface AddToCartFormProps {
  product: {
    _id: string;
    stockQuantity: number;
  };
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const { cart, addToCart, updateQuantity, removeItem, isUpdating } = useCart();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartItem = cart?.items.find(item => item.product._id === product._id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity <= 0 || isUpdating || localLoading) return;
    setError(null);
    setLocalLoading(true);
    try {
      if (quantity === 1) {
        await removeItem(product._id);
      } else {
        await updateQuantity(product._id, quantity - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (quantity >= 10 || isUpdating || localLoading || isOutOfStock) return;
    setError(null);
    setLocalLoading(true);
    try {
      await updateQuantity(product._id, quantity + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUpdating || localLoading || isOutOfStock) return;
    setError(null);
    setLocalLoading(true);
    try {
      await addToCart(product._id, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart.');
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = isUpdating || localLoading;

  return (
    <div className="mt-auto">
      {error && (
        <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-100 p-3">
          {error}
        </div>
      )}
      {quantity > 0 ? (
        <div className="w-full sm:w-48 border border-stone-200 flex items-center justify-between px-6 h-13 bg-transparent mb-4">
          <button 
            type="button"
            onClick={handleDecrease}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors w-10 h-full flex justify-start items-center cursor-pointer"
          >
            -
          </button>
          <span className="text-sm font-medium text-stone-900">{quantity}</span>
          <button 
            type="button"
            onClick={handleIncrease}
            disabled={quantity >= 10 || isOutOfStock || isLoading}
            className="text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors w-10 h-full flex justify-end items-center cursor-pointer"
          >
            +
          </button>
        </div>
      ) : (
        <button 
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock || isLoading}
          className="w-full sm:w-48 bg-stone-900 text-white text-xs font-semibold h-13 uppercase tracking-widest transition-colors hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed mb-4 cursor-pointer"
        >
          {isOutOfStock ? 'Sold Out' : (isLoading ? 'Adding...' : 'Add to Cart')}
        </button>
      )}
    </div>
  );
}
