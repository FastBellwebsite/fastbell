import { Product } from '@/types';
import { storage } from './storage';

export const mockProductService = {
  getAllProducts: (): Product[] => {
    return storage.getProducts();
  },

  getProductsByCampus: (campusId: string): Product[] => {
    return storage.getProducts().filter(p => p.campusId === campusId);
  },

  getProductsByStore: (storeId: string): Product[] => {
    return storage.getProducts().filter(p => p.storeId === storeId);
  },

  getProductById: (productId: string): Product | undefined => {
    return storage.getProducts().find(p => p.id === productId);
  },

  createProduct: (product: Product): Product => {
    const products = storage.getProducts();
    const isAvail = product.isAvailable !== false && product.available !== false;
    const normalizedProduct: Product = {
      ...product,
      isAvailable: isAvail,
      available: isAvail
    };
    products.unshift(normalizedProduct);
    storage.setProducts(products);
    return normalizedProduct;
  },

  updateProduct: (product: Product) => {
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      const isAvail = product.isAvailable !== false && product.available !== false;
      products[index] = {
        ...products[index],
        ...product,
        isAvailable: isAvail,
        available: isAvail
      };
      storage.setProducts(products);
    }
  },

  deleteProduct: (productId: string) => {
    const products = storage.getProducts();
    storage.setProducts(products.filter(p => p.id !== productId));
  },

  toggleProductAvailability: (productId: string) => {
    const products = storage.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      const current = product.isAvailable !== false && product.available !== false;
      const next = !current;
      product.isAvailable = next;
      product.available = next;
      storage.setProducts(products);
    }
  }
};
