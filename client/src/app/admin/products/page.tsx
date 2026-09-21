'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminProducts, deleteAdminProduct } from '../../../lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const res = await getAdminProducts(1, 100);
      if (res.success) {
        setProducts(res.data);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError('An error occurred while loading products');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will no longer be visible to customers.`)) return;
    
    try {
      const res = await deleteAdminProduct(id);
      if (res.success) {
        loadProducts();
      } else {
        alert('Failed to deactivate product');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  if (isLoading) {
    return <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Loading Products...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Products</h1>
          <p className="text-sm text-stone-500 mt-2">Manage your catalog, pricing, and stock.</p>
        </div>
        <Link 
          href="/admin/products/new"
          className="bg-stone-900 text-stone-50 px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border border-stone-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-200">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Product</th>
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Category</th>
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Price</th>
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Stock</th>
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest">Status</th>
              <th className="p-4 text-[10px] font-bold text-stone-900 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-500 text-sm">
                  No products found. Create your first product!
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product._id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-stone-100 shrink-0 overflow-hidden border border-stone-200">
                        {product.images && product.images[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-400">NO IMG</div>
                        )}
                      </div>
                      <div>
                        <p className="font-serif text-stone-900 line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-stone-500 mt-1">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-stone-600">{product.category?.name || 'Uncategorized'}</td>
                  <td className="p-4 text-sm text-stone-900 font-medium">₹{product.price}</td>
                  <td className="p-4">
                    <span className={`text-sm ${product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-orange-500' : 'text-red-500 font-bold'}`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-4">
                    <Link 
                      href={`/admin/products/${product._id}/edit`}
                      className="text-[10px] text-stone-600 hover:text-stone-900 uppercase tracking-widest font-bold transition-colors"
                    >
                      Edit
                    </Link>
                    {product.isActive && (
                      <button 
                        onClick={() => handleDelete(product._id, product.name)}
                        className="text-[10px] text-red-600 hover:text-red-900 uppercase tracking-widest font-bold transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
