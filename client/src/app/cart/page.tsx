'use client';

import { useCart } from '../../context/CartContext';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeItem, isUpdating, isGuest } = useCart();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 flex justify-center">
        <span className="text-[10px] text-stone-500 uppercase tracking-widest">Loading Cart...</span>
      </div>
    );
  }

  // Handle unauthenticated state or error leading to null cart implicitly treated as empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-serif text-stone-900 mb-4 tracking-tight">Your cart is empty</h1>
        <p className="text-sm text-stone-500 mb-8 max-w-sm leading-relaxed">
          Discover our collection of premium handbags, totes, and accessories.
        </p>
        <Link 
          href="/products" 
          className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-10 py-4 transition-colors hover:bg-stone-800 cursor-pointer"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-serif text-stone-900 tracking-tight mb-12">The Cart</h1>

      <div className="flex flex-col lg:flex-row gap-16">
        
        {/* Left: Cart Items */}
        <div className="w-full lg:w-2/3">
          <div className="hidden md:grid grid-cols-12 pb-4 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-6">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-3 text-right">Total</div>
          </div>

          <div className="space-y-12 md:space-y-8">
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-6">
                
                {/* Product Info */}
                <div className="md:col-span-6 flex gap-6">
                  <div className="w-24 h-32 bg-stone-100 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.product.image || 'https://via.placeholder.com/200x300?text=No+Image'} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <Link href={`/products/${item.product.slug}`} className="text-base font-serif text-stone-900 hover:opacity-70 transition-opacity">
                      {item.product.name}
                    </Link>
                    <span className="text-sm text-stone-500 mt-1">₹{item.product.price}</span>
                    <button 
                      onClick={() => removeItem(item.product._id)}
                      disabled={isUpdating}
                      className="mt-4 text-[10px] text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors self-start disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="md:col-span-3 flex justify-start md:justify-center">
                  <div className="w-32 border border-stone-200 flex items-center justify-between px-4 h-12 bg-transparent">
                    <button 
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeItem(item.product._id);
                        } else {
                          updateQuantity(item.product._id, item.quantity - 1);
                        }
                      }}
                      disabled={isUpdating}
                      className="text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors px-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium text-stone-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= 10 || isUpdating}
                      className="text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors px-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="md:col-span-3 flex justify-start md:justify-end">
                  <span className="text-base text-stone-900">₹{item.lineTotal}</span>
                </div>
                
              </div>
            ))}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-stone-50 p-8">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6 pb-4 border-b border-stone-200">Order Summary</h2>
            
            <div className="flex justify-between mb-4 text-sm text-stone-600">
              <span>Subtotal</span>
              <span>₹{cart.subtotal}</span>
            </div>
            <div className="flex justify-between mb-6 text-sm text-stone-600">
              <span>Shipping</span>
              <span className="text-stone-400">Calculated at checkout</span>
            </div>

            <div className="flex justify-between mb-8 pb-6 border-b border-stone-200 text-base font-medium text-stone-900">
              <span>Estimated Total</span>
              <span>₹{cart.subtotal}</span>
            </div>

            {isGuest ? (
              <button 
                onClick={() => router.push('/login?redirect=/checkout')}
                className="w-full bg-stone-900 text-white text-[10px] font-bold h-13 uppercase tracking-widest transition-colors hover:bg-stone-800 cursor-pointer mb-4"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button 
                onClick={() => router.push('/checkout')}
                className="w-full bg-stone-900 text-white text-[10px] font-bold h-13 uppercase tracking-widest transition-colors hover:bg-stone-800 cursor-pointer mb-4"
              >
                Proceed to Checkout
              </button>
            )}
            
            <Link 
              href="/products" 
              className="block w-full text-center text-[10px] text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
