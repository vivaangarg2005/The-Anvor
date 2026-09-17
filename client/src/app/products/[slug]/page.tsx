import { getProduct } from '../../../lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const res = await getProduct(params.slug);
  const product = res?.data;

  if (!product) {
    return { title: 'Product Not Found | The Anvor' };
  }

  return {
    title: `${product.name} | The Anvor`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const res = await getProduct(params.slug);
  const product = res?.data;

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
            <img 
              src={product.images?.[0] || 'https://via.placeholder.com/800x1000?text=No+Image'} 
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>
          {/* Future: Thumbnail gallery mapping over product.images */}
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <nav className="text-sm font-medium text-gray-500 mb-6 flex gap-2 uppercase tracking-wide">
            <a href="/" className="hover:text-indigo-600 transition-colors">Home</a>
            <span>/</span>
            <a href={`/products?category=${product.category?.slug}`} className="hover:text-indigo-600 transition-colors">{product.category?.name}</a>
          </nav>

          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-bold text-indigo-600">₹{product.price}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-gray-400 line-through font-medium">₹{product.compareAtPrice}</span>
            )}
            {isOutOfStock ? (
              <span className="ml-auto bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">Out of Stock</span>
            ) : (
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">In Stock</span>
            )}
          </div>

          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            {product.description}
          </p>

          {/* Flexible Attributes (if any exist) */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Details</h3>
              <ul className="space-y-3">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <li key={key} className="flex gap-4">
                    <span className="w-1/3 text-gray-500 capitalize">{key}</span>
                    <span className="w-2/3 text-gray-900 font-medium">{value as string}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-auto pt-8 border-t border-gray-100">
            {/* Disabled UI elements for now as requested */}
            <div className="flex gap-4 mb-4 opacity-50 cursor-not-allowed" title="Cart functionality coming soon">
              <div className="w-32 border-2 border-gray-300 rounded-lg flex items-center justify-between px-4 h-14 bg-gray-50">
                <span className="text-gray-400 font-bold">-</span>
                <span className="font-bold text-gray-900">1</span>
                <span className="text-gray-400 font-bold">+</span>
              </div>
              <button 
                disabled 
                className="flex-1 bg-gray-900 text-white font-bold rounded-lg h-14 uppercase tracking-wider"
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 font-medium">
              Payment & Cart features are disabled in this version.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
