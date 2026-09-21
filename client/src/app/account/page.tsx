import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMe, getMyOrders } from '../../lib/api';
import LogoutButton from './LogoutButton';
import AddressBook from '../../components/AddressBook';
import ProfilePhotoUploader from '../../components/ProfilePhotoUploader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | The Anvor',
  description: 'Manage your account, orders, and preferences.',
};

export const dynamic = 'force-dynamic';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to "21 Sept 2026 · 09:04 AM" in IST (Asia/Kolkata).
 */
function formatOrderDateTime(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} · ${timePart.toUpperCase()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OrderCard({ order }: { order: any }) {
  // Show up to 3 product thumbnails from order item snapshots
  const thumbnails: string[] = order.items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.productImage)
    .filter(Boolean)
    .slice(0, 3);

  const totalItems: number = order.items?.length ?? 0;
  const extraCount = totalItems > 3 ? totalItems - 3 : 0;

  const paymentBadgeClass =
    order.paymentStatus === 'PAID'
      ? 'bg-stone-900 text-stone-50'
      : order.paymentStatus === 'FAILED'
      ? 'bg-red-100 text-red-800'
      : 'bg-orange-100 text-orange-700';

  return (
    <Link
      href={`/account/orders/${order._id}`}
      className="group block border border-stone-200 hover:border-stone-400 transition-colors"
    >
      <div className="p-5 flex items-center gap-5">
        {/* Product Thumbnails */}
        {thumbnails.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {thumbnails.map((src, i) => (
              <div
                key={i}
                className="w-12 h-16 bg-stone-100 overflow-hidden shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-12 h-16 bg-stone-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-stone-500">+{extraCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Order Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-sm font-bold text-stone-900 truncate group-hover:opacity-70 transition-opacity">
            {order.orderNumber}
          </p>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest">
            {formatOrderDateTime(order.createdAt)}
          </p>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </p>
        </div>

        {/* Right: Amount + Status + Arrow */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-sm font-medium text-stone-900">₹{order.grandTotal}</p>
          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${paymentBadgeClass}`}>
            {order.paymentStatus}
          </span>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
              
              {/* Avatar */}
              <div className="flex justify-center mb-8">
                <ProfilePhotoUploader
                  initialUrl={user.profileImageUrl ?? null}
                  userName={user.name}
                  userId={user._id}
                />
              </div>

              <dl className="space-y-6">
                <div>
                  <dt className="text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">Name</dt>
                  <dd className="text-sm text-stone-900">{user.name}</dd>
                </div>
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
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {orders.map((order: any) => (
                    <OrderCard key={order._id} order={order} />
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
