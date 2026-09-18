import { getProduct } from '../../../lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const res = await getProduct(slug);
  const product = res?.data;

  if (!product) {
    return { title: 'Product Not Found | The Anvor' };
  }

  return {
    title: `${product.name} | The Anvor`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getProduct(slug);
  const product = res?.data;

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-24">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="aspect-4/5 bg-stone-100 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={product.images?.[0] || 'https://via.placeholder.com/800x1000?text=No+Image'} 
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>
          {/* Future: Thumbnail gallery mapping over product.images */}
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <nav className="text-xs font-bold text-stone-500 mb-8 flex gap-3 uppercase tracking-widest">
            <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
            <span className="text-stone-300">/</span>
            <Link href={`/products?category=${product.category?.slug}`} className="hover:text-stone-900 transition-colors">{product.category?.name}</Link>
          </nav>

          <h1 className="text-4xl lg:text-5xl font-serif text-stone-900 leading-tight mb-6">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-stone-200">
            <span className="text-2xl font-medium text-stone-900">₹{product.price}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-stone-400 line-through">₹{product.compareAtPrice}</span>
            )}
            {isOutOfStock && (
              <span className="ml-auto text-xs text-stone-900 uppercase tracking-widest font-bold">Sold Out</span>
            )}
          </div>

          <p className="text-base text-stone-600 leading-relaxed mb-12">
            {product.description}
          </p>

          {/* Flexible Attributes (if any exist) */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mb-12">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-6 border-b border-stone-200 pb-2">Product Details</h3>
              <ul className="space-y-4">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <li key={key} className="flex gap-4 text-sm">
                    <span className="w-1/3 text-stone-500 capitalize">{key}</span>
                    <span className="w-2/3 text-stone-900">{value as string}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-auto">
            {/* Disabled UI elements for now as requested */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4 opacity-50 cursor-not-allowed" title="Cart functionality coming soon">
              <div className="w-full sm:w-32 border border-stone-300 flex items-center justify-between px-6 h-14 bg-white">
                <span className="text-stone-400 hover:text-stone-900 transition-colors">-</span>
                <span className="font-medium text-stone-900">1</span>
                <span className="text-stone-400 hover:text-stone-900 transition-colors">+</span>
              </div>
              <button 
                disabled 
                className="flex-1 bg-stone-900 text-white text-sm font-semibold h-14 uppercase tracking-widest transition-colors"
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
              </button>
            </div>
            <p className="text-center text-xs text-stone-400 uppercase tracking-widest mt-6">
              Payment & Cart features are disabled in this version.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
