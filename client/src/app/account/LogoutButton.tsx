'use client';

import { useRouter } from 'next/navigation';
import { logout } from '../../lib/api';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
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
