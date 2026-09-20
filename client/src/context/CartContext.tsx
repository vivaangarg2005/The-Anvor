'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart, updateCartItem, removeCartItem, getProduct, mergeGuestCart } from '../lib/api';

export type CartItem = {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image: string | null;
  };
  quantity: number;
  lineTotal: number;
};

export type CartState = {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
};

type GuestCartItem = {
  productId: string;
  quantity: number;
};

type CartContextType = {
  cart: CartState | null;
  isLoading: boolean;
  isUpdating: boolean;
  isGuest: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  mergeGuestCartIfAny: () => Promise<void>;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const hydrateGuestCart = async (localItems: GuestCartItem[]) => {
    let subtotal = 0;
    let itemCount = 0;
    const validItems: CartItem[] = [];

    for (const item of localItems) {
      try {
        const res = await getProduct(item.productId);
        const product = res?.data;
        if (product && product.isActive) {
          const qty = item.quantity;
          const lineTotal = product.price * qty;
          subtotal += lineTotal;
          itemCount += qty;
          validItems.push({
            product: {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              image: product.images?.[0] || null,
            },
            quantity: qty,
            lineTotal,
          });
        }
      } catch (err) {
        console.error('Failed to hydrate guest item', err);
      }
    }

    setCart({
      id: 'guest',
      items: validItems,
      itemCount,
      subtotal,
    });
    // Sync valid items back to storage (prunes inactive ones)
    saveGuestCart(validItems.map(i => ({ productId: i.product._id, quantity: i.quantity })));
  };

  const getGuestCart = (): GuestCartItem[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('guest_cart');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  const saveGuestCart = (items: GuestCartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guest_cart', JSON.stringify(items));
    }
  };

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const response = await getCart();
      if (response && response.data) {
        setCart(response.data);
        setIsGuest(false);
      } else {
        // Unauthenticated -> Use Guest Cart
        setIsGuest(true);
        const localItems = getGuestCart();
        await hydrateGuestCart(localItems);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setIsGuest(true);
      const localItems = getGuestCart();
      await hydrateGuestCart(localItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuestAdd = async (productId: string, quantity: number) => {
    const items = getGuestCart();
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
    } else {
      items.push({ productId, quantity: Math.min(10, quantity) });
    }
    saveGuestCart(items);
    await hydrateGuestCart(items);
  };

  const addProductToCart = async (productId: string, quantity: number) => {
    setIsUpdating(true);
    try {
      if (isGuest) {
        await handleGuestAdd(productId, quantity);
      } else {
        const response = await addToCart(productId, quantity);
        if (response.data) setCart(response.data);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGuestUpdate = async (productId: string, quantity: number) => {
    const items = getGuestCart();
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity = Math.max(1, Math.min(10, quantity));
      saveGuestCart(items);
      await hydrateGuestCart(items);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setIsUpdating(true);
    try {
      if (isGuest) {
        await handleGuestUpdate(productId, quantity);
      } else {
        const response = await updateCartItem(productId, quantity);
        if (response.data) setCart(response.data);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGuestRemove = async (productId: string) => {
    const items = getGuestCart().filter(i => i.productId !== productId);
    saveGuestCart(items);
    await hydrateGuestCart(items);
  };

  const removeItem = async (productId: string) => {
    setIsUpdating(true);
    try {
      if (isGuest) {
        await handleGuestRemove(productId);
      } else {
        const response = await removeCartItem(productId);
        if (response.data) setCart(response.data);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const mergeGuestCartIfAny = async () => {
    const guestItems = getGuestCart();
    if (guestItems.length > 0) {
      try {
        const res = await mergeGuestCart(guestItems);
        if (res.data) setCart(res.data);
        localStorage.removeItem('guest_cart');
      } catch (err) {
        console.error('Failed to merge guest cart', err);
      }
    } else {
      await fetchCart();
    }
    setIsGuest(false);
  };

  const clearCart = () => {
    setCart(null);
    setIsGuest(true);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isUpdating,
        isGuest,
        addToCart: addProductToCart,
        updateQuantity,
        removeItem,
        refreshCart: fetchCart,
        mergeGuestCartIfAny,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
