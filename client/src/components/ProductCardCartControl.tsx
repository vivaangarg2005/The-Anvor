'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';

interface ProductCardCartControlProps {
  productId: string;
  stockQuantity: number;
}

export default function ProductCardCartControl({ productId, stockQuantity }: ProductCardCartControlProps) {
  const { cart, addToCart, updateQuantity, removeItem, isUpdating } = useCart();
  const [localLoading, setLocalLoading] = useState(false);

  // Derive quantity from the SINGLE SOURCE OF TRUTH (CartContext)
  const cartItem = cart?.items.find(item => item.product._id === productId);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = stockQuantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localLoading || isUpdating || isOutOfStock) return;
    
    setLocalLoading(true);
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localLoading || isUpdating || quantity >= 10 || isOutOfStock) return;

    setLocalLoading(true);
    try {
      await updateQuantity(productId, quantity + 1);
    } catch (error) {
      console.error('Failed to increase quantity:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localLoading || isUpdating || quantity <= 0) return;

    setLocalLoading(true);
    try {
      if (quantity === 1) {
        await removeItem(productId);
      } else {
        await updateQuantity(productId, quantity - 1);
      }
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = localLoading || isUpdating;

  if (quantity > 0) {
    return (
      <div 
        className="mt-4 flex items-center justify-between border border-stone-200 h-10 bg-white cursor-auto"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isLoading}
          className="w-10 h-full flex items-center justify-center text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors cursor-pointer"
        >
          -
        </button>
        <span className="text-xs font-medium text-stone-900">{quantity}</span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isLoading || quantity >= 10 || isOutOfStock}
          className="w-10 h-full flex items-center justify-center text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isLoading || isOutOfStock}
        className="mt-4 w-full bg-transparent border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white text-[10px] font-bold tracking-widest uppercase h-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isOutOfStock ? 'Sold Out' : (localLoading ? 'Adding...' : 'Add to Cart')}
      </button>
    </div>
  );
}
