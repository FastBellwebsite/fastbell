import { OrderStatus } from '@/types';

/**
 * FastBell Order Fulfillment State Machine:
 * 7 Statuses, 6 Forward Transitions:
 * 1. PLACED
 *    ↓ (Forward 1: Vendor accepts)
 * 2. ACCEPTED
 *    ↓ (Forward 2: Vendor begins preparation)
 * 3. PREPARING
 *    ↓ (Forward 3: Vendor marks ready)
 * 4. READY_FOR_PICKUP
 *    ↓ (Forward 4: Delivery Partner picks up from vendor)
 * 5. PICKED_UP
 *    ↓ (Forward 5: Delivery Partner departs out for delivery)
 * 6. OUT_FOR_DELIVERY
 *    ↓ (Forward 6: Delivery Partner completes handover)
 * 7. DELIVERED
 */
const transitionRules: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export const canTransitionOrderStatus = (current: OrderStatus, next: OrderStatus): boolean => {
  return transitionRules[current]?.includes(next) ?? false;
};

// Also export canTransitionOrder alias for backward compatibility
export const canTransitionOrder = canTransitionOrderStatus;
