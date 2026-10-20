import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode
} from 'react';
import { Category, Product, Store } from '@/types';
import { api } from '@/services/api';
import { storage } from '@/services/storage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

type StoreContextValue = {
  stores: Store[];
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  refreshData: () => void;
  addProduct: (product: any) => Promise<any>;
  updateProduct: (product: any) => Promise<any>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  updateStoreStatus: (storeId: string, isOpen: boolean) => Promise<void>;
  updateStoreImage: (storeId: string, image: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const mapStore = (store: any): Store => ({
  id: store.id,
  campusId: store.campusId,
  vendorId: store.vendorId,
  vendorUserId: store.vendorUserId || store.vendor?.userId || (String(store.vendorId || "").startsWith("usr-") ? store.vendorId : undefined),
  vendorProfileId: store.vendorProfileId || store.vendorId,
  name: store.name,
  category: store.category || '',
  isOpen: store.isOpen ?? true,
  rating: Number(store.rating ?? 0),
  image: store.imageUrl || '',
  description: store.description || '',
  locationLabel: store.locationLabel || '',
  distanceFromCampus:
    store.distanceKm != null
      ? Math.round(Number(store.distanceKm) * 1000)
      : Number(store.distanceFromCampus ?? 0),
  deliveryMinutes: Number(store.deliveryMinutes ?? 0),
  latitude: store.latitude,
  longitude: store.longitude,
  locality: store.locality,
  city: store.city,
  serviceRadiusKm: 6
});

const mapProduct = (product: any): Product => ({
  id: product.id,
  storeId: product.storeId,
  campusId: product.campusId || product.store?.campusId || '',
  name: product.name,
  category: product.category || '',
  categoryId: product.categoryId,
  price: Number(product.price ?? 0),
  originalPrice:
    product.originalPrice !== null &&
    product.originalPrice !== undefined
      ? Number(product.originalPrice)
      : undefined,
  rating: Number(product.rating ?? 0),
  image: product.imageUrl || product.image || '',
  description: product.description || '',
  stockQuantity: product.stockQuantity !== undefined ? Number(product.stockQuantity) : 0,
  lowStockThreshold: product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : 5,
  trackInventory: product.trackInventory !== false,
  stockStatus: product.stockStatus || (product.trackInventory === false ? 'SERVICE' : (Number(product.stockQuantity) <= 0 ? 'OUT_OF_STOCK' : (Number(product.stockQuantity) <= (product.lowStockThreshold || 5) ? 'LOW_STOCK' : 'IN_STOCK'))),
  isAvailable: product.isAvailable ?? product.available ?? true,
  available: product.available ?? product.isAvailable ?? true
});

const mapCategory = (category: any): Category => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  icon: category.icon || category.imageUrl || '',
  description: category.description || ''
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const campusId = user?.campusId || 'sns';

  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return storage.getCategories() || [];
    } catch {
      return [];
    }
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = user?.id || null;

  const loadCatalog = async () => {
    try {
      setIsLoading(true);

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts({
          campusId,
          isAvailable: 'all'
        }),
        api.getCategories().catch((err: any) => {
          console.error('Failed to load categories:', err);
          return { data: [] };
        })
      ]);

      const productsData = Array.isArray(productsResponse?.data)
        ? productsResponse.data
        : [];

      const rawCategories = Array.isArray(categoriesResponse?.data)
        ? categoriesResponse.data
        : [];

      if (rawCategories.length > 0) {
        const mappedCats = rawCategories.map(mapCategory);
        setCategories(mappedCats);
        try {
          storage.setCategories?.(mappedCats);
        } catch {
          // ignore
        }
      }

      let storesData: any[] = [];
      const userLocation = user?.location;

      const latitude = userLocation?.latitude;
      const longitude = userLocation?.longitude;

      if (
        user?.role === 'student' &&
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        const nearbyResponse = await api.getNearbyVendors(
          latitude,
          longitude,
          campusId,
          6
        );

        storesData = Array.isArray(nearbyResponse?.data)
          ? nearbyResponse.data
          : [];
      } else {
        const vendorsResponse = await api.getVendors(campusId);

        const backendVendors = Array.isArray(vendorsResponse?.data)
          ? vendorsResponse.data
          : [];

        storesData = backendVendors.flatMap((vendor: any) =>
          Array.isArray(vendor.stores) ? vendor.stores : []
        );
      }

      setProducts(productsData.map(mapProduct));
      setStores(storesData.map(mapStore));
    } catch (error) {
      console.error('Failed to load FastBell catalog:', error);
      toast.error('Unable to load stores and products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [
    campusId,
    user?.id,
    user?.role,
    user?.location?.latitude,
    user?.location?.longitude
  ]);

  useEffect(() => {
    const key = currentUserId
      ? `fastbell_fav_${currentUserId}`
      : 'fastbell_fav_guest';

    try {
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
  }, [currentUserId, user]);

  const refreshData = async () => {
    await loadCatalog();
  };

  const addProduct = async (productData: any) => {
    try {
      const payload = {
        name: productData.name,
        price: Number(productData.price),
        originalPrice:
          productData.originalPrice !== undefined &&
          productData.originalPrice !== null &&
          productData.originalPrice !== ''
            ? Number(productData.originalPrice)
            : undefined,
        storeId: productData.storeId,
        categoryId: productData.categoryId || productData.category,
        category: productData.category,
        description: productData.description,
        imageUrl: productData.image || productData.imageUrl,
        stockQuantity:
          productData.stockQuantity !== undefined
            ? Number(productData.stockQuantity)
            : 10,
        lowStockThreshold:
          productData.lowStockThreshold !== undefined
            ? Number(productData.lowStockThreshold)
            : 5,
        trackInventory:
          productData.trackInventory !== undefined
            ? Boolean(productData.trackInventory)
            : true,
        isAvailable: productData.isAvailable !== false && productData.available !== false
      };

      const response = await api.createProduct(payload);

      if (response?.data) {
        const newProduct = mapProduct(response.data);
        setProducts(prev => [newProduct, ...prev]);
        toast.success('Product created successfully');
        return newProduct;
      }
    } catch (error: any) {
      console.error('Failed to add product:', error);
      toast.error(error.message || 'Failed to add product');
      throw error;
    }
  };

  const updateProduct = async (productData: any) => {
    try {
      const payload: Record<string, unknown> = {
        name: productData.name,
        price: Number(productData.price),
        originalPrice:
          productData.originalPrice !== undefined &&
          productData.originalPrice !== null &&
          productData.originalPrice !== ''
            ? Number(productData.originalPrice)
            : undefined,
        categoryId: productData.categoryId || productData.category,
        category: productData.category,
        description: productData.description,
        imageUrl: productData.image || productData.imageUrl,
        stockQuantity:
          productData.stockQuantity !== undefined
            ? Number(productData.stockQuantity)
            : undefined,
        lowStockThreshold:
          productData.lowStockThreshold !== undefined
            ? Number(productData.lowStockThreshold)
            : undefined,
        trackInventory:
          productData.trackInventory !== undefined
            ? Boolean(productData.trackInventory)
            : undefined,
        isAvailable:
          productData.isAvailable !== undefined
            ? Boolean(productData.isAvailable)
            : productData.available !== undefined
            ? Boolean(productData.available)
            : undefined
      };

      const response = await api.updateProduct(productData.id, payload);

      if (response?.data) {
        const updated = mapProduct(response.data);
        setProducts(prev =>
          prev.map(p => (p.id === updated.id ? updated : p))
        );
        toast.success('Product updated successfully');
        return updated;
      }
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.message || 'Failed to update product');
      throw error;
    }
  };

  const toggleProductAvailability = async (id: string) => {
    const current = products.find(p => p.id === id);
    const nextState = current ? !current.isAvailable : true;

    // Optimistic state update
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, isAvailable: nextState, available: nextState }
          : p
      )
    );

    try {
      const response = await api.updateProductAvailability(id, nextState);
      if (response?.data) {
        const updated = mapProduct(response.data);
        setProducts(prev =>
          prev.map(p => (p.id === updated.id ? updated : p))
        );
        toast.success(`Product set to ${nextState ? 'Available' : 'Unavailable'}`);
        try {
          localStorage.setItem('fastbell_product_sync', JSON.stringify({ id, isAvailable: nextState, ts: Date.now() }));
          window.dispatchEvent(new CustomEvent('fastbell_product_sync', { detail: { id, isAvailable: nextState } }));
        } catch {
          // ignore
        }
      }
    } catch (error: any) {
      // Revert optimistic state
      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, isAvailable: !nextState, available: !nextState }
            : p
        )
      );
      console.error('Failed to toggle product availability:', error);
      toast.error(error.message || 'Failed to update availability');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await api.deleteProduct(id);

      if (response?.data?.deactivated) {
        // Product was deactivated because of existing orders
        setProducts(prev =>
          prev.map(p =>
            p.id === id
              ? { ...p, isAvailable: false, available: false }
              : p
          )
        );
        toast.success('Product has order history and was deactivated');
      } else {
        // Product was hard deleted
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product deleted successfully');
      }
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error(error.message || 'Failed to delete product');
      throw error;
    }
  };

  const updateStoreImage = (storeId: string, image: string) => {
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, image } : s))
    );
    try {
      const allStores = storage.getStores();
      const st = allStores.find(s => s.id === storeId);
      if (st) {
        st.image = image;
        storage.setStores(allStores);
      }
    } catch {
      // ignore
    }
  };

  const updateStoreStatus = async (storeId: string, isOpen: boolean) => {
    const previousStore = stores.find(s => s.id === storeId);
    if (!previousStore) return;

    // Optimistic state update
    setStores(prev =>
      prev.map(s => (s.id === storeId ? { ...s, isOpen } : s))
    );

    try {
      const response = await api.updateStore(storeId, { isOpen });
      if (response?.data) {
        const updated = mapStore(response.data);
        setStores(prev =>
          prev.map(s =>
            s.id === updated.id
              ? { ...s, ...updated, image: updated.image || s.image }
              : s
          )
        );
      }
      toast.success(`Store marked as ${isOpen ? 'Open' : 'Closed'}`);
    } catch (error: any) {
      // Revert optimistic state
      setStores(prev =>
        prev.map(s =>
          s.id === storeId ? { ...s, isOpen: previousStore.isOpen } : s
        )
      );
      console.error('Failed to update store status:', error);
      toast.error(error.message || 'Failed to update store status');
      throw error;
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id];

      const key = currentUserId
        ? `fastbell_fav_${currentUserId}`
        : 'fastbell_fav_guest';

      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save favorites', error);
      }

      return next;
    });
  };

  const value = useMemo(
    () => ({
      stores,
      products,
      categories,
      isLoading,
      refreshData,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductAvailability,
      updateStoreStatus,
      updateStoreImage,
      favorites,
      toggleFavorite
    }),
    [stores, products, categories, isLoading, favorites]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const value = useContext(StoreContext);

  if (!value) {
    throw new Error('useStore must be used within a StoreProvider');
  }

  return value;
};
