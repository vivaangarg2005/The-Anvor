const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export async function getProducts(params?: { category?: string; page?: number; limit?: number }) {
  let url = `${API_BASE_URL}/products`;
  
  if (params) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const res = await fetch(url, { 
    // In a real production app, you might use 'force-cache' with revalidation, 
    // but for this development phase, we want fresh data.
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }
  return res.json();
}

export async function getProduct(slug: string) {
  const res = await fetch(`${API_BASE_URL}/products/${slug}`, { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch product: ${res.statusText}`);
  }
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_BASE_URL}/categories`, { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.statusText}`);
  }
  return res.json();
}
