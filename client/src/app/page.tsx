import { ReactNode } from 'react';

// Force dynamic rendering to ensure fresh data during development
export const dynamic = 'force-dynamic';

async function getProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (err) {
    console.error(err);
    return { data: [] };
  }
}

export default async function Home() {
  const productsData = await getProducts();
  const products = productsData.data || [];

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">
            The Anvor
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Development Catalog (Day 2)
          </h2>
        </header>

        {products.length === 0 ? (
          <p className="text-center text-gray-500 font-mono">No products found. Did you run the seed script?</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <div key={product._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="aspect-square bg-gray-100 rounded-md mb-4 overflow-hidden">
                  <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                </div>
                <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{product.category?.name || 'Uncategorized'}</p>
                <div className="flex justify-between items-center mt-auto pt-4">
                  <span className="text-lg font-bold">₹{product.price}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${product.stockQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
