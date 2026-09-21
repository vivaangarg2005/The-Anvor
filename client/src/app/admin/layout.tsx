'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await getMe();
        if (res.success && res.data && res.data.role === 'ADMIN') {
          setIsAuthorized(true);
        } else {
          router.replace('/account');
        }
      } catch (err) {
        console.error('Admin auth error:', err);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Verifying Access...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-stone-900 text-stone-50 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-serif text-xl tracking-wide hover:opacity-80 transition-opacity">
              The Anvor <span className="text-[10px] uppercase tracking-widest ml-2 bg-stone-50 text-stone-900 px-2 py-1 rounded-sm font-bold">Admin</span>
            </Link>
            <nav className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest font-bold">
              <Link href="/admin/products" className="hover:text-stone-300 transition-colors">Products</Link>
              <Link href="/admin/orders" className="hover:text-stone-300 transition-colors">Orders</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
            <Link href="/account" className="hover:text-stone-300 transition-colors">Exit Admin</Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {children}
      </main>
    </div>
  );
}
