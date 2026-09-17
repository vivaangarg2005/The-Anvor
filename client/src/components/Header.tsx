'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
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
      return pathname === linkHref && !searchParams.get('category');
    }
    const category = searchParams.get('category');
    if (category && linkHref.includes(category)) return true;
    return false;
  };

  return (
    <header className="bg-[#FFFFFF] border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden flex-1">
          <button 
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900 focus:outline-none"
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 flex-1">
          {navLinks.map((link) => {
            const isActive = checkIsActive(link.href, link.isExact);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'text-stone-900 border-b-2 border-stone-900 pb-1'
                    : 'text-stone-500 hover:text-stone-900 pb-1 border-b-2 border-transparent'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Brand */}
        <Link href="/" className="flex flex-col items-center hover:opacity-80 transition-opacity">
          <span className="text-xl md:text-2xl font-black tracking-[0.2em] text-stone-900 font-serif uppercase">
            THE ANVOR
          </span>
        </Link>

        {/* Utility Navigation */}
        <div className="flex gap-4 items-center justify-end flex-1">
          {isLoggedIn ? (
            <Link
              href="/account"
              className={`text-sm font-medium tracking-wide transition-colors hidden sm:block ${
                pathname === '/account' ? 'text-stone-900 border-b-2 border-stone-900 pb-1' : 'text-stone-500 hover:text-stone-900 pb-1 border-b-2 border-transparent'
              }`}
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className={`text-sm font-medium tracking-wide transition-colors hidden sm:block ${
                pathname === '/login' ? 'text-stone-900 border-b-2 border-stone-900 pb-1' : 'text-stone-500 hover:text-stone-900 pb-1 border-b-2 border-transparent'
              }`}
            >
              Sign In
            </Link>
          )}
          
          <button disabled className="p-2 -mr-2 text-stone-600 hover:text-stone-900 cursor-not-allowed flex items-center gap-1 group">
            <span className="hidden sm:inline text-sm font-medium tracking-wide mr-1 text-stone-500 group-hover:text-stone-900 transition-colors">Bag</span>
            <svg className="w-5 h-5 transition-colors group-hover:text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs font-bold text-stone-900">0</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-t border-stone-100 absolute w-full shadow-xl">
          <div className="px-6 pt-4 pb-8 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block py-4 text-sm font-bold text-stone-900 border-b border-stone-100 uppercase tracking-widest"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 flex flex-col gap-4">
              <Link
                href={isLoggedIn ? "/account" : "/login"}
                className="text-sm font-bold text-stone-600 uppercase tracking-widest"
              >
                {isLoggedIn ? "My Account" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
