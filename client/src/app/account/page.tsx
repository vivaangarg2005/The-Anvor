import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMe, getMyOrders } from '../../lib/api';
import LogoutButton from './LogoutButton';
import AddressBook from '../../components/AddressBook';
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
  
  let orders = [];
  try {
    const ordersResponse = await getMyOrders(cookieHeader);
    if (ordersResponse && ordersResponse.success) {
      orders = ordersResponse.data;
    }
  } catch (err) {
    console.error('Failed to fetch orders', err);
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Editorial Header */}
      <div className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto border-b border-stone-200 mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4 tracking-tight">
          My Account
        </h1>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
          Welcome Back, {user.name}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-12">
          
          {/* Left Column: Profile */}
          <div className="md:col-span-5 flex flex-col gap-12 min-w-0 w-full overflow-hidden">
            <section>
              <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Profile</h2>
              <dl className="space-y-6">
                <div>
                  <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">Phone Number</dt>
                  <dd className="text-sm text-stone-900 flex items-center gap-3">
                    {user.phone}
                    {user.phoneVerified && (
                      <span className="text-stone-400 text-[10px] uppercase tracking-widest font-semibold">Verified</span>
                    )}
                  </dd>
                </div>
                {user.email && (
                  <div>
                    <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">Email</dt>
                    <dd className="text-sm text-stone-900">{user.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">Member Since</dt>
                  <dd className="text-sm text-stone-900">{new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Right Column: Other Sections */}
          <div className="md:col-span-7 flex flex-col gap-12 min-w-0 w-full overflow-hidden">
            
            <section>
              <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Orders</h2>
              {orders.length === 0 ? (
                <div className="py-8 text-center bg-transparent border border-stone-200">
                  <p className="text-sm text-stone-500 mb-4">You haven&apos;t placed any orders yet.</p>
                  <Link href="/products" className="inline-block border-b border-stone-900 pb-1 text-[10px] font-bold tracking-widest text-stone-900 hover:text-stone-500 hover:border-stone-500 transition-colors uppercase">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {orders.map((order: any) => (
                    <div key={order._id} className="border border-stone-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <Link href={`/account/orders/${order._id}`} className="text-sm font-bold text-stone-900 hover:opacity-70 transition-opacity">
                          {order.orderNumber}
                        </Link>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-stone-900">₹{order.grandTotal}</p>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">{order.items?.length || 0} items</p>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-block px-3 py-1 bg-stone-100 text-[9px] font-bold text-stone-600 uppercase tracking-widest">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Addresses</h2>
              <AddressBook selectable={false} />
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Wishlist</h2>
              <p className="text-sm text-stone-400">Your wishlist is empty.</p>
            </section>

          </div>
        </div>

        <div className="flex justify-between items-center mt-24 pt-8 border-t border-stone-200">
          <Link href="/products" className="text-[10px] text-stone-900 font-bold uppercase tracking-widest border-b border-stone-900 hover:text-stone-500 hover:border-stone-500 transition-colors">
            Continue Shopping
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
