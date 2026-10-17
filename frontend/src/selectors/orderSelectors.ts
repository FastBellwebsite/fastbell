import { Order } from '../types';

export const getOrdersForStudent = (orders: Order[], studentId: string | null): Order[] => {
  if (!studentId) return [];
  return orders.filter(o => o.studentId === studentId);
};

export const getOrdersForVendor = (orders: Order[], storeIdOrIds: string | string[] | null): Order[] => {
  if (!storeIdOrIds) return [];
  if (Array.isArray(storeIdOrIds)) {
    return orders.filter(o => storeIdOrIds.includes(o.storeId));
  }
  return orders.filter(o => o.storeId === storeIdOrIds);
};

export const getAvailableDeliveries = (orders: Order[], campusId: string | null): Order[] => {
  return orders.filter(o => {
    const campusMatch = !campusId || o.campusId === campusId;
    return campusMatch && o.status === 'READY_FOR_PICKUP' && !o.deliveryPartnerId;
  });
};

export const getActiveDeliveries = (orders: Order[], partnerId: string | null): Order[] => {
  if (!partnerId) return [];
  return orders.filter(o => 
    o.deliveryPartnerId === partnerId && 
    ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
  );
};

export const getCompletedDeliveries = (orders: Order[], partnerId: string | null): Order[] => {
  if (!partnerId) return [];
  return orders.filter(o => o.deliveryPartnerId === partnerId && o.status === 'DELIVERED');
};

export const getOrderById = (orders: Order[], orderId: string | undefined): Order | undefined => {
  if (!orderId) return undefined;
  return orders.find(o => o.id === orderId);
};
