import { PersistedData, User, Store, Product, Order, Category, CartItem } from '../types';
import { seedUsers, seedStores, seedProducts, seedOrders, seedCategories } from '../data/seed';

export const STORAGE_KEY = 'fastbell_data_v1';
export const CARTS_KEY = 'fastbell_carts_v1';
export const SESSION_KEY = 'fastbell_session_v1';

const getInitialData = (): PersistedData => ({
  version: 1,
  users: JSON.parse(JSON.stringify(seedUsers)),
  stores: JSON.parse(JSON.stringify(seedStores)),
  products: JSON.parse(JSON.stringify(seedProducts)),
  orders: JSON.parse(JSON.stringify(seedOrders)),
  categories: JSON.parse(JSON.stringify(seedCategories))
});

export const storage = {
  init: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        storage.reset();
      } else {
        const data = JSON.parse(raw) as PersistedData;
        if (!data || data.version !== 1 || !data.stores || data.stores.length < 4 || !data.products || data.products.length < 4) {
          storage.reset();
        } else {
          let hasMigration = false;

          // Clean out any legacy demo users
          const demoUserIds = new Set(['student-001', 'vendor-001', 'vendor-002', 'delivery-001', 'admin-001']);
          if (Array.isArray(data.users)) {
            const cleanUsers = data.users.filter(u => !demoUserIds.has(u.id));
            if (cleanUsers.length !== data.users.length) {
              data.users = cleanUsers;
              hasMigration = true;
            }
          }

          // Clean out any legacy demo orders
          const demoOrderIds = new Set(['order-001', 'order-002']);
          if (Array.isArray(data.orders)) {
            const cleanOrders = data.orders.filter(o => !demoOrderIds.has(o.id));
            if (cleanOrders.length !== data.orders.length) {
              data.orders = cleanOrders;
              hasMigration = true;
            }
          }

          // Merge any newly introduced seed products into local catalog
          if (Array.isArray(data.products)) {
            const existingIds = new Set(data.products.map(p => p.id));
            const newProducts = seedProducts.filter(sp => !existingIds.has(sp.id));
            if (newProducts.length > 0) {
              hasMigration = true;
              data.products = [...data.products, ...newProducts];
            }
          }

          // Ensure stores have coordinates and serviceability
          if (Array.isArray(data.stores)) {
            data.stores = data.stores.map(s => {
              const seed = seedStores.find(ss => ss.id === s.id);
              if (seed && (!s.latitude || !s.serviceRadiusKm)) {
                hasMigration = true;
                return {
                  ...s,
                  latitude: seed.latitude,
                  longitude: seed.longitude,
                  locality: seed.locality,
                  city: seed.city,
                  serviceRadiusKm: seed.serviceRadiusKm
                };
              }
              return s;
            });
          }
          // Ensure products map to the canonical seeded images
          if (Array.isArray(data.products)) {
            data.products = data.products.map(p => {
              const seed = seedProducts.find(sp => sp.id === p.id);
              if (seed && seed.image !== p.image) {
                hasMigration = true;
                return { ...p, image: seed.image };
              }
              return p;
            });
          }

          // Ensure categories map to the canonical seeded local images
          if (Array.isArray(data.categories)) {
            data.categories = data.categories.map(c => {
              const seed = seedCategories.find(sc => sc.id === c.id);
              if (seed && (!c.icon || c.icon.startsWith('http') || c.icon !== seed.icon)) {
                hasMigration = true;
                return { ...c, icon: seed.icon, name: seed.name, description: seed.description };
              }
              return c;
            });
          }

          if (hasMigration) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: STORAGE_KEY } }));
          }

          // Check current active session as well: purge if belonging to old demo user
          const currentSession = storage.getSession();
          if (currentSession && demoUserIds.has(currentSession.id)) {
            storage.setSession(null);
          }
        }
      }
    } catch {
      storage.reset();
    }
  },

  reset: () => {
    const initial = getInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    localStorage.removeItem(CARTS_KEY);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    // Broadcast custom events for same-tab listeners
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: STORAGE_KEY } }));
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: CARTS_KEY } }));
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: SESSION_KEY } }));
  },

  read: (): PersistedData => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = getInitialData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return getInitialData();
    }
  },

  write: (data: PersistedData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: STORAGE_KEY } }));
  },

  // Users
  getUsers: (): User[] => storage.read().users,
  setUsers: (users: User[]) => {
    const d = storage.read();
    d.users = users;
    storage.write(d);
  },

  // Stores
  getStores: (): Store[] => storage.read().stores,
  setStores: (stores: Store[]) => {
    const d = storage.read();
    d.stores = stores;
    storage.write(d);
  },

  // Products
  getProducts: (): Product[] => storage.read().products,
  setProducts: (products: Product[]) => {
    const d = storage.read();
    d.products = products;
    storage.write(d);
  },

  // Orders
  getOrders: (): Order[] => storage.read().orders,
  setOrders: (orders: Order[]) => {
    const d = storage.read();
    d.orders = orders;
    storage.write(d);
  },

  // Categories
  getCategories: (): Category[] => storage.read().categories,

  // User-scoped Carts Persistence
  getUserCart: (userId: string): CartItem[] => {
    try {
      const raw = localStorage.getItem(CARTS_KEY);
      const allCarts: Record<string, CartItem[]> = raw ? JSON.parse(raw) : {};
      return allCarts[userId] || [];
    } catch {
      return [];
    }
  },

  setUserCart: (userId: string, items: CartItem[]) => {
    try {
      const raw = localStorage.getItem(CARTS_KEY);
      const allCarts: Record<string, CartItem[]> = raw ? JSON.parse(raw) : {};
      allCarts[userId] = items;
      localStorage.setItem(CARTS_KEY, JSON.stringify(allCarts));
    } catch {
      // ignore
    }
  },

  clearAllCarts: () => {
    localStorage.removeItem(CARTS_KEY);
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: CARTS_KEY } }));
  },

  // Session Management (Tab-scoped with sessionStorage, fallback to localStorage)
  // CANONICAL SINGLE SOURCE OF TRUTH: Always look up user in canonical users list by unique ID!
  getSession: (): User | null => {
    try {
      let sessionData: any = null;
      const sessionRaw = sessionStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        sessionData = JSON.parse(sessionRaw);
      } else {
        const localRaw = localStorage.getItem(SESSION_KEY);
        if (localRaw) sessionData = JSON.parse(localRaw);
      }
      if (!sessionData) return null;

      const userId = sessionData.userId || sessionData.id;
      if (!userId) return null;

      const canonicalUser = storage.getUsers().find(u => u.id === userId);
      return canonicalUser || null;
    } catch {
      return null;
    }
  },

  setSession: (user: User | null) => {
    if (user && user.id) {
      const sessionPayload = {
        userId: user.id,
        id: user.id,
        role: user.role,
        campusId: user.campusId,
        email: user.email.toLowerCase().trim()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent('fastbell_state_change', { detail: { key: SESSION_KEY } }));
  }
};

// Convenience exports for legacy/direct components
export const getUsers = storage.getUsers;
export const getStores = storage.getStores;
export const getProducts = storage.getProducts;
export const getOrders = storage.getOrders;
export const saveStore = (store: Store) => {
  const stores = storage.getStores();
  stores.push(store);
  storage.setStores(stores);
};

// Auto-initialize on import
storage.init();

if (typeof window !== 'undefined') {
  (window as any).fastbellStorage = storage;
}

