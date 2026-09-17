import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
        <span className="text-4xl">🔍</span>
      </div>
      <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Product Not Found</h2>
      <p className="text-lg text-gray-500 max-w-md mx-auto mb-8">
        We couldn't find the product you're looking for. It may have been removed or the URL is incorrect.
      </p>
      <Link 
        href="/products" 
        className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-colors"
      >
        Browse Catalog
      </Link>
    </div>
  );
}
