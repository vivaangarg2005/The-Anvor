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
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  };
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

// ──────────────────────────────────────────────
// Cart API
// ──────────────────────────────────────────────

export async function getCart(cookieHeader?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  const res = await fetch(`${API_BASE_URL}/cart`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`Failed to fetch cart: ${res.statusText}`);
  }
  return res.json();
}

export async function addToCart(productId: string, quantity: number = 1) {
  const res = await fetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add to cart');
  return data;
}

export async function updateCartItem(productId: string, quantity: number) {
  const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update cart');
  return data;
}

export async function removeCartItem(productId: string) {
  const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove from cart');
  return data;
}

export async function mergeGuestCart(items: { productId: string; quantity: number }[]) {
  const res = await fetch(`${API_BASE_URL}/cart/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to merge cart');
  return data;
}

// ──────────────────────────────────────────────
// Address API
// ──────────────────────────────────────────────

export type AddressType = {
  _id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
};

export async function getAddresses(cookieHeader?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  const res = await fetch(`${API_BASE_URL}/addresses`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`Failed to fetch addresses: ${res.statusText}`);
  }
  return res.json();
}

export async function addAddress(addressData: Partial<AddressType>) {
  const res = await fetch(`${API_BASE_URL}/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(addressData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add address');
  return data;
}

export async function updateAddress(addressId: string, addressData: Partial<AddressType>) {
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(addressData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update address');
  return data;
}

export async function deleteAddress(addressId: string) {
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete address');
  return data;
}

export async function setDefaultAddress(addressId: string) {
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set default address');
  return data;
}

// ──────────────────────────────────────────────
// Order API
// ──────────────────────────────────────────────

export async function createOrder(data: { addressId: string; idempotencyKey: string }) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || 'Failed to create order');
  return resData;
}

export async function getMyOrders(cookieHeader?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  const res = await fetch(`${API_BASE_URL}/orders`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`Failed to fetch orders: ${res.statusText}`);
  }
  return res.json();
}

export async function getOrderById(orderId: string, cookieHeader?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    cache: 'no-store',
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status === 404) return null;
    throw new Error(`Failed to fetch order: ${res.statusText}`);
  }
  return res.json();
}

// ──────────────────────────────────────────────
// Payment API
// ──────────────────────────────────────────────

export async function initiatePayment(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');
  return data;
}

export async function verifyPayment(
  orderId: string,
  payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
}

// ──────────────────────────────────────────────
// Profile Photo API
// ──────────────────────────────────────────────

/**
 * Upload (or replace) the authenticated user's profile photo.
 * Sends multipart/form-data — do NOT manually set Content-Type.
 */
export async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${API_BASE_URL}/profile/photo`, {
    method: 'POST',
    credentials: 'include',
    // No Content-Type header — browser sets it automatically with the correct boundary
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload profile photo');
  return data;
}

/**
 * Delete the authenticated user's profile photo.
 */
export async function deleteProfilePhoto() {
  const res = await fetch(`${API_BASE_URL}/profile/photo`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete profile photo');
  return data;
}

// ==========================================
// 8. ADMIN API
// ==========================================

export async function getAdminProducts(page = 1, limit = 50) {
  const res = await fetch(`${API_BASE_URL}/admin/products?page=${page}&limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin products');
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createAdminProduct(payload: any) {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAdminProduct(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
}

export async function deleteAdminProduct(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete product');
  return data;
}

export async function getAdminOrders(page = 1, limit = 20, status?: string, paymentStatus?: string) {
  let url = `${API_BASE_URL}/admin/orders?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (paymentStatus) url += `&paymentStatus=${paymentStatus}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin orders');
  return data;
}

export async function getAdminOrderById(id: string) {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
  return data;
}

export async function updateAdminOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update order status');
  return data;
}
