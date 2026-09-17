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
      {/* Hero Section */}
      <section className="bg-indigo-600 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Elevate Your Everyday
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            Discover our premium collection of handcrafted bags designed for the modern lifestyle.
          </p>
          <div className="pt-4">
            <Link 
              href="/products" 
              className="inline-block bg-white text-indigo-600 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-gray-50 hover:scale-105 transition-all"
            >
              Shop the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured Arrivals</h2>
          <Link href="/products" className="text-indigo-600 font-semibold hover:underline">
            View all &rarr;
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-gray-200">
            No products found. Did you run the seed script?
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                    {/* Using a placeholder if image fails or isn't present */}
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                    <div className="mt-auto flex items-center gap-3">
                      <span className="text-xl font-black text-gray-900">₹{product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
