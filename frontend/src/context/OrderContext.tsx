import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Order, OrderStatus } from '@/types';
import { mockOrderService } from '@/services/mockOrderService';
import { canTransitionOrderStatus } from '@/utils/orderFlow';
import { STORAGE_KEY } from '@/services/storage';
import toast from 'react-hot-toast';

type OrderContextValue = {
  orders: Order[];
  refreshOrders: () => void;
  createOrder: (order: Order) => void;
  acceptOrder: (orderId: string) => void;
  markPreparing: (orderId: string) => void;
  markReady: (orderId: string) => void;
  acceptDelivery: (orderId: string, deliveryPartnerId: string) => void;
  markPickedUp: (orderId: string) => void;
  markOutForDelivery: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, partnerId?: string) => void;
  rateOrder: (orderId: string, rating: number, feedback?: string) => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => mockOrderService.getAllOrders());

  const refreshOrders = () => {
    setOrders(mockOrderService.getAllOrders());
  };

  // Cross-tab and local storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const changedKey = 'key' in e ? e.key : (e as CustomEvent).detail?.key;
      if (changedKey === STORAGE_KEY) {
        refreshOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('fastbell_state_change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('fastbell_state_change', handleStorageChange as EventListener);
    };
  }, []);

  const createOrder = (order: Order) => {
    mockOrderService.createOrder(order);
    refreshOrders();
    toast.success('Order successfully placed!');
  };

  const applyStatusTransition = (
    orderId: string,
    targetStatus: OrderStatus,
    partnerId?: string | null,
    successMessage?: string
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }

    if (!canTransitionOrderStatus(order.status, targetStatus)) {
      toast.error(`Invalid transition from ${order.status} to ${targetStatus}`);
      return;
    }

    mockOrderService.updateOrderStatus(orderId, targetStatus, partnerId);
    refreshOrders();
    if (successMessage) {
      toast.success(successMessage);
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

  const acceptDelivery = (orderId: string, deliveryPartnerId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    mockOrderService.updateOrderStatus(orderId, order.status, deliveryPartnerId);
    refreshOrders();
    toast.success('Delivery accepted! Head to vendor for pickup.');
  };

  const markPickedUp = (orderId: string) => {
    applyStatusTransition(orderId, 'PICKED_UP', undefined, 'Order picked up from vendor');
  };

  const markOutForDelivery = (orderId: string) => {
    applyStatusTransition(orderId, 'OUT_FOR_DELIVERY', undefined, 'Order is on the way!');
  };

  const markDelivered = (orderId: string) => {
    applyStatusTransition(orderId, 'DELIVERED', undefined, 'Order successfully delivered!');
  };

  const cancelOrder = (orderId: string) => {
    applyStatusTransition(orderId, 'CANCELLED', undefined, 'Order cancelled');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, partnerId?: string) => {
    applyStatusTransition(orderId, status, partnerId, `Status updated to ${status.replace(/_/g, ' ')}`);
  };

  const rateOrder = (orderId: string, rating: number, feedback?: string) => {
    mockOrderService.rateOrder(orderId, rating, feedback);
    refreshOrders();
    toast.success('Thank you for your rating!');
  };

  const value = useMemo(
    () => ({
      orders,
      refreshOrders,
      createOrder,
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
    [orders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export const useOrder = () => {
  const value = useContext(OrderContext);
  if (!value) throw new Error('useOrder must be used within an OrderProvider');
  return value;
};
