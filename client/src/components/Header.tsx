'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useCart } from '../context/CartContext';

function CartCountBadge() {
  const { cart, isLoading } = useCart();
  if (isLoading || !cart) return null;
  
  if (cart.itemCount === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
      {cart.itemCount}
    </span>
  );
}

function HeaderContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line
    setIsMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { name: 'Shop All', href: '/products', isExact: true },
    { name: 'Handbags', href: '/products?category=handbags' },
    { name: 'Totes', href: '/products?category=tote-bags' },
  ];

  const checkIsActive = (linkHref: string, isExact?: boolean) => {
    if (isExact) {
      return pathname === linkHref && !searchParams?.get('category');
    }
    const category = searchParams?.get('category');
    if (category && linkHref.includes(category)) return true;
    return false;
  };

  return (
    <header className="bg-background sticky top-0 z-50">
      <div className="w-full px-8 md:px-16 h-20 flex items-center justify-between">
        
        {/* Mobile Left: Menu Toggle */}
        <div className="flex items-center md:hidden flex-1">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 text-stone-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Left: Navigation */}
        <nav className="hidden md:flex gap-8 flex-1">
          {navLinks.map((link) => {
            const isActive = checkIsActive(link.href, link.isExact);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm transition-colors relative py-1 ${
                  isActive ? 'text-stone-900 font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-stone-900"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Center: Brand */}
        <div className="flex-1 md:flex-none flex justify-center">
          <Link href="/" className="flex flex-col items-center group">
            <span className="text-xl md:text-2xl font-serif tracking-[0.2em] font-bold text-stone-900 uppercase group-hover:opacity-80 transition-opacity">
              THE ANVOR
            </span>
          </Link>
        </div>

        {/* Right: Utilities */}
        <div className="flex gap-8 items-center justify-end flex-1">
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="hidden sm:block text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            {isLoggedIn ? "Account" : "Sign In"}
          </Link>
          
          <Link href="/cart" className="text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-2 group cursor-pointer">
            <span className="hidden sm:inline text-sm">Cart</span>
            <div className="relative flex items-center">
              <svg className="w-5 h-5 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <CartCountBadge />
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div 
        className={`md:hidden absolute w-full bg-background border-b border-stone-200 transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100 shadow-sm' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-lg font-serif text-stone-900 tracking-wide"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px w-full bg-stone-100 my-2"></div>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="text-sm tracking-widest uppercase text-stone-500"
          >
            {isLoggedIn ? "My Account" : "Sign In"}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Suspense fallback={
      <header className="bg-background sticky top-0 z-50 h-20">
        <div className="w-full px-8 md:px-16 h-full flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex-1 flex justify-center">
            <span className="text-xl md:text-2xl font-serif tracking-[0.2em] font-bold text-stone-900 uppercase">
              THE ANVOR
            </span>
          </div>
          <div className="flex-1"></div>
        </div>
      </header>
    }>
      <HeaderContent isLoggedIn={isLoggedIn} />
    </Suspense>
  );
}
