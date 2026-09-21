import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '../../../../lib/api';
import PaymentRetryButton from '../../../../components/PaymentRetryButton';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  let order = null;
  try {
    const res = await getOrderById(resolvedParams.id, cookieHeader);
    if (res && res.success) {
      order = res.data;
    } else {
      redirect('/account');
    }
  } catch (err) {
    console.error(err);
    redirect('/account');
  }

  if (!order) {
    redirect('/account');
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:py-24">
      <Link href="/account" className="inline-block mb-8 text-[10px] text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors font-bold">
        ← Back to Account
      </Link>

      <div className="mb-12 border-b border-stone-200 pb-8">
        <h1 className="text-3xl font-serif text-stone-900 mb-2">Order {order.orderNumber}</h1>
        <p className="text-sm text-stone-500 mb-6">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div className="flex gap-4 flex-wrap">
          <span className="inline-block px-3 py-1 bg-stone-100 text-[10px] font-bold text-stone-900 uppercase tracking-widest">
            Order: {order.status}
          </span>
          <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
            order.paymentStatus === 'PAID'
              ? 'bg-stone-900 text-stone-50'
              : order.paymentStatus === 'FAILED'
              ? 'bg-red-100 text-red-900'
              : 'bg-orange-100 text-orange-900'
          }`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
        {order.paymentStatus === 'PENDING' && (
          <PaymentRetryButton order={order} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2">Items</h2>
          
          <div className="space-y-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {order.items.map((item: any) => (
              <div key={item.product} className="flex gap-4">
                <div className="w-20 h-28 bg-stone-100 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.productImage || 'https://via.placeholder.com/100x150?text=No+Image'} 
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-sm font-serif text-stone-900 line-clamp-1">{item.productName}</p>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">₹{item.unitPrice} × {item.quantity}</p>
                  <p className="text-sm font-medium text-stone-900 mt-auto">₹{item.lineTotal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2 mb-6">Order Summary</h2>
            <div className="space-y-4 text-sm text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{order.shippingTotal}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-stone-900">
                  <span>Discount</span>
                  <span>-₹{order.discountTotal}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-4 mt-2">
                <span>Total</span>
                <span>₹{order.grandTotal}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2 mb-6">Shipping Address</h2>
            <div className="text-sm text-stone-500 space-y-1">
              <p className="text-stone-900 font-medium">{order.shippingAddress.recipientName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
              <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
            </div>
          </section>

          {order.razorpayPaymentId && (
            <section>
              <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest border-b border-stone-200 pb-2 mb-6">Payment Reference</h2>
              <p className="text-xs text-stone-500 font-mono break-all">{order.razorpayPaymentId}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
