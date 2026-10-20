import type { OrderStatus } from '../types';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const TOKEN_KEY = 'fastbell_auth_token';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'vendor' | 'delivery' | 'admin';
  status?: 'Active' | 'Suspended';
  campusId: string;
  department?: string;
  year?: string;
  addresses?: any[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    locality?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  storeId?: string;
  storeName?: string;
  businessName?: string;
  category?: string;
  description?: string;
  serviceArea?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  availabilityStatus?: string;
};

const getToken = (): string | null => {
  try {
    const keys = [
      TOKEN_KEY,
      'fastbell_token',
      'auth_token',
      'token'
    ];

    for (const key of keys) {
      const val = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (val && typeof val === 'string' && val.trim().length > 0) {
        const cleaned = val.trim();
        // Keep canonical TOKEN_KEY synchronized across storage locations
        if (key !== TOKEN_KEY) {
          try {
            sessionStorage.setItem(TOKEN_KEY, cleaned);
            localStorage.setItem(TOKEN_KEY, cleaned);
          } catch {}
        }
        return cleaned;
      }
    }

    // Check fastbell_session_v1 if token is encapsulated inside session
    for (const storageArea of [sessionStorage, localStorage]) {
      const raw = storageArea.getItem('fastbell_session_v1');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.token === 'string' && parsed.token.trim().length > 0) {
            const cleaned = parsed.token.trim();
            localStorage.setItem(TOKEN_KEY, cleaned);
            sessionStorage.setItem(TOKEN_KEY, cleaned);
            return cleaned;
          }
        } catch {}
      }
    }

    return null;
  } catch {
    return null;
  }
};

const request = async (path: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const api = {
  login: (email: string, password: string, role: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    }),

  register: (payload: Record<string, unknown>) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  me: () => request('/auth/me'),

  updateProfile: (payload: Record<string, unknown>) =>
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

    getProducts: (
    params: Record<string, string | boolean | undefined> = {}
  ) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return request(`/products${query ? `?${query}` : ''}`);
  },

  getProduct: (id: string) =>
    request(`/products/${encodeURIComponent(id)}`),

  createProduct: (payload: {
    name: string;
    price: number;
    originalPrice?: number;
    categoryId: string;
    category?: string;
    storeId?: string;
    description?: string;
    imageUrl?: string;
    stockQuantity?: number;
    isAvailable?: boolean;
  }) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateProduct: (
    id: string,
    payload: Record<string, unknown>
  ) =>
    request(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  updateProductAvailability: (
    id: string,
    isAvailable?: boolean
  ) =>
    request(`/products/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable })
    }),

  deleteProduct: (id: string) =>
    request(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  getCategories: () =>
    request('/categories'),

  getCategory: (id: string) =>
    request(`/categories/${encodeURIComponent(id)}`),

  getNearbyVendors: (
    latitude: number,
    longitude: number,
    campusId?: string,
    radiusKm = 6
  ) => {
    const searchParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radiusKm: String(radiusKm)
    });

    if (campusId) {
      searchParams.set('campusId', campusId);
    }

    return request(`/vendors/nearby?${searchParams.toString()}`);
  },

  getVendors: (campusId?: string) => {
    const query = campusId
      ? `?campusId=${encodeURIComponent(campusId)}`
      : '';

    return request(`/vendors${query}`);
  },

  getVendor: (id: string) =>
    request(`/vendors/${encodeURIComponent(id)}`),

  getVendorProducts: (vendorId: string) =>
    request(`/vendors/${encodeURIComponent(vendorId)}/products`),

  getAddresses: () =>
    request('/addresses'),

  createAddress: (payload: Record<string, unknown>) =>
    request('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAddress: (
    id: string,
    payload: Record<string, unknown>
  ) =>
    request(`/addresses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteAddress: (id: string) =>
    request(`/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  getCart: () =>
    request('/cart'),

  addToCart: (productId: string, quantity: number) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    }),

  updateCartItem: (id: string, quantity: number) =>
    request(`/cart/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    }),

  deleteCartItem: (id: string) =>
    request(`/cart/items/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  clearCart: () =>
    request('/cart', {
      method: 'DELETE'
    }),

  getOrders: () =>
    request('/orders'),

  getOrder: (id: string) =>
    request(`/orders/${encodeURIComponent(id)}`),

  createOrder: (payload: {
    deliveryAddressId: string;
    paymentMethod: string;
    deliveryFee?: number;
    discount?: number;
  }) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    deliveryPartnerId?: string,
    currentStatus?: OrderStatus
  ) =>
    request(`/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, deliveryPartnerId, currentStatus })
    }),

  cancelOrder: (id: string, reason?: string) =>
    request(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  getDeliveryPartners: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/deliveries/admin/partners${query}`);
  },

  updateDeliveryPartnerVerification: (
    partnerId: string,
    status: 'APPROVED' | 'REJECTED'
  ) =>
    request(`/deliveries/admin/partners/${encodeURIComponent(partnerId)}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  claimOrder: (id: string) =>
    request(`/orders/${encodeURIComponent(id)}/claim`, {
      method: 'POST'
    }),

  getUsers: (params?: { role?: string; search?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },

  updateUserStatus: (id: string, isActive: boolean) =>
    request(`/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    }),

  uploadProductImage: (file: File, productId?: string, storeId?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (productId) formData.append('productId', productId);
    if (storeId) formData.append('storeId', storeId);
    return request('/uploads/product-image', {
      method: 'POST',
      body: formData
    });
  },

  uploadStoreImage: (file: File, storeId?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (storeId) formData.append('storeId', storeId);
    return request('/uploads/store-image', {
      method: 'POST',
      body: formData
    });
  },

  updateStore: (storeId: string, payload: Record<string, unknown>) =>
    request(`/vendors/stores/${encodeURIComponent(storeId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
};

export const authToken = {
  get: getToken,

  set: (token: string) => {
    try {
      const cleaned = token.trim();
      const keys = [TOKEN_KEY, 'fastbell_token', 'auth_token', 'token'];
      for (const k of keys) {
        localStorage.setItem(k, cleaned);
        sessionStorage.setItem(k, cleaned);
      }
    } catch {
      // ignore
    }
  },

  clear: () => {
    try {
      const keys = [TOKEN_KEY, 'fastbell_token', 'auth_token', 'token', 'fastbell_session_v1'];
      for (const k of keys) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }
};
