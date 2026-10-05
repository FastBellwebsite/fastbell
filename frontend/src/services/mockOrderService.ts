import { Order, OrderStatus } from '@/types';
import { storage } from './storage';

export const mockOrderService = {
  getAllOrders: (): Order[] => {
    return storage.getOrders();
  },

  getOrderById: (orderId: string): Order | undefined => {
    return storage.getOrders().find(o => o.id === orderId);
  },

  getOrdersByUser: (studentId: string): Order[] => {
    return storage.getOrders().filter(o => o.studentId === studentId);
  },

  getOrdersByVendor: (storeId: string): Order[] => {
    return storage.getOrders().filter(o => o.storeId === storeId);
  },

  getAvailableDeliveries: (campusId: string): Order[] => {
    return storage.getOrders().filter(o => 
      o.campusId === campusId && 
      o.status === 'READY_FOR_PICKUP' && 
      !o.deliveryPartnerId
    );
  },

  getOrdersByDeliveryPartner: (partnerId: string): Order[] => {
    return storage.getOrders().filter(o => o.deliveryPartnerId === partnerId);
  },

  createOrder: (order: Order): Order => {
    const orders = storage.getOrders();
    orders.unshift(order); // Newest on top
    storage.setOrders(orders);
    return order;
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, deliveryPartnerId?: string | null) => {
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (deliveryPartnerId !== undefined) {
        order.deliveryPartnerId = deliveryPartnerId;
      }
      storage.setOrders(orders);
    }
  },

  rateOrder: (orderId: string, rating: number, feedback?: string) => {
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.rating = rating;
      order.feedback = feedback;
      storage.setOrders(orders);
    }
  }
};
