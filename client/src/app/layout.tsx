import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Header from '../components/Header';
import { getMe } from '../lib/api';
import { CartProvider } from '../context/CartContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'The Anvor | Premium Handbags',
  description: 'Shop the finest collection of premium handbags, tote bags, and accessories.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth State for Header ──
  let isLoggedIn = false;
  let userProfileImageUrl: string | null = null;
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      const meResponse = await getMe(cookieHeader);
      isLoggedIn = meResponse?.success === true;
      userProfileImageUrl = meResponse?.data?.profileImageUrl ?? null;
      userId = meResponse?.data?._id ?? null;
    }
  } catch {
    isLoggedIn = false;
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground min-h-screen flex flex-col`}>
        <CartProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <Header isLoggedIn={isLoggedIn} profileImageUrl={userProfileImageUrl} userId={userId} />
            {/* Main Content Area */}
            <main className="grow">
              {children}
            </main>
          </GoogleOAuthProvider>

          {/* Refined Minimalist Footer */}
          <footer className="bg-background border-t border-stone-200 pt-16 pb-8 md:pt-20 md:pb-10 mt-auto">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col md:flex-row gap-16 md:gap-8 justify-between">
                
                {/* Brand Area */}
                <div className="md:w-1/3 flex flex-col items-start">
                  <span className="text-xl font-serif tracking-[0.2em] text-stone-900 uppercase mb-4">THE ANVOR</span>
                  <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
                    Everyday elegance and premium accessories.
                  </p>
                </div>

                {/* Navigation Grid */}
                <div className="md:w-2/3 lg:w-1/2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest text-stone-900 uppercase mb-6">Shop</h3>
                      <ul className="space-y-4">
                        <li><Link href="/products" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Shop All</Link></li>
                        <li><Link href="/products?category=handbags" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Handbags</Link></li>
                        <li><Link href="/products?category=tote-bags" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Totes</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest text-stone-900 uppercase mb-6">Customer</h3>
                      <ul className="space-y-4">
                        <li><Link href="/account" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Account</Link></li>
                        <li><Link href="/cart" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Cart</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest text-stone-900 uppercase mb-6">Information</h3>
                      <ul className="space-y-4">
                        <li><span className="text-sm text-stone-400 cursor-not-allowed">Contact</span></li>
                        <li><span className="text-sm text-stone-400 cursor-not-allowed">Shipping</span></li>
                        <li><span className="text-sm text-stone-400 cursor-not-allowed">Returns</span></li>
                        <li><span className="text-sm text-stone-400 cursor-not-allowed">Privacy</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
                
              </div>
              
              <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} The Anvor.</p>
                <div className="flex gap-6">
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest cursor-not-allowed">Terms</span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest cursor-not-allowed">Privacy</span>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
