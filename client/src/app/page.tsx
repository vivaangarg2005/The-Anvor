import Link from 'next/link';
import { getProducts } from '../lib/api';

// Force dynamic rendering to ensure fresh data during development
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch a small limit of products for the featured section
  const productsData = await getProducts({ limit: 4 }); // fetch 4 instead of 3 for a 2x2 grid or better horizontal scrolling
  const featuredProducts = productsData.data || [];

  return (
    <div className="flex flex-col bg-background">
      {/* Editorial Hero Section */}
      <section className="w-full flex flex-col md:flex-row h-auto md:h-[calc(100vh-5rem)] min-h-[450px] md:max-h-[700px] border-b border-stone-200 overflow-hidden">
        
        {/* Text Area */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 md:px-12 lg:px-20 py-12 md:py-0">
          <p className="text-[9px] md:text-[10px] tracking-[0.2em] font-bold mb-4 md:mb-6">
            <span className="text-stone-400">THE</span> <span className="text-stone-500">ANVOR</span>
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-stone-900 leading-[1.05] mb-5 md:mb-6 tracking-tight">
            Elevate Your<br className="hidden md:block" /> Everyday
          </h1>
          <p className="text-xs md:text-sm text-stone-600 max-w-[320px] leading-relaxed mb-6 md:mb-8">
            Discover our curated collection of elegant accessories designed for the modern lifestyle.
          </p>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-3 md:gap-4 bg-[#1C1C1C] text-white text-[9px] md:text-[10px] font-bold tracking-widest uppercase px-6 md:px-8 py-3.5 md:py-4 hover:bg-black transition-colors"
          >
            EXPLORE THE COLLECTION
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Product Image Area */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full relative bg-background flex items-center justify-center">
          {featuredProducts.length > 0 ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={featuredProducts[0].images?.[0] || 'https://via.placeholder.com/1000x1200?text=Editorial'}
              alt="Featured Collection"
              className="w-[85%] h-[85%] object-cover object-center shadow-sm"
            />
          ) : (
            <div className="w-[85%] h-[85%] bg-stone-200"></div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center justify-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight text-center">Featured Arrivals</h2>
          <div className="w-12 h-[1px] bg-stone-300 mt-6"></div>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-20 border border-stone-200 bg-white">
            <p className="text-sm text-stone-500 uppercase tracking-widest">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {featuredProducts.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="flex flex-col h-full">
                  <div className="aspect-4/5 bg-stone-100 relative overflow-hidden mb-4">
                    {/* Image with subtle zoom on hover */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-base font-serif text-stone-900 mb-1.5 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-stone-900">₹{product.price}</span>
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
          <div className="mt-12 md:hidden">
             <Link 
               href="/products" 
               className="block w-full text-center border border-stone-900 px-8 py-4 text-xs font-semibold tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-colors uppercase"
             >
               View all products
             </Link>
          </div>
        )}
      </section>

      {/* Brand Value Section */}
      <section className="bg-[#FFFFFF] border-t border-stone-200 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-xs tracking-widest text-stone-500 uppercase font-medium">The Anvor Promise</p>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">Designed for everyday elegance</h2>
          <p className="text-stone-600 leading-relaxed text-sm md:text-base mx-auto max-w-xl">
            We believe in creating timeless pieces that blend classic silhouettes with modern elegance. Every accessory is designed to elevate your everyday style.
          </p>
        </div>
      </section>
    </div>
  );
}
