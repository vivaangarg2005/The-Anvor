import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Anvor | Premium Handbags',
  description: 'Shop the finest collection of premium handbags, tote bags, and accessories.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        {/* Basic Storefront Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Brand */}
            <Link href="/" className="text-xl font-black tracking-tight text-indigo-600 hover:opacity-80 transition-opacity">
              THE ANVOR
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex gap-8">
              <Link href="/products" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                All Products
              </Link>
              <Link href="/products?category=handbags" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                Handbags
              </Link>
              <Link href="/products?category=tote-bags" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                Totes
              </Link>
            </nav>

            {/* Utility Navigation (Placeholders for Future) */}
            <div className="flex gap-4 items-center">
              <button disabled className="text-sm font-medium text-gray-400 cursor-not-allowed">
                Account
              </button>
              <button disabled className="text-sm font-medium text-gray-400 cursor-not-allowed flex items-center gap-1">
                Cart (0)
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Basic Footer */}
        <footer className="bg-white border-t border-gray-200 py-12 mt-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} The Anvor. Development Catalog.
          </div>
        </footer>
      </body>
    </html>
  );
}
