import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CartItem, PopulatedCartItem } from '@/types';
import { storage } from '@/services/storage';
import { api } from '@/services/api';
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
  const isAuthenticated = Boolean(user?.id);

  const [cart, setCart] = useState<CartItem[]>(() =>
    isAuthenticated ? [] : storage.getUserCart(userId)
  );

  const mapBackendCart = (data: any): CartItem[] => {
    const backendItems = Array.isArray(data?.items) ? data.items : [];

    return backendItems.map((item: any) => {
      const productId = String(item.product?.id || '');
      const product = products.find(p => p.id === productId);

      return {
        productId,
        storeId: item.product?.storeId || product?.storeId || item.storeId || '',
        quantity: Number(item.quantity) || 0,
        cartItemId: String(item.id)
      };
    }).filter((item: CartItem) => item.productId && item.quantity > 0);
  };

  const loadBackendCart = async () => {
    if (!isAuthenticated) {
      setCart(storage.getUserCart(userId));
      return;
    }

    try {
      const response = await api.getCart();
      setCart(mapBackendCart(response.data));
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart([]);
    }
  };

  // Load the correct cart whenever authentication changes.
  useEffect(() => {
    if (isAuthenticated) {
      loadBackendCart();
    } else {
      setCart(storage.getUserCart(userId));
    }
  }, [userId, isAuthenticated]);

  // Reload the backend cart when live product data becomes available.
  // This is important because the backend cart response does not include storeId.
  useEffect(() => {
    if (isAuthenticated && products.length > 0) {
      loadBackendCart();
    }
  }, [isAuthenticated, products]);

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

  // Guest cart remains local until the user is authenticated.
  const updateGuestCart = (updater: (prev: CartItem[]) => CartItem[]) => {
    setCart(prev => {
      const next = updater(prev);
      storage.setUserCart(userId, next);
      return next;
    });
  };

  // Centralized single-store rule.
  const addToCart = (
    productId: string,
    storeId: string,
    quantity = 1
  ): AddToCartResult => {
    if (quantity <= 0) {
      return { success: false };
    }

    if (cart.length > 0 && cart[0].storeId !== storeId) {
      const conflictStore = stores.find(s => s.id === cart[0].storeId);

      return {
        success: false,
        conflictStoreId: cart[0].storeId,
        existingStoreName: conflictStore?.name || 'another store'
      };
    }

    if (!isAuthenticated) {
      const existing = cart.find(item => item.productId === productId);

      if (existing) {
        updateGuestCart(prev =>
          prev.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        updateGuestCart(prev => [
          ...prev,
          {
            productId,
            storeId,
            quantity
          }
        ]);
      }

      window.dispatchEvent(
        new CustomEvent('fastbell_cart_bump', {
          detail: { productId, storeId }
        })
      );

      return { success: true };
    }

    // Backend is authoritative for authenticated users.
    api.addToCart(productId, quantity)
      .then(response => {
        setCart(mapBackendCart(response.data));

        window.dispatchEvent(
          new CustomEvent('fastbell_cart_bump', {
            detail: { productId, storeId }
          })
        );
      })
      .catch(error => {
        console.error('Failed to add item to cart:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
      });

    return { success: true };
  };

  const replaceCartAndAdd = (
    productId: string,
    storeId: string,
    quantity = 1
  ) => {
    if (!isAuthenticated) {
      updateGuestCart(() => [
        {
          productId,
          storeId,
          quantity
        }
      ]);

      toast.success('Started a new cart');
      return;
    }

    api.clearCart()
      .then(() => api.addToCart(productId, quantity))
      .then(response => {
        setCart(mapBackendCart(response.data));

        window.dispatchEvent(
          new CustomEvent('fastbell_cart_bump', {
            detail: { productId, storeId }
          })
        );

        toast.success('Started a new cart');
      })
      .catch(error => {
        console.error('Failed to replace cart:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to start a new cart');
      });
  };

  const updateQuantity = (
    productId: string,
    amount: number
  ) => {
    const existing = cart.find(item => item.productId === productId);

    if (!existing) {
      return;
    }

    const newQuantity = existing.quantity + amount;

    if (!isAuthenticated) {
      updateGuestCart(prev =>
        prev
          .map(item =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.max(0, item.quantity + amount)
                }
              : item
          )
          .filter(item => item.quantity > 0)
      );

      return;
    }

    if (!existing.cartItemId) {
      toast.error('Cart item could not be identified');
      return;
    }

    if (newQuantity <= 0) {
      api.deleteCartItem(existing.cartItemId)
        .then(response => {
          setCart(mapBackendCart(response.data));
        })
        .catch(error => {
          console.error('Failed to remove cart item:', error);
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to remove item'
          );
        });

      return;
    }

    api.updateCartItem(existing.cartItemId, newQuantity)
      .then(response => {
        setCart(mapBackendCart(response.data));
      })
      .catch(error => {
        console.error('Failed to update cart quantity:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update quantity'
        );
      });
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find(item => item.productId === productId);

    if (!existing) {
      return;
    }

    if (!isAuthenticated) {
      updateGuestCart(prev =>
        prev.filter(item => item.productId !== productId)
      );

      toast.success('Removed item from cart');
      return;
    }

    if (!existing.cartItemId) {
      toast.error('Cart item could not be identified');
      return;
    }

    api.deleteCartItem(existing.cartItemId)
      .then(response => {
        setCart(mapBackendCart(response.data));
        toast.success('Removed item from cart');
      })
      .catch(error => {
        console.error('Failed to remove cart item:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to remove item from cart'
        );
      });
  };

  const clearCart = () => {
    if (!isAuthenticated) {
      setCart([]);
      storage.setUserCart(userId, []);
      return;
    }

    api.clearCart()
      .then(() => {
        setCart([]);
      })
      .catch(error => {
        console.error('Failed to clear cart:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to clear cart'
        );
      });
  };

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = populatedCart.reduce(
    (sum, { item, product, isAvailable }) => {
      if (!isAvailable || !product) {
        return sum;
      }

      return sum + product.price * item.quantity;
    },
    0
  );

  const isValidForCheckout =
    populatedCart.length > 0 &&
    populatedCart.every(
      populatedItem =>
        populatedItem.isAvailable && populatedItem.product
    );

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
    [
      cart,
      populatedCart,
      stores,
      products,
      cartCount,
      cartTotal,
      isValidForCheckout
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return value;
};