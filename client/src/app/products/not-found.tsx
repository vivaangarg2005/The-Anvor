import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 border border-stone-200 p-8 bg-white shadow-sm">
        <h2 className="text-3xl font-serif text-stone-900 tracking-tight mb-4">Product Not Found</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
          We couldn&apos;t find the product you&apos;re looking for. It may have been removed or the URL is incorrect.
        </p>
        <Link 
          href="/products" 
          className="inline-block bg-stone-900 text-white px-8 py-4 font-semibold text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
