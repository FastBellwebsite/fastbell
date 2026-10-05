const API_BASE_URL = 'http://localhost:5000/api';

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

const getToken = () => localStorage.getItem(TOKEN_KEY);

const request = async (path: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

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

  me: () => request('/auth/me')
};

export const authToken = {
  get: getToken,
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};