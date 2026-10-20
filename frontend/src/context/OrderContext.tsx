import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback
} from 'react';
import { Order, OrderItem, OrderStatus, Address } from '@/types';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { canTransitionOrderStatus } from '@/utils/orderFlow';
import { STORAGE_KEY } from '@/services/storage';
import toast from 'react-hot-toast';

export type CreateOrderInput = {
  deliveryAddressId: string;
  paymentMethod: string;
  deliveryFee?: number;
  discount?: number;
};

type OrderContextValue = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  clearError: () => void;
  createOrder: (input: CreateOrderInput | Order) => Promise<Order>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  acceptOrder: (orderId: string) => void;
  markPreparing: (orderId: string) => void;
  markReady: (orderId: string) => void;
  acceptDelivery: (orderId: string, deliveryPartnerId?: string) => Promise<Order | void> | void;
  markPickedUp: (orderId: string) => Promise<Order | void> | void;
  markOutForDelivery: (orderId: string) => Promise<Order | void> | void;
  markDelivered: (orderId: string) => Promise<Order | void> | void;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order | void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, partnerId?: string) => void;
  rateOrder: (orderId: string, rating: number, feedback?: string) => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export const mapApiOrderToFrontendOrder = (apiOrder: any, fallbackStudentId?: string): Order => {
  const subtotal = Number(apiOrder.subtotal ?? 0);
  const deliveryFee = Number(apiOrder.deliveryFee ?? 0);
  const discount = Number(apiOrder.discount ?? 0);
  const total = Number(
    apiOrder.totalAmount ?? (subtotal + deliveryFee - discount)
  );

  const items: OrderItem[] = Array.isArray(apiOrder.items)
    ? apiOrder.items.map((item: any) => ({
        productId: item.productId,
        name: item.productName || item.product?.name || 'Campus Item',
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? 0),
        subtotal: Number(
          item.totalPrice ?? (Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1))
        )
      }))
    : [];

  const rawAddr = apiOrder.deliveryAddress;
  const deliveryAddress: Address = rawAddr
    ? {
        id: rawAddr.id,
        label: rawAddr.label || 'Delivery Address',
        line: rawAddr.line || rawAddr.addressLine || '',
        locality: rawAddr.locality || '',
        hostelName: rawAddr.hostelName || '',
        roomNumber: rawAddr.roomNumber || '',
        city: rawAddr.city || 'Coimbatore',
        state: rawAddr.state || 'Tamil Nadu',
        postalCode: rawAddr.postalCode || '',
        landmark: rawAddr.landmark || '',
        latitude: typeof rawAddr.latitude === 'number' ? rawAddr.latitude : undefined,
        longitude: typeof rawAddr.longitude === 'number' ? rawAddr.longitude : undefined,
        isDefault: Boolean(rawAddr.isDefault)
      }
    : {
        id: 'addr-default',
        label: 'Delivery Address',
        line: 'Campus Delivery Point',
        city: 'Coimbatore',
        state: 'Tamil Nadu'
      };

  const rawCustomer = apiOrder.customer || apiOrder.student;
  const customer = rawCustomer
    ? {
        id: rawCustomer.id,
        name: rawCustomer.name || 'Campus Student',
        email: rawCustomer.email || '',
        phone: rawCustomer.phone || null
      }
    : undefined;

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    campusId: apiOrder.campusId || apiOrder.store?.campusId || 'sns',
    studentId: apiOrder.studentId || fallbackStudentId || '',
    storeId: apiOrder.storeId || apiOrder.store?.id || '',
    deliveryPartnerId: apiOrder.delivery?.deliveryPartnerId || null,
    date: apiOrder.createdAt || new Date().toISOString(),
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    status: (apiOrder.status || apiOrder.orderStatus || 'PLACED') as OrderStatus,
    cancellationRemainingSeconds: typeof apiOrder.cancellationRemainingSeconds === 'number'
      ? apiOrder.cancellationRemainingSeconds
      : undefined,
    cancellationWindowMinutes: typeof apiOrder.cancellationWindowMinutes === 'number'
      ? apiOrder.cancellationWindowMinutes
      : 5,
    canCancel: typeof apiOrder.canCancel === 'boolean'
      ? apiOrder.canCancel
      : (apiOrder.status || apiOrder.orderStatus) === 'PLACED',
    address: deliveryAddress,
    payment: apiOrder.paymentMethod || apiOrder.payment?.method || 'UPI',
    customer,
    student: customer,
    store: apiOrder.store
      ? {
          id: apiOrder.store.id,
          name: apiOrder.store.name,
          imageUrl: apiOrder.store.imageUrl
        }
      : undefined
  };
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isStudent = user?.role === 'student' && Boolean(user?.id);
  const shouldFetchOrders =
    (user?.role === 'student' || user?.role === 'vendor' || user?.role === 'delivery' || user?.role === 'admin') &&
    Boolean(user?.id);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshOrders = useCallback(async () => {
    if (shouldFetchOrders) {
      try {
        setIsLoading(true);
        const response = await api.getOrders();
        const rawOrders = Array.isArray(response?.data) ? response.data : [];
        const realOrders = rawOrders.map((item: any) => mapApiOrderToFrontendOrder(item, user?.id));
        setOrders(realOrders);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load backend orders:', err);
        const rawMsg = err?.message || 'Failed to fetch orders from server';
        // Sanitize error message to avoid leaking stack traces or sensitive internal details
        const safeMsg = rawMsg.length > 150 ? 'An error occurred while loading orders. Please check your connection and retry.' : rawMsg;
        setError(safeMsg);
        toast.error(safeMsg, { id: 'orders-load-error' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setOrders([]);
      setError(null);
      setIsLoading(false);
    }
  }, [shouldFetchOrders, user?.id]);

  // Load orders when authentication status changes
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Synchronize cross-tab order state changes by refetching from backend when authenticated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const changedKey = 'key' in e ? e.key : (e as CustomEvent).detail?.key;
      if (changedKey === STORAGE_KEY && shouldFetchOrders) {
        refreshOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('fastbell_state_change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('fastbell_state_change', handleStorageChange as EventListener);
    };
  }, [shouldFetchOrders, refreshOrders]);

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    const cached = orders.find(
      o => o.id === orderId || o.orderNumber === orderId
    );
    if (cached) return cached;

    if (shouldFetchOrders) {
      try {
        const response = await api.getOrder(orderId);
        if (response?.data) {
          const mapped = mapApiOrderToFrontendOrder(response.data, user?.id);
          setOrders(prev => [mapped, ...prev.filter(o => o.id !== mapped.id)]);
          return mapped;
        }
      } catch (err) {
        console.error('Failed to fetch order detail:', err);
      }
    }

    return null;
  };

  const createOrder = async (input: CreateOrderInput | Order): Promise<Order> => {
    if (!isStudent) {
      throw new Error('Please sign in with a student account to place an order.');
    }

    const payload: CreateOrderInput = 'deliveryAddressId' in input
      ? input
      : {
          deliveryAddressId: input.address?.id || '',
          paymentMethod: input.payment || 'UPI',
          deliveryFee: input.deliveryFee,
          discount: input.discount
        };

    if (!payload.deliveryAddressId) {
      throw new Error('A valid delivery address is required.');
    }

    const response = await api.createOrder({
      deliveryAddressId: payload.deliveryAddressId,
      paymentMethod: payload.paymentMethod || 'UPI',
      deliveryFee: payload.deliveryFee ?? 0,
      discount: payload.discount ?? 0
    });

    if (!response?.data) {
      throw new Error(response?.message || 'Server did not return order details.');
    }

    const realOrder = mapApiOrderToFrontendOrder(response.data, user?.id);
    setOrders(prev => [realOrder, ...prev.filter(o => o.id !== realOrder.id)]);
    toast.success('Order successfully placed!');
    return realOrder;
  };

  const applyStatusTransition = async (
    orderId: string,
    targetStatus: OrderStatus,
    partnerId?: string | null,
    successMessage?: string
  ) => {
    let order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      order = (await getOrderById(orderId)) || undefined;
    }
    if (!order) {
      toast.error('Order not found');
      return;
    }

    if (!canTransitionOrderStatus(order.status, targetStatus)) {
      toast.error(`Invalid transition from ${order.status} to ${targetStatus}`);
      return;
    }

    if (!user?.id) {
      toast.error('Authentication required to perform status update');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.updateOrderStatus(
        order.id,
        targetStatus,
        partnerId || undefined,
        order.status
      );

      if (response?.data) {
        const updated = mapApiOrderToFrontendOrder(response.data, user.id);
        setOrders(prev => {
          const index = prev.findIndex(o => o.id === updated.id || o.orderNumber === updated.orderNumber);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return [updated, ...prev];
        });
        if (successMessage) {
          toast.success(successMessage);
        }
        return updated;
      }

      throw new Error(response?.message || 'Server did not return updated order');
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      toast.error(err.message || 'Failed to update order status');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptOrder = (orderId: string) => {
    applyStatusTransition(orderId, 'ACCEPTED', undefined, 'Order accepted by vendor');
  };

  const markPreparing = (orderId: string) => {
    applyStatusTransition(orderId, 'PREPARING', undefined, 'Kitchen preparing order');
  };

  const markReady = (orderId: string) => {
    applyStatusTransition(orderId, 'READY_FOR_PICKUP', undefined, 'Order marked ready for pickup');
  };

  const acceptDelivery = async (orderId: string, deliveryPartnerId?: string) => {
    if (!user?.id) {
      toast.error('Authentication required to accept delivery');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.claimOrder(orderId);
      if (response?.data) {
        const updated = mapApiOrderToFrontendOrder(response.data, user.id);
        setOrders(prev => {
          const index = prev.findIndex(o => o.id === updated.id || o.orderNumber === updated.orderNumber);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updated;
            return next;
          }
          return [updated, ...prev];
        });
        toast.success('Delivery accepted! Head to vendor for pickup.');
        return updated;
      }
      throw new Error(response?.message || 'Server did not return claimed order');
    } catch (err: any) {
      console.error('Failed to claim order:', err);
      toast.error(err.message || 'Failed to claim order');
      await refreshOrders().catch(() => {});
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markPickedUp = (orderId: string) => {
    return applyStatusTransition(
      orderId,
      'PICKED_UP',
      user?.role === 'delivery' ? user.id : undefined,
      'Order picked up from vendor'
    );
  };

  const markOutForDelivery = (orderId: string) => {
    return applyStatusTransition(orderId, 'OUT_FOR_DELIVERY', undefined, 'Order is on the way!');
  };

  const markDelivered = (orderId: string) => {
    return applyStatusTransition(orderId, 'DELIVERED', undefined, 'Order successfully delivered!');
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    if (!user?.id) {
      toast.error('Authentication required to cancel order');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.cancelOrder(orderId, reason);
      if (response?.data) {
        const updated = mapApiOrderToFrontendOrder(response.data, user.id);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
        toast.success('Order cancelled successfully');
        return updated;
      }
      throw new Error(response?.message || 'Failed to cancel order');
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      toast.error(err.message || 'Failed to cancel order');
      await refreshOrders().catch(() => {});
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, partnerId?: string) => {
    applyStatusTransition(orderId, status, partnerId, `Status updated to ${status.replace(/_/g, ' ')}`);
  };

  const rateOrder = (orderId: string, rating: number, feedback?: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, rating, feedback } : o))
    );
    toast.success('Thank you for your rating!');
  };

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      error,
      refreshOrders,
      clearError,
      createOrder,
      getOrderById,
      acceptOrder,
      markPreparing,
      markReady,
      acceptDelivery,
      markPickedUp,
      markOutForDelivery,
      markDelivered,
      cancelOrder,
      updateOrderStatus,
      rateOrder
    }),
    [orders, isLoading, error, refreshOrders, clearError]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export const useOrder = () => {
  const value = useContext(OrderContext);
  if (!value) throw new Error('useOrder must be used within an OrderProvider');
  return value;
};
