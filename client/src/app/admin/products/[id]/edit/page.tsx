'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '../../../../../components/admin/ProductForm';
import { updateAdminProduct, getProduct } from '../../../../../lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await getProduct(id);
        if (res.success) {
          setInitialData(res.data);
        } else {
          setError('Failed to load product');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred loading product');
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    setError('');
    
    try {
      const res = await updateAdminProduct(id, data);
      if (res.success) {
        router.push('/admin/products');
      } else {
        setError(res.error || 'Failed to update product');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Loading Product...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/products" 
          className="inline-block mb-4 text-[10px] text-stone-500 hover:text-stone-900 uppercase tracking-widest font-bold transition-colors"
        >
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-serif text-stone-900">Edit Product</h1>
        <p className="text-sm text-stone-500 mt-2">Update catalog details for {initialData?.name}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      {initialData && (
        <ProductForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
      )}
    </div>
  );
}
