'use client';

import { useState, useEffect } from 'react';

/**
 * Displays a live countdown showing how much time remains to complete payment.
 * When the timer hits zero, shows an "expired" message and triggers a page refresh
 * so the server can lazily update the order status.
 */
export default function OrderExpiryBanner({ expiresAt }: { expiresAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const expiryDate = new Date(expiresAt).getTime();

    const tick = () => {
      const now = Date.now();
      const remaining = expiryDate - now;

      if (remaining <= 0) {
        setExpired(true);
        setTimeLeft(0);
        // Refresh the page so the server marks the order as EXPIRED
        setTimeout(() => window.location.reload(), 2000);
        return false; // stop interval
      }

      setTimeLeft(remaining);
      return true; // continue interval
    };

    // Initial tick
    if (!tick()) return;

    const interval = setInterval(() => {
      if (!tick()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  if (expired) {
    return (
      <div className="mt-4 bg-red-50 border border-red-200 p-4">
        <p className="text-xs text-red-700 font-bold uppercase tracking-widest">
          ⏰ Payment window expired — Refreshing...
        </p>
      </div>
    );
  }

  const isUrgent = timeLeft < 5 * 60 * 1000; // less than 5 minutes

  return (
    <div className={`mt-4 border p-4 ${isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-stone-50 border-stone-200'}`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${isUrgent ? 'text-orange-700' : 'text-stone-600'}`}>
        ⏱ Complete payment within{' '}
        <span className="font-mono text-sm">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </p>
      <p className="text-[10px] text-stone-500 mt-1">
        Price is locked for this period. After expiry, you&apos;ll need to create a new order at current prices.
      </p>
    </div>
  );
}
