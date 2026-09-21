'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { getMe, AddressType, createOrder } from '../../lib/api';
import Link from 'next/link';
import AddressBook from '../../components/AddressBook';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, refreshCart } = useCart();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const userData = await getMe();
        if (!userData || !userData.data) {
          router.replace('/login?redirect=/checkout');
          return;
        }
        setUser(userData.data);
        setIsAuthLoading(false);
      } catch (err) {
        console.error('Failed to load checkout data', err);
        router.replace('/login?redirect=/checkout');
      }
    }
    checkAuthAndLoadData();
  }, [router]);

  const handleAddressesLoaded = (addresses: AddressType[]) => {
    // Selection logic
    if (addresses.length === 0) {
      setSelectedAddressId(undefined);
    } else {
      // If currently selected address is deleted or invalid, select default
      const currentExists = addresses.find(a => a._id === selectedAddressId);
      if (!currentExists) {
        const defaultAddr = addresses.find(a => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr._id : addresses[0]._id);
      }
    }
  };

  // Redirect if cart is empty after loading (but not after a successful order)
  useEffect(() => {
    if (!isCartLoading && !isAuthLoading && !isOrderPlaced) {
      if (!cart || cart.items.length === 0) {
        router.replace('/cart');
      }
    }
  }, [cart, isCartLoading, isAuthLoading, isOrderPlaced, router]);


  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select a shipping address');
      return;
    }
    setOrderError('');
    setIsPlacingOrder(true);
    
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await createOrder({ 
        addressId: selectedAddressId, 
        idempotencyKey 
      });
      
      if (response.success) {
        setIsOrderPlaced(true);
        await refreshCart();
        router.push(`/order-success/${response.data._id}`);
      } else {
        setOrderError('Failed to place order. Please try again.');
        setIsPlacingOrder(false);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setOrderError(err.message || 'An error occurred while placing the order');
      setIsPlacingOrder(false);
    }
  };

  if (isCartLoading || isAuthLoading || !user || !cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 flex justify-center">
        <span className="text-[10px] text-stone-500 uppercase tracking-widest">Loading Checkout...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-serif text-stone-900 tracking-tight mb-12">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-16">
        
        {/* Left: Contact & Address */}
        <div className="w-full lg:w-2/3 space-y-12">
          
          {/* Contact Information */}
          <section>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-6">Contact Information</h2>
            <div className="bg-stone-50 p-6 border border-stone-200">
              <p className="text-sm text-stone-900 font-medium">{user.name}</p>
              <p className="text-sm text-stone-500 mt-1">{user.email || 'No email provided'}</p>
              <p className="text-sm text-stone-500 mt-1">{user.phone}</p>
            </div>
          </section>
          <section>
            <AddressBook 
              selectable={true} 
              selectedAddressId={selectedAddressId} 
              onSelectAddress={setSelectedAddressId}
              onAddressesLoaded={handleAddressesLoaded}
            />
          </section>

        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-stone-50 p-8 sticky top-24">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6 pb-4 border-b border-stone-200">Order Summary</h2>
            
            <div className="space-y-6 mb-8 border-b border-stone-200 pb-8">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex gap-4">
                  <div className="w-16 h-20 bg-stone-100 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.product.image || 'https://via.placeholder.com/100x150?text=No+Image'} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <Link href={`/products/${item.product.slug}`} className="text-sm font-serif text-stone-900 hover:opacity-70 transition-opacity line-clamp-1">
                      {item.product.name}
                    </Link>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">₹{item.product.price} × {item.quantity}</span>
                    <span className="text-sm font-medium text-stone-900 mt-auto">₹{item.lineTotal}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mb-4 text-sm text-stone-600">
              <span>Subtotal</span>
              <span>₹{cart.subtotal}</span>
            </div>
            <div className="flex justify-between mb-6 text-sm text-stone-600">
              <span>Shipping</span>
              <span className="text-stone-400">Calculated later</span>
            </div>

            <div className="flex justify-between mb-8 pb-6 border-b border-stone-200 text-base font-medium text-stone-900">
              <span>Estimated Total</span>
              <span>₹{cart.subtotal}</span>
            </div>

            {orderError && (
              <div className="mb-4 text-[10px] text-red-600 bg-red-50 p-2 border border-red-200">
                {orderError}
              </div>
            )}

            <button 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !selectedAddressId}
              className={`w-full bg-stone-900 text-white text-[10px] font-bold h-13 uppercase tracking-widest transition-colors mb-4 ${(isPlacingOrder || !selectedAddressId) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-800'}`}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Order'}
            </button>
            
            <Link 
              href="/cart" 
              className="block w-full text-center text-[10px] text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors cursor-pointer mt-4"
            >
              Return to Cart
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
