'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initiatePayment, verifyPayment } from '../../../lib/api';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OrderSuccessClient({ order: initialOrder }: { order: any }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePayNow = async () => {
    setPaymentError('');
    setIsPaymentLoading(true);

    try {
      // Step 1: Backend creates/reuses a Razorpay order, returns safe public data
      const paymentData = await initiatePayment(order._id);
      const { razorpayOrderId, amount, currency, keyId } = paymentData.data;

      // Step 2: Load Razorpay Checkout script dynamically if not already present
      await loadRazorpayScript();

      // Step 3: Open Razorpay Checkout — secret key NEVER used here, only keyId
      const razorpayOptions = {
        key: keyId,
        amount,
        currency,
        name: 'The Anvor',
        description: `Order ${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Step 4: Payment completed — send to backend for cryptographic verification
          setIsPaymentLoading(true);
          try {
            const verifyResult = await verifyPayment(order._id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResult.success && verifyResult.data.paymentStatus === 'PAID') {
              // Update local state to reflect PAID without a full reload
              setOrder({ ...order, paymentStatus: 'PAID', status: 'PROCESSING' });
              // Force Next.js router to drop stale cache for this order
              router.refresh();
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setIsPaymentLoading(false);
          }
        },
        prefill: {
          // Pass contact details from the order's shipping address snapshot
          name: order.shippingAddress?.recipientName || '',
          contact: order.shippingAddress?.phone || '',
        },
        theme: {
          color: '#1c1917', // stone-900
        },
        modal: {
          ondismiss: () => {
            // User closed checkout — do NOT mark as failed, allow retry
            setIsPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);

      rzp.on('payment.failed', (response: { error: { description: string } }) => {
        setPaymentError(response.error.description || 'Payment failed. Please try again.');
        setIsPaymentLoading(false);
      });

      rzp.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start payment';
      setPaymentError(message);
      setIsPaymentLoading(false);
    }
  };

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <>
      {/* Razorpay Checkout script — loaded once on demand */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="bg-background min-h-[70vh] flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-md w-full text-center space-y-8">

          {/* Checkmark */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-8 ${isPaid ? 'bg-stone-900' : 'bg-stone-200'}`}>
            {isPaid ? (
              <svg className="w-8 h-8 text-stone-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
              </svg>
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-serif text-stone-900 mb-4">
              {isPaid ? 'Your order is placed successfully' : 'Order created — Payment pending'}
            </h1>
            <p className="text-stone-500 mb-8">
              {isPaid
                ? 'Thank you for your order. We are processing it and will update you soon.'
                : 'Your order is saved. Complete payment to confirm it.'}
            </p>
          </div>

          {/* Order summary card */}
          <div className="bg-stone-50 border border-stone-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Order Number</span>
              <span className="font-bold text-stone-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-stone-200 pt-4">
              <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Total Amount</span>
              <span className="font-bold text-stone-900">₹{order.grandTotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-stone-200 pt-4">
              <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Payment Status</span>
              <span className={`font-bold text-[10px] uppercase tracking-widest px-2 py-1 ${isPaid ? 'bg-stone-900 text-stone-50' : 'bg-orange-100 text-orange-900'}`}>
                {isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
            {isPaid && order.status && (
              <div className="flex justify-between items-center text-sm border-t border-stone-200 pt-4">
                <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Order Status</span>
                <span className="font-medium text-stone-900 text-sm">{order.status}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {paymentError && (
            <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 p-3">
              {paymentError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            {!isPaid && (
              <button
                onClick={handlePayNow}
                disabled={isPaymentLoading}
                className={`w-full bg-stone-900 text-stone-50 py-4 text-[10px] uppercase tracking-widest font-bold transition-colors ${isPaymentLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-800'}`}
              >
                {isPaymentLoading ? 'Opening Payment...' : 'Pay Now'}
              </button>
            )}
            <Link
              href={`/account/orders/${order._id}`}
              className="w-full bg-transparent text-stone-900 border border-stone-900 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-stone-100 transition-colors text-center"
            >
              View Order
            </Link>
            <Link
              href="/products"
              className="w-full text-stone-500 py-2 text-[10px] uppercase tracking-widest font-bold hover:text-stone-900 transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Dynamically loads the Razorpay checkout script once
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.head.appendChild(script);
  });
}
