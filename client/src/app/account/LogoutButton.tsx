'use client';

import { useRouter } from 'next/navigation';
import { logout } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { setClientUserId } from '../../lib/authStore';

export default function LogoutButton() {
  const router = useRouter();
  const { clearCart, refreshCart } = useCart();

  const handleLogout = async () => {
    clearCart();
    await logout();
    await refreshCart();
    setClientUserId(null);

    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors"
    >
      Sign Out
    </button>
  );
}
