import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, MapPin, Clock, Truck, ArrowRight, Box } from 'lucide-react';
import { Order } from '@/types';
import { useStore } from '@/context/StoreContext';

export default function OrderSuccess() {
  const { state } = useLocation();
  const { stores } = useStore();
  const order = (state as { order?: Order } | null)?.order;

  if (!order) return <div className="page-shell py-8 text-center"><p className="text-[var(--fb-ink)]/60">No recent order found.</p><Link to="/shop" className="btn-primary mt-4">Start shopping</Link></div>;

  const store = stores.find(s => s.id === order.storeId);
  const storeName = store?.name || 'Campus Store';

  return (
    <div className="page-shell py-4">
      <div className="mx-auto max-w-lg">
        <div className="card flex flex-col items-center p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--fb-blue-soft)] text-[var(--fb-blue)]"><CheckCircle className="h-9 w-9" /></div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[var(--fb-ink)]">Order placed!</h1>
          <p className="mt-1 text-[var(--fb-ink)]/60">Thank you. Your essentials are on the way.</p>
          <p className="mt-3 rounded-full bg-background-50 px-4 py-1.5 font-mono text-sm font-bold text-[var(--fb-blue)]">#{order.id}</p>
        </div>

        <div className="card mt-5 p-6">
          <h3 className="font-display font-bold text-[var(--fb-ink)]">Order details</h3>
          <div className="mt-4 space-y-3">
            {order.items.map(item => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-background-100 text-[var(--fb-ink)]">
                  <Box className="h-5 w-5" />
                </div>
                <div className="flex-1"><p className="text-sm font-semibold text-[var(--fb-ink)]">{item.name}</p><p className="text-xs text-[var(--fb-ink)]/50">Qty {item.quantity} × ₹{item.unitPrice}</p></div>
                <span className="text-sm font-semibold text-[var(--fb-ink)]">₹{item.subtotal || item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#ebe3da] pt-4 text-sm">
            <div className="flex justify-between font-bold"><span className="text-[var(--fb-ink)]">Total</span><span className="font-display text-lg text-[var(--fb-ink)]">₹{order.total}</span></div>
            <div className="flex items-start gap-2 text-[var(--fb-ink)]/60"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {order.address.line}, {order.address.landmark}</div>
            <div className="flex items-center gap-2 text-[var(--fb-ink)]/60"><Clock className="h-4 w-4" /> Est. delivery in 12–15 min</div>
            <div className="flex items-center gap-2 text-[var(--fb-ink)]/60"><Truck className="h-4 w-4" /> {storeName}</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link to={`/orders/${order.id}`} className="btn-primary flex-1">Track Order <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/orders" className="btn-quiet flex-1">View Orders</Link>
        </div>
      </div>
    </div>
  );
}

