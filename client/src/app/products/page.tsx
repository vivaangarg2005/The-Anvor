import Link from 'next/link';
import { getProducts, getCategories } from '../../lib/api';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products | The Anvor',
  description: 'Browse our full catalog of premium bags.',
};

// Force dynamic so search params are always read fresh
export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const currentCategory = searchParams.category;
  const currentPage = parseInt(searchParams.page || '1', 10);

  // Fetch products and categories concurrently for performance
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({ category: currentCategory, page: currentPage, limit: 12 }),
    getCategories()
  ]);

  const products = productsRes.data || [];
  const pagination = productsRes.pagination;
  const categories = categoriesRes.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row gap-16">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 shrink-0">
        <div className="sticky top-28">
          <h2 className="text-xs font-bold text-stone-900 mb-6 uppercase tracking-[0.2em] border-b border-stone-200 pb-4">Categories</h2>
          <nav className="space-y-4">
            <Link 
              href="/products"
              className={`block text-sm transition-colors ${!currentCategory ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
            >
              All Products
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className={`block text-sm transition-colors ${currentCategory === cat.slug ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Product Grid */}
      <div className="flex-1">
        <div className="mb-12 border-b border-stone-200 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-stone-900 capitalize">
              {currentCategory ? currentCategory.replace('-', ' ') : 'The Collection'}
            </h1>
          </div>
          <p className="text-xs text-stone-500 uppercase tracking-widest">
            {pagination?.totalCount || 0} items
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-32 bg-white border border-stone-100">
            <h3 className="text-lg font-serif text-stone-900 mb-2">No products found</h3>
            <p className="text-sm text-stone-500">We couldn't find any products in this category.</p>
            <Link href="/products" className="mt-8 inline-block border-b border-stone-900 pb-1 text-sm font-medium tracking-wide text-stone-900 hover:text-amber-800 hover:border-amber-800 transition-colors uppercase">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="flex flex-col h-full">
                  <div className="aspect-4/5 bg-stone-100 relative overflow-hidden mb-5">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 text-xs font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm">
                        Sold Out
                      </div>
                    )}
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

        {/* Pagination Foundation */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-20 flex justify-center gap-4">
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <Link
                  key={pageNum}
                  href={`/products?page=${pageNum}${currentCategory ? `&category=${currentCategory}` : ''}`}
                  className={`w-10 h-10 flex items-center justify-center text-sm transition-colors ${
                    isActive 
                      ? 'bg-stone-900 text-white font-semibold' 
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
