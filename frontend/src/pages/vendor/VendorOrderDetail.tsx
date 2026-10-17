import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/context/OrderContext';
import { StatusBadge, EmptyState } from '@/components/UI';
import { ArrowRight, Clock, Check, Box, ChevronLeft, MapPin, Receipt } from 'lucide-react';

export default function VendorOrderDetail() {
  const { orderId } = useParams();
  const { orders, acceptOrder, markPreparing, markReady } = useOrder();
  const order = orders.find(o => o.id === orderId);

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
          {order.items.map((item, idx) => (
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
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-[#E8F5E9] hover:bg-[#E8F5E9] text-white shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" /> Accept Order in Kitchen
            </button>
          )}

          {order.status === 'ACCEPTED' && (
            <button
              onClick={() => markPreparing(order.id)}
              className="w-full py-3.5 rounded-2xl font-bold text-xs bg-black hover:bg-black/80 text-white shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            <div className="p-3.5 text-center rounded-2xl bg-[var(--fb-warning)] text-[var(--fb-warning)] font-bold text-xs border border-[var(--fb-warning)]">
              Food is packed and ready! Waiting for campus rider pickup.
            </div>
          )}

          {order.status === 'PICKED_UP' && (
            <div className="p-3.5 text-center rounded-2xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Picked up by delivery partner.
            </div>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <div className="p-3.5 text-center rounded-2xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] font-bold text-xs border border-[var(--fb-blue)]">
              Rider is currently delivering to {order.address.line}.
            </div>
          )}

          {order.status === 'DELIVERED' && (
            <div className="p-3.5 text-center rounded-2xl bg-[#E8F5E9] text-[var(--fb-success)] font-bold text-xs border border-[var(--fb-success)]">
              Order successfully completed and delivered!
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="p-3.5 text-center rounded-2xl bg-[#FFEBEE] text-[var(--fb-danger)] font-bold text-xs border border-[var(--fb-danger)]">
              Order was cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
