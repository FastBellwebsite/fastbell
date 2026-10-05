import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CartItem, Product, PopulatedCartItem } from '@/types';
import { storage, CARTS_KEY, STORAGE_KEY } from '@/services/storage';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import toast from 'react-hot-toast';

type AddToCartResult = {
  success: boolean;
  conflictStoreId?: string;
  existingStoreName?: string;
};

type CartContextValue = {
  cart: CartItem[];
  populatedCart: PopulatedCartItem[];
  addToCart: (productId: string, storeId: string, quantity?: number) => AddToCartResult;
  replaceCartAndAdd: (productId: string, storeId: string, quantity?: number) => void;
  updateQuantity: (productId: string, amount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isValidForCheckout: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { products, stores } = useStore();
  const userId = user?.id || 'guest_user';

  const [cart, setCart] = useState<CartItem[]>(() => storage.getUserCart(userId));

  // Reload cart whenever authenticated user changes
  useEffect(() => {
    setCart(storage.getUserCart(userId));
  }, [userId]);

  const updateCartState = (updater: (prev: CartItem[]) => CartItem[]) => {
    setCart(prev => {
      const next = updater(prev);
      storage.setUserCart(userId, next);
      return next;
    });
  };

  // Cross-tab and reset synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const isCrossTabCart = 'key' in e && e.key === CARTS_KEY;
      const isGlobalReset =
        ('detail' in e && (e as CustomEvent).detail?.key === STORAGE_KEY) ||
        ('key' in e && e.key === STORAGE_KEY);

      if (isCrossTabCart || isGlobalReset) {
        setCart(storage.getUserCart(userId));
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('fastbell_state_change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('fastbell_state_change', handleStorageChange as EventListener);
    };
  }, [userId]);

  // Safely join cart items with live product state
  const populatedCart: PopulatedCartItem[] = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const isAvailable = Boolean(product && product.isAvailable);
      return {
        item,
        product,
        isAvailable
      };
    });
  }, [cart, products]);

  // Centralized Single-Store Rule
  const addToCart = (productId: string, storeId: string, quantity = 1): AddToCartResult => {
    if (cart.length > 0 && cart[0].storeId !== storeId) {
      const conflictStore = stores.find(s => s.id === cart[0].storeId);
      return {
        success: false,
        conflictStoreId: cart[0].storeId,
        existingStoreName: conflictStore?.name || 'another store'
      };
    }

    const existing = cart.find(i => i.productId === productId);
    if (existing) {
      updateCartState(prev =>
        prev.map(i =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        )
      );
    } else {
      updateCartState(prev => [...prev, { productId, storeId, quantity }]);
    }

    // Trigger subtle cart bump micro-interaction across listeners
    window.dispatchEvent(new CustomEvent('fastbell_cart_bump', { detail: { productId, storeId } }));

    return { success: true };
  };

  const replaceCartAndAdd = (productId: string, storeId: string, quantity = 1) => {
    updateCartState(() => [{ productId, storeId, quantity }]);
    toast.success('Started a new cart');
  };

  const updateQuantity = (productId: string, amount: number) => {
    updateCartState(prev =>
      prev
        .map(i => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + amount) } : i))
        .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    updateCartState(prev => prev.filter(i => i.productId !== productId));
    toast.success('Removed item from cart');
  };

  const clearCart = () => {
    setCart([]);
    storage.setUserCart(userId, []);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = populatedCart.reduce((sum, { item, product, isAvailable }) => {
    if (!isAvailable || !product) return sum;
    return sum + product.price * item.quantity;
  }, 0);

  const isValidForCheckout =
    populatedCart.length > 0 && populatedCart.every(p => p.isAvailable && p.product);

  const value = useMemo(
    () => ({
      cart,
      populatedCart,
      addToCart,
      replaceCartAndAdd,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      isValidForCheckout
    }),
    [cart, populatedCart, stores, products]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within a CartProvider');
  return value;
};
