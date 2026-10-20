import { Order, OrderItem } from '@/types';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { StatusBadge, EmptyState } from '@/components/UI';
import { ArrowRight, Clock, Check, Box, ChevronLeft, MapPin, Receipt } from 'lucide-react';

export default function VendorOrderDetail() {
  const { orderId } = useParams();
  const { orders, acceptOrder, markPreparing, markReady, isLoading, getOrderById } = useOrder();
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const order = orders.find(o => o.id === orderId || o.orderNumber === orderId) || fetchedOrder;

  useEffect(() => {
    if (!order && orderId && !isFetching && getOrderById) {
      setIsFetching(true);
      getOrderById(orderId)
        .then(res => {
          if (res) setFetchedOrder(res);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [order, orderId, isFetching, getOrderById]);

  if (!order) {
    return (
      <div className="py-8 max-w-lg mx-auto px-4 text-center">
        <EmptyState
          icon={<Clock className="h-8 w-8 text-[var(--fb-brand)]" />}
          title="Order not found"
          message="This order may have been archived or does not exist."
          action={
            <Link to="/vendor/orders" className="btn-primary">
              Back to orders
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/vendor/orders"
        className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[var(--fb-text-secondary)] hover:text-[var(--fb-brand)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to Kitchen Orders
      </Link>

      <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--fb-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--fb-brand)]/10 text-[var(--fb-brand)] flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <span className="font-mono text-sm font-extrabold text-[var(--fb-text-primary)]">
                #{order.id}
              </span>
              <p className="text-[11px] font-medium text-[var(--fb-text-muted)]">
                Placed {new Date(order.date).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Ordered Items */}
        <div className="mt-6 space-y-3">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)]">
            Kitchen Preparation Items
          </h4>
          {order.items.map((item: OrderItem, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--fb-background)] border border-[var(--fb-border)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--fb-surface)] border border-[var(--fb-border)] flex items-center justify-center text-[var(--fb-brand)] font-bold text-xs">
                  ×{item.quantity}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--fb-text-primary)]">{item.name}</p>
                  <p className="text-[11px] text-[var(--fb-text-muted)]">₹{item.unitPrice} each</p>
                </div>
              </div>
              <span className="text-xs font-black text-[var(--fb-text-primary)]">
                ₹{item.subtotal || item.unitPrice * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 flex justify-between items-center border-t border-[var(--fb-border)] pt-4">
          <span className="text-xs font-bold text-[var(--fb-text-secondary)]">Total Order Value</span>
          <span className="font-display text-2xl font-black text-[var(--fb-text-primary)]">
            ₹{order.total}
          </span>
        </div>

        {/* Deliver to spot */}
        <div className="mt-5 p-4 rounded-2xl bg-[var(--fb-background)] border border-[var(--fb-border)]">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] mb-1">
            <MapPin size={12} className="text-[var(--fb-brand)]" />
            <span>Campus Delivery Drop</span>
          </div>
          <p className="text-xs font-bold text-[var(--fb-text-primary)]">{order.address.line}</p>
          {order.address.landmark && (
            <p className="text-[11px] text-[var(--fb-text-muted)] mt-0.5">{order.address.landmark}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-[var(--fb-border)]">
          {order.status === 'PLACED' && (
            <button
              onClick={() => acceptOrder(order.id)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-[var(--fb-success)] hover:brightness-110 text-white shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" /> Accept Order in Kitchen
            </button>
          )}

          {order.status === 'ACCEPTED' && (
            <button
              onClick={() => markPreparing(order.id)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" /> Start Preparing Items
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              onClick={() => markReady(order.id)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)] text-white shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" /> Mark Ready for Rider Pickup
            </button>
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <div className="p-3.5 text-center rounded-2xl bg-[#FFF8E1] dark:bg-amber-950/40 text-[var(--fb-warning)] dark:text-amber-400 font-bold text-xs border border-[var(--fb-warning)]/30">
              Food is packed and ready! Waiting for campus rider pickup.
            </div>
          )}

          {order.status === 'PICKED_UP' && (
            <div className="p-3.5 text-center rounded-2xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] font-bold text-xs border border-[var(--fb-blue)]/30">
              Picked up by delivery partner.
            </div>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <div className="p-3.5 text-center rounded-2xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] font-bold text-xs border border-[var(--fb-blue)]">
              Rider is currently delivering to {order.address.line}.
            </div>
          )}

          {order.status === 'DELIVERED' && (
            <div className="p-3.5 text-center rounded-2xl bg-[#E8F5E9] dark:bg-emerald-950/40 text-[var(--fb-success)] dark:text-emerald-400 font-bold text-xs border border-[var(--fb-success)]/30">
              Order successfully completed and delivered!
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="p-3.5 text-center rounded-2xl bg-[#FFEBEE] dark:bg-rose-950/40 text-[var(--fb-danger)] dark:text-rose-400 font-bold text-xs border border-[var(--fb-danger)]/30">
              Order was cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
