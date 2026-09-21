'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminOrders } from '../../../lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const loadOrders = async (currentPage: number, status: string, paymentStatus: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getAdminOrders(currentPage, 20, status, paymentStatus);
      if (res.success) {
        setOrders(res.data);
        setTotalPages(res.pagination.totalPages);
      } else {
        setError('Failed to load orders');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page, statusFilter, paymentStatusFilter);
  }, [page, statusFilter, paymentStatusFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Orders</h1>
          <p className="text-sm text-stone-500 mt-2">Manage customer orders and fulfillments.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <select 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-stone-200 p-2 text-sm focus:outline-none focus:border-stone-900 bg-white"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select 
          value={paymentStatusFilter} 
          onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
          className="border border-stone-200 p-2 text-sm focus:outline-none focus:border-stone-900 bg-white"
        >
          <option value="">All Payment Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Loading Orders...</div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto shadow-sm mb-6">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Order Number</th>
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Total</th>
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Payment</th>
                <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500 text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4">
                      <Link href={`/admin/orders/${order._id}`} className="font-mono text-stone-900 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-stone-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-stone-900">{order.user?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-stone-500">{order.user?.email}</p>
                    </td>
                    <td className="p-4 text-sm text-stone-900 font-medium">
                      {order.currency === 'INR' ? '₹' : order.currency}{order.grandTotal.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold ${
                        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-stone-200 text-stone-600'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold ${
                        ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-green-100 text-green-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border border-stone-200 text-[10px] uppercase tracking-widest font-bold text-stone-900 disabled:opacity-50 transition-colors hover:bg-stone-50"
          >
            Previous
          </button>
          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white border border-stone-200 text-[10px] uppercase tracking-widest font-bold text-stone-900 disabled:opacity-50 transition-colors hover:bg-stone-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
