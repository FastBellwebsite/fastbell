export const DELIVERY_FEE = 15;
export const DISCOUNT_THRESHOLD = 200;
export const DISCOUNT_AMOUNT = 30;
export const COUPON_CODE = 'STUDENT30';

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export function calcOrderTotals(subtotal: number): OrderTotals {
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const discount = subtotal > DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
  const total = subtotal + deliveryFee - discount;
  return { subtotal, deliveryFee, discount, total };
}
