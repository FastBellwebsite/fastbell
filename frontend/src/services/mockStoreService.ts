import { Store, Product } from '@/types';
import { storage } from './storage';
import { mockProductService } from './mockProductService';

export const mockStoreService = {
  // STORES
  getStoresByCampus: (campusId: string): Store[] => {
    return storage.getStores().filter(s => s.campusId === campusId);
  },

  getStoreById: (storeId: string): Store | undefined => {
    return storage.getStores().find(s => s.id === storeId);
  },

  getAllStores: (): Store[] => {
    return storage.getStores();
  },

  createStore: (store: Store): Store => {
    const stores = storage.getStores();
    stores.push(store);
    storage.setStores(stores);
    return store;
  },

  updateStoreStatus: (storeId: string, isOpen: boolean) => {
    const stores = storage.getStores();
    const store = stores.find(s => s.id === storeId);
    if (store) {
      store.isOpen = isOpen;
      storage.setStores(stores);
    }
  },

  // PRODUCTS (Delegated for unified service access)
  getProductsByCampus: mockProductService.getProductsByCampus,
  getProductsByStore: mockProductService.getProductsByStore,
  getProductById: mockProductService.getProductById,
  getAllProducts: mockProductService.getAllProducts,
  createProduct: mockProductService.createProduct,
  updateProduct: mockProductService.updateProduct,
  deleteProduct: mockProductService.deleteProduct,
  toggleProductAvailability: mockProductService.toggleProductAvailability
};
