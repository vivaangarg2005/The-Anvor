'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories } from '../../lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductForm({ initialData = null, onSubmit, isLoading }: { initialData?: any, onSubmit: (data: any) => Promise<void>, isLoading: boolean }) {
  const router = useRouter();
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    compareAtPrice: initialData?.compareAtPrice || '',
    sku: initialData?.sku || '',
    category: initialData?.category?._id || initialData?.category || '',
    images: initialData?.images ? initialData.images.join(', ') : '',
    stockQuantity: initialData?.stockQuantity ?? 0,
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getCategories();
        if (res.success) {
          setCategories(res.data);
          // Auto-select first category if none selected
          if (!formData.category && res.data.length > 0) {
            setFormData(prev => ({ ...prev, category: res.data[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, [formData.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform form data to API format
    const payload = {
      ...formData,
      price: parseFloat(formData.price as string),
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice as string) : undefined,
      stockQuantity: parseInt(formData.stockQuantity as string, 10),
      images: formData.images.split(',').map((url: string) => url.trim()).filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 shadow-sm border border-stone-200">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Product Name *</label>
          <input
            required
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Slug (URL)</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="Leave blank to auto-generate"
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
          />
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">SKU *</label>
          <input
            required
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors uppercase"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Category *</label>
          <select
            required
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors bg-white"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Price (₹) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Compare At Price */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Compare At Price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="compareAtPrice"
            value={formData.compareAtPrice}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Stock Quantity *</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Description *</label>
        <textarea
          required
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
        />
      </div>

      {/* Images */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Image URLs * (Comma separated)</label>
        <textarea
          required
          name="images"
          value={formData.images}
          onChange={handleChange}
          rows={3}
          placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
          className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-8 border-t border-stone-200 pt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer"
          />
          <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Active (Visible on Storefront)</span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer"
          />
          <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Featured</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-3 text-[10px] font-bold text-stone-900 uppercase tracking-widest hover:bg-stone-100 transition-colors border border-transparent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-8 py-3 bg-stone-900 text-stone-50 text-[10px] font-bold uppercase tracking-widest transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-800'}`}
        >
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
