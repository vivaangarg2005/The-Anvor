import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { cookies } from 'next/headers';
import Header from '../components/Header';
import { getMe } from '../lib/api';
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
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      const meResponse = await getMe(cookieHeader);
      isLoggedIn = meResponse?.success === true;
    }
  } catch {
    isLoggedIn = false;
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground min-h-screen flex flex-col`}>
        <Header isLoggedIn={isLoggedIn} />

        {/* Main Content Area */}
        <main className="grow">
          {children}
        </main>

        {/* Basic Footer */}
        <footer className="bg-[#FDFBF7] border-t border-stone-200 py-12 mt-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-stone-500">
            &copy; {new Date().getFullYear()} The Anvor. Premium Boutique.
          </div>
        </footer>
      </body>
    </html>
  );
}
