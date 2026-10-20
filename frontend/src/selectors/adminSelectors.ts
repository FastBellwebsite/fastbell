import { Order, Store, Product, User } from '../types';
import { isProductAvailable, isProductOutOfStock } from './productSelectors';

export interface AdminMetrics {
  totalUsers: number;
  totalStudents: number;
  totalVendors: number;
  totalDeliveryPartners: number;
  totalStores: number;
  activeStores: number;
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  liveOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export const getAdminMetrics = (
  orders: Order[],
  stores: Store[],
  products: Product[],
  users: User[]
): AdminMetrics => {
  const students = users.filter(u => u.role === 'student');
  const vendors = users.filter(u => u.role === 'vendor');
  const delivery = users.filter(u => u.role === 'delivery');

  const openStores = stores.filter(s => s.isOpen);
  const availableProducts = products.filter(isProductAvailable);
  const outOfStockProducts = products.filter(isProductOutOfStock);

  const completed = orders.filter(o => o.status === 'DELIVERED');
  const cancelled = orders.filter(o => o.status === 'CANCELLED');
  const live = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));

  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalUsers: users.length,
    totalStudents: students.length,
    totalVendors: vendors.length,
    totalDeliveryPartners: delivery.length,
    totalStores: stores.length,
    activeStores: openStores.length,
    totalProducts: products.length,
    availableProducts: availableProducts.length,
    outOfStockProducts: outOfStockProducts.length,
    totalOrders: orders.length,
    liveOrders: live.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    totalRevenue
  };
};
