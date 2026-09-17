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

// ──────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────

export async function registerUser(data: { name: string; phone: string; email?: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send/receive HttpOnly cookies
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginWithPassword(data: { phone: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function requestOtp(data: { phone: string; channel: 'WHATSAPP' | 'SMS' }) {
  const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function verifyOtp(data: { phone: string; otp: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json();
}

/**
 * getMe — used by Server Components to verify the current session.
 * Accepts an optional cookie string to forward the browser's HttpOnly cookie
 * from the incoming Next.js request to the Express API (server-to-server).
 */
export async function getMe(cookieHeader?: string) {
  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}
