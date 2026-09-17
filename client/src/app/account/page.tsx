import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '../../lib/api';
import LogoutButton from './LogoutButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | The Anvor',
  description: 'Manage your account, orders, and preferences.',
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  // Forward cookie to Express to authenticate the request
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const meResponse = await getMe(cookieHeader);

  if (!meResponse || !meResponse.success) {
    redirect('/login');
  }

  const user = meResponse.data;

  return (
    <div className="min-h-[80vh] py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">Welcome Back</p>
          <h1 className="text-4xl font-serif text-stone-900">
            {user.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Account Details */}
          <div className="bg-white border border-stone-200 p-8 shadow-sm">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6 pb-4 border-b border-stone-100">Profile Details</h2>
            <dl className="space-y-5">
              <div>
                <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Phone Number</dt>
                <dd className="text-sm font-medium text-stone-900 flex items-center gap-3">
                  {user.phone}
                  {user.phoneVerified ? (
                    <span className="bg-stone-100 text-stone-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Verified</span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-200">Unverified</span>
                  )}
                </dd>
              </div>
              {user.email && (
                <div>
                  <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Email</dt>
                  <dd className="text-sm font-medium text-stone-900">{user.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Account Type</dt>
                <dd className="text-sm font-medium text-stone-900 capitalize">{user.role.toLowerCase()}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Member Since</dt>
                <dd className="text-sm font-medium text-stone-900">{new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
              </div>
            </dl>
          </div>

          {/* Coming Soon */}
          <div className="bg-white border border-stone-200 p-8 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6 pb-4 border-b border-stone-100">Boutique Services</h2>
            <div className="space-y-6 grow">
              <div className="flex items-center justify-between text-stone-400 cursor-not-allowed border-b border-stone-50 pb-4">
                <span className="text-sm font-medium tracking-wide">Order History</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Soon</span>
              </div>
              <div className="flex items-center justify-between text-stone-400 cursor-not-allowed border-b border-stone-50 pb-4">
                <span className="text-sm font-medium tracking-wide">Saved Addresses</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Soon</span>
              </div>
              <div className="flex items-center justify-between text-stone-400 cursor-not-allowed">
                <span className="text-sm font-medium tracking-wide">Wishlist</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Soon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-stone-200">
          <Link href="/products" className="text-xs text-stone-900 font-bold uppercase tracking-widest border-b border-stone-900 hover:text-amber-800 hover:border-amber-800 transition-colors">
            Continue Shopping
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
