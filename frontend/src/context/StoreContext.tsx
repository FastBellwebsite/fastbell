import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Product, Store } from '@/types';
import { mockStoreService } from '@/services/mockStoreService';
import { STORAGE_KEY } from '@/services/storage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

type StoreContextValue = {
  stores: Store[];
  products: Product[];
  refreshData: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;
  updateStoreStatus: (storeId: string, isOpen: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const campusId = user?.campusId || 'sns';

  const [stores, setStores] = useState<Store[]>(() => mockStoreService.getAllStores());
  const [products, setProducts] = useState<Product[]>(() => mockStoreService.getAllProducts());

  const currentUserId = user?.id || null;
  const favKey = currentUserId ? `fastbell_fav_${currentUserId}` : 'fastbell_fav_guest';
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(favKey);
      if (raw) return JSON.parse(raw);
      if (user && (user as any).favorites) {
        return (user as any).favorites || [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const refreshData = () => {
    setStores(mockStoreService.getAllStores());
    setProducts(mockStoreService.getAllProducts());
  };

  // Cross-tab and local persistence listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const changedKey = 'key' in e ? e.key : (e as CustomEvent).detail?.key;
      if (changedKey === STORAGE_KEY) {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('fastbell_state_change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('fastbell_state_change', handleStorageChange as EventListener);
    };
  }, []);

  // Update favorites when user changes
  useEffect(() => {
    try {
      const key = currentUserId ? `fastbell_fav_${currentUserId}` : 'fastbell_fav_guest';
      const raw = localStorage.getItem(key);
      if (raw) {
        setFavorites(JSON.parse(raw));
      } else if (user && (user as any).favorites) {
        setFavorites((user as any).favorites || []);
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }
  }, [currentUserId]);

  const addProduct = (product: Product) => {
    mockStoreService.createProduct(product);
    refreshData();
    toast.success('Product added successfully');
  };

  const updateProduct = (product: Product) => {
    mockStoreService.updateProduct(product);
    refreshData();
    toast.success('Product updated');
  };

  const deleteProduct = (id: string) => {
    mockStoreService.deleteProduct(id);
    refreshData();
    toast.success('Product deleted');
  };

  const toggleProductAvailability = (id: string) => {
    mockStoreService.toggleProductAvailability(id);
    refreshData();
    toast.success('Availability updated');
  };

  const updateStoreStatus = (storeId: string, isOpen: boolean) => {
    mockStoreService.updateStoreStatus(storeId, isOpen);
    refreshData();
    toast.success(`Store marked as ${isOpen ? 'Open' : 'Closed'}`);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        const key = currentUserId ? `fastbell_fav_${currentUserId}` : 'fastbell_fav_guest';
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save favorites', err);
      }
      return next;
    });
  };

  const value = useMemo(
    () => ({
      stores,
      products,
      refreshData,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductAvailability,
      updateStoreStatus,
      favorites,
      toggleFavorite
    }),
    [stores, products, favorites]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used within a StoreProvider');
  return value;
};
