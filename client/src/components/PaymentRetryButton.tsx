'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initiatePayment, verifyPayment } from '../lib/api';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentRetryButton({ order }: { order: any }) {
  const router = useRouter();
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePayNow = async () => {
    setPaymentError('');
    setIsPaymentLoading(true);

    try {
      const paymentData = await initiatePayment(order._id);
      const { razorpayOrderId, amount, currency, keyId } = paymentData.data;

      await loadRazorpayScript();

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
          setIsPaymentLoading(true);
          try {
            const verifyResult = await verifyPayment(order._id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResult.success && verifyResult.data.paymentStatus === 'PAID') {
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
          name: order.shippingAddress?.recipientName || '',
          contact: order.shippingAddress?.phone || '',
        },
        theme: {
          color: '#1c1917',
        },
        modal: {
          ondismiss: () => {
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
  if (order.paymentStatus === 'PAID') return null;

  return (
    <div className="mt-6 flex flex-col items-start gap-3">
      {paymentError && (
        <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 p-3 w-full">
          {paymentError}
        </div>
      )}
      <button
        onClick={handlePayNow}
        disabled={isPaymentLoading}
        className={`bg-stone-900 text-stone-50 px-8 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors ${
          isPaymentLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-800'
        }`}
      >
        {isPaymentLoading ? 'Opening Payment...' : 'Pay Now'}
      </button>
    </div>
  );
}

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
