'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminOrderById, updateAdminOrderStatus } from '../../../../lib/api';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [status, setStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminOrderById(id as string);
      if (res.success) {
        setOrder(res.data);
        setStatus(res.data.status);
      } else {
        setError('Failed to load order');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (status === order.status) return;
    setIsUpdatingStatus(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const res = await updateAdminOrderStatus(id as string, status);
      if (res.success) {
        setOrder(res.data);
        setStatus(res.data.status);
        setUpdateSuccess('Order status updated safely.');
      } else {
        setUpdateError(res.error || 'Failed to update order status');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'An error occurred updating the order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Loading Order...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-200">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Link 
        href="/admin/orders" 
        className="inline-block mb-8 text-[10px] text-stone-500 hover:text-stone-900 uppercase tracking-widest font-bold transition-colors"
      >
        ← Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Order Details & Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Info */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h1 className="text-2xl font-serif text-stone-900 mb-2">Order {order.orderNumber}</h1>
            <p className="text-sm text-stone-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Items Snapshot */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h2 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-6">Historical Item Snapshot</h2>
            <div className="space-y-6">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-stone-100 shrink-0 border border-stone-200 overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-400">NO IMG</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-stone-900">{item.productName}</p>
                    <p className="text-sm text-stone-500 mt-1">₹{item.unitPrice.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-900">₹{item.lineTotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Totals */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm flex flex-col items-end">
             <div className="w-full sm:w-1/2 space-y-3">
               <div className="flex justify-between text-sm text-stone-600">
                 <span>Subtotal</span>
                 <span>₹{order.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm text-stone-600">
                 <span>Shipping</span>
                 <span>₹{order.shippingTotal.toFixed(2)}</span>
               </div>
               {order.discountTotal > 0 && (
                 <div className="flex justify-between text-sm text-green-600">
                   <span>Discount</span>
                   <span>-₹{order.discountTotal.toFixed(2)}</span>
                 </div>
               )}
               <div className="border-t border-stone-200 pt-3 flex justify-between font-bold text-stone-900">
                 <span>Grand Total</span>
                 <span>₹{order.grandTotal.toFixed(2)}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Status & Customer */}
        <div className="space-y-8">
          
          {/* Status Controls */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm space-y-6">
            
            {/* Read-only Payment Status */}
            <div>
              <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3">Payment Status</h3>
              <span className={`inline-flex items-center px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${
                order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-stone-200 text-stone-600'
              }`}>
                {order.paymentStatus}
              </span>
              <p className="text-[10px] text-stone-400 mt-2">Read-only. Controlled by Razorpay.</p>
            </div>

            <hr className="border-stone-100" />

            {/* Operational Status Control */}
            <div>
              <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3">Fulfillment Status</h3>
              <div className="flex flex-col gap-3">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 w-full bg-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || status === order.status}
                  className="w-full bg-stone-900 text-stone-50 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50 hover:bg-stone-800"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </button>
                
                {updateError && <p className="text-xs text-red-600">{updateError}</p>}
                {updateSuccess && <p className="text-xs text-green-600">{updateSuccess}</p>}
              </div>
            </div>
          </div>

          {/* Customer & Shipping */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3">Customer Info</h3>
              <div className="text-sm text-stone-600 space-y-1">
                <p className="font-medium text-stone-900">{order.user?.name || 'Unknown User'}</p>
                <p>{order.user?.email}</p>
                <p>{order.user?.phone}</p>
              </div>
            </div>

            <hr className="border-stone-100" />

            <div>
              <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3">Shipping Address Snapshot</h3>
              <div className="text-sm text-stone-600 space-y-1">
                <p className="font-medium text-stone-900">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.landmark && <p className="text-[10px] mt-2 italic text-stone-500">Landmark: {order.shippingAddress.landmark}</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
