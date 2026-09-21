'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '../../../../components/admin/ProductForm';
import { createAdminProduct } from '../../../../lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await createAdminProduct(data);
      if (res.success) {
        router.push('/admin/products');
      } else {
        setError(res.error || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/products" 
          className="inline-block mb-4 text-[10px] text-stone-500 hover:text-stone-900 uppercase tracking-widest font-bold transition-colors"
        >
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-serif text-stone-900">Add New Product</h1>
        <p className="text-sm text-stone-500 mt-2">Create a new product for your catalog.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
