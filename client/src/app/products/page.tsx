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
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">Categories</h2>
        <nav className="space-y-3">
          <Link 
            href="/products"
            className={`block text-sm font-medium transition-colors ${!currentCategory ? 'text-indigo-600 font-bold' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            All Products
          </Link>
          {categories.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              className={`block text-sm font-medium transition-colors ${currentCategory === cat.slug ? 'text-indigo-600 font-bold' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Product Grid */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">
            {currentCategory ? currentCategory.replace('-', ' ') : 'All Products'}
          </h1>
          <p className="text-gray-500 mt-2">Showing {products.length} of {pagination?.totalCount || 0} products</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">We couldn't find any products in this category.</p>
            <Link href="/products" className="mt-6 inline-block text-indigo-600 font-semibold hover:underline">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        SOLD OUT
                      </div>
                    )}
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

        {/* Pagination Foundation */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-16 flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <Link
                  key={pageNum}
                  href={`/products?page=${pageNum}${currentCategory ? `&category=${currentCategory}` : ''}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-md font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
