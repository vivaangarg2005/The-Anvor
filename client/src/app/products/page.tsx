import Link from 'next/link';
import { getProducts, getCategories } from '../../lib/api';
import ProductCardCartControl from '../../components/ProductCardCartControl';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Collection | The Anvor',
  description: 'Browse our curated catalog of elegant accessories.',
};

// Force dynamic so search params are always read fresh
export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category;
  const currentPage = parseInt(resolvedParams.page || '1', 10);

  // Fetch products and categories concurrently
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({ category: currentCategory, page: currentPage, limit: 12 }),
    getCategories()
  ]);

  const products = productsRes.data || [];
  const pagination = productsRes.pagination;
  const categories = categoriesRes.data || [];

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Editorial Header */}
      <div className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-8 tracking-tight capitalize">
          {currentCategory ? currentCategory.replace('-', ' ') : 'The Collection'}
        </h1>
        
        {/* Horizontal Category Navigation */}
        <nav className="flex flex-wrap justify-center gap-8 mb-6">
          <Link 
            href="/products"
            className={`text-xs tracking-widest uppercase transition-colors relative py-1 ${!currentCategory ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'}`}
          >
            All
            {!currentCategory && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-stone-900"></span>}
          </Link>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {categories.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              className={`text-xs tracking-widest uppercase transition-colors relative py-1 ${currentCategory === cat.slug ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-900'}`}
            >
              {cat.name}
              {currentCategory === cat.slug && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-stone-900"></span>}
            </Link>
          ))}
        </nav>
        
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-8">
          {pagination?.totalCount || 0} ITEMS
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-32">
            <h3 className="text-xl font-serif text-stone-900 mb-4">No pieces found</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">We couldn&apos;t find any accessories in this category right now.</p>
            <Link href="/products" className="mt-12 inline-block border-b border-stone-900 pb-1 text-xs font-semibold tracking-widest text-stone-900 hover:text-stone-500 hover:border-stone-500 transition-colors uppercase">
              Clear Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products.map((product: any) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group block">
                <div className="flex flex-col h-full">
                  <div className="aspect-4/5 bg-stone-100 relative overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest shadow-sm">
                        Sold Out
                      </div>
                    )}
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
                      
                      <div>
                        <ProductCardCartControl 
                          productId={product._id} 
                          stockQuantity={product.stockQuantity} 
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        {/* Pagination Foundation */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-24 flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <Link
                  key={pageNum}
                  href={`/products?page=${pageNum}${currentCategory ? `&category=${currentCategory}` : ''}`}
                  className={`w-10 h-10 flex items-center justify-center text-xs tracking-widest transition-colors ${
                    isActive 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-transparent text-stone-600 hover:bg-stone-100'
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
