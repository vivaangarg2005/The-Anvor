import Link from 'next/link';
import { getProducts } from '../lib/api';

// Force dynamic rendering to ensure fresh data during development
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch a small limit of products for the featured section
  const productsData = await getProducts({ limit: 3 });
  const featuredProducts = productsData.data || [];

  return (
    <div className="flex flex-col">
      {/* Editorial Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col md:flex-row bg-[#FDFBF7]">
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center md:items-start text-center md:text-left px-8 md:px-16 lg:px-24 py-20 md:py-16">
          <p className="text-xs tracking-[0.3em] text-stone-500 uppercase font-medium mb-6">The Anvor</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 leading-[1.1] mb-6">
            Elevate Your Everyday
          </h1>
          <p className="text-sm md:text-base text-stone-600 max-w-sm leading-relaxed mb-10">
            Discover our curated collection of elegant accessories designed for the modern lifestyle.
          </p>
          <Link 
            href="/products" 
            className="inline-block bg-stone-900 text-white text-xs font-semibold tracking-[0.15em] uppercase px-10 py-4 hover:bg-stone-800 transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
        <div className="w-full md:w-1/2 relative h-[50vh] md:h-auto bg-stone-100">
          {featuredProducts.length > 0 ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={featuredProducts[0].images?.[0] || 'https://via.placeholder.com/800x1000?text=Editorial'}
              alt="Featured Collection"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-stone-200"></div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="flex flex-col items-center mb-16 text-center space-y-4">
          <h2 className="text-3xl font-serif text-stone-900">Featured Arrivals</h2>
          <div className="h-px w-12 bg-amber-700/40"></div>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-20 border border-stone-200 bg-white">
            <p className="text-sm text-stone-500 uppercase tracking-widest">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {featuredProducts.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="flex flex-col h-full">
                  <div className="aspect-4/5 bg-stone-100 relative overflow-hidden mb-5">
                    {/* Image with subtle zoom on hover */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                  </div>
                  <div className="flex flex-col grow text-center">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-lg font-serif text-stone-900 mb-2 line-clamp-1 group-hover:text-amber-800 transition-colors">{product.name}</h3>
                    <div className="mt-auto flex items-center justify-center gap-3">
                      <span className="text-sm font-semibold text-stone-900">₹{product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-stone-400 line-through">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {featuredProducts.length > 0 && (
          <div className="mt-16 text-center border-t border-stone-100 pt-16">
             <Link href="/products" className="inline-block border border-stone-900 px-8 py-3 text-xs font-semibold tracking-[0.15em] text-stone-900 hover:bg-stone-900 hover:text-white transition-colors uppercase">
               View all products
             </Link>
          </div>
        )}
      </section>

      {/* Brand Value Section */}
      <section className="bg-white border-t border-b border-stone-200 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-serif text-stone-900">The Anvor Promise</h2>
          <p className="text-stone-600 leading-relaxed max-w-2xl mx-auto">
            We believe in creating timeless pieces that blend classic silhouettes with modern elegance. Every accessory is designed to elevate your everyday style.
          </p>
        </div>
      </section>
    </div>
  );
}
