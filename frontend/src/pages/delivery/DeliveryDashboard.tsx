import { Link } from 'react-router-dom';
import {
  Bike,
  Package,
  CheckCircle,
  Navigation,
  ArrowRight,
  MapPin,
  PackageCheck
} from 'lucide-react';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import {
  getAvailableDeliveries,
  getActiveDeliveries,
  getCompletedDeliveries
} from '@/selectors/orderSelectors';
import { StatusBadge } from '@/components/UI';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { stores } = useStore();
  const {
    orders,
    acceptDelivery,
    markPickedUp,
    markOutForDelivery,
    markDelivered
  } = useOrder();

  const partnerId = user?.id;
  const campusId = user?.campusId || 'sns';

  const available = getAvailableDeliveries(orders, campusId);
  const active = partnerId ? getActiveDeliveries(orders, partnerId) : [];
  const completed = partnerId ? getCompletedDeliveries(orders, partnerId) : [];

  const earnings = completed.length * 35 + active.length * 20;

  return (
    <div className="w-full h-full bg-[var(--fb-bg)] font-sans">
      {/* Driver Header - Compact */}
      <div className="bg-[var(--fb-ink)] text-white px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <Bike className="h-5 w-5 text-[var(--fb-brand)]" />
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight leading-none">
              On Duty
            </h2>
            <p className="text-[11px] font-bold text-[var(--fb-brand)] uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--fb-brand)] animate-pulse" /> Live Dispatch
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-0.5">
            Shift Earnings
          </p>
          <p className="font-display text-xl font-black text-white leading-none">
            ₹{earnings}
          </p>
        </div>
      </div>

      {active.length > 0 ? (
        <div className="p-0 border-b border-[var(--fb-border)] bg-[var(--fb-surface)]">
          <div className="px-4 py-2 bg-[var(--fb-surface-elevated)] border-b border-[var(--fb-border)] flex items-center gap-2">
            <Navigation className="h-3 w-3 text-[var(--fb-ink)]" />
            <h3 className="font-bold text-[var(--fb-ink)] uppercase tracking-wider text-xs">
              Active Assignment ({active.length})
            </h3>
          </div>
          
          <div className="flex flex-col divide-y divide-[var(--fb-border)]">
            {active.map(o => {
              const store = stores.find(s => s.id === o.storeId);
              const storeName = store?.name || 'Campus Vendor';

              return (
                <div key={o.id} className="p-4 sm:p-6 bg-[var(--fb-surface)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block font-mono text-xs font-bold bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-ink)] px-2 py-0.5 mb-2">
                        #{o.id.slice(0, 8)}
                      </span>
                      <h4 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] leading-tight max-w-[250px]">
                        {o.address.line}
                      </h4>
                      <p className="text-xs font-medium text-[var(--fb-text-secondary)]">{o.address.landmark}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="flex items-center gap-3 bg-[var(--fb-bg)] border border-[var(--fb-border)] p-3 mb-6">
                    <div className="h-8 w-8 bg-[var(--fb-surface)] border border-[var(--fb-border)] flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-[var(--fb-text-muted)]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-0.5">Pick up from</p>
                      <p className="text-xs font-bold text-[var(--fb-ink)]">{storeName}</p>
                      <p className="text-xs font-normal text-[var(--fb-text-secondary)]">{store?.locationLabel}</p>
                    </div>
                  </div>

                  {/* Discrete Multi-step Delivery Transitions - Dense */}
                  <div className="space-y-2">
                    {o.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => markPickedUp(o.id)}
                        className="w-full bg-[var(--fb-ink)] text-[var(--fb-surface)] py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors flex items-center justify-between cursor-pointer border border-black"
                      >
                        <span>Confirm Picked Up</span>
                        <PackageCheck className="h-4 w-4" />
                      </button>
                    )}

                    {o.status === 'PICKED_UP' && (
                      <button
                        onClick={() => markOutForDelivery(o.id)}
                        className="w-full bg-[var(--fb-blue)] text-white py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>Start Delivery</span>
                        <Navigation className="h-4 w-4 animate-pulse" />
                      </button>
                    )}

                    {o.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => markDelivered(o.id)}
                        className="w-full bg-[var(--fb-success)] text-white py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>Mark Delivered</span>
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}

                    <div className="pt-2 text-center">
                      <Link
                        to={`/delivery/orders/${o.id}`}
                        className="text-xs font-bold text-[var(--fb-blue)] hover:text-[var(--fb-ink)] uppercase tracking-wider transition-colors"
                      >
                        View Order Receipt
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-0 border-t-4 border-[var(--fb-bg)] bg-[var(--fb-surface)]">
          <div className="px-4 py-2 bg-[var(--fb-surface-elevated)] border-b border-[var(--fb-border)] flex items-center gap-2">
            <Package className="h-3 w-3 text-[var(--fb-ink)]" />
            <h3 className="font-bold text-[var(--fb-ink)] uppercase tracking-wider text-xs">
              Live Queue ({available.length})
            </h3>
          </div>

          <div className="flex flex-col divide-y divide-[var(--fb-border)]">
            {available.length === 0 ? (
              <div className="p-6 bg-[var(--fb-surface)]">
                <div className="py-6 text-center flex flex-col items-center justify-center border border-dashed border-[var(--fb-border)] bg-[var(--fb-bg)] mb-6">
                  <div className="h-12 w-12 rounded-full bg-[var(--fb-surface)] border border-[var(--fb-border)] flex items-center justify-center mb-3">
                    <Bike className="h-5 w-5 text-[var(--fb-brand)] animate-bounce" />
                  </div>
                  <p className="font-display text-base font-bold text-[var(--fb-ink)] tracking-tight">
                    Queue is clear • You're on standby
                  </p>
                  <p className="text-xs text-[var(--fb-text-muted)] mt-1 max-w-sm">
                    Waiting for kitchen dispatch & merchant pickups. New orders will appear here automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-[var(--fb-border)] bg-[var(--fb-surface)]">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] mb-3 flex items-center justify-between">
                      <span>Campus Delivery Zones</span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">All Routes Clear</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[var(--fb-text-secondary)]">
                      <li className="flex items-center justify-between border-b border-[var(--fb-border)] pb-1.5">
                        <span>Hostel Blocks 1–6 (Boys Quad)</span>
                        <span className="font-mono text-[10px] font-bold text-[var(--fb-text-muted)]">~8-10 min</span>
                      </li>
                      <li className="flex items-center justify-between border-b border-[var(--fb-border)] pb-1.5">
                        <span>Hostel Blocks 7–12 (Girls Quad)</span>
                        <span className="font-mono text-[10px] font-bold text-[var(--fb-text-muted)]">~10-12 min</span>
                      </li>
                      <li className="flex items-center justify-between border-b border-[var(--fb-border)] pb-1.5">
                        <span>Main Academic & Tech Towers</span>
                        <span className="font-mono text-[10px] font-bold text-[var(--fb-text-muted)]">~6 min</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Sports Complex & Library Lawns</span>
                        <span className="font-mono text-[10px] font-bold text-[var(--fb-text-muted)]">~12 min</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border border-[var(--fb-border)] bg-[var(--fb-surface)]">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] mb-3">
                      Runner Protocol
                    </h4>
                    <ul className="space-y-2 text-xs text-[var(--fb-text-secondary)]">
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--fb-brand)] font-bold">1.</span>
                        <span>Verify 4-digit order number at canteen counter before pickup</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--fb-brand)] font-bold">2.</span>
                        <span>Keep insulated thermal bag secured on cycle/foot transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--fb-brand)] font-bold">3.</span>
                        <span>Deliver directly to hostel reception or room doorstep</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--fb-brand)] font-bold">4.</span>
                        <span>₹35 credited instantly to your runner UPI wallet per drop</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {available.map(o => {
              const store = stores.find(s => s.id === o.storeId);
              const storeName = store?.name || 'Campus Vendor';

              return (
                <div
                  key={o.id}
                  className="p-4 hover:bg-[var(--fb-bg)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold border border-[var(--fb-border)] text-[var(--fb-text-muted)] px-1.5 py-0.5">
                        #{o.id.slice(0, 8)}
                      </span>
                      <h4 className="font-bold text-[var(--fb-ink)] text-sm">
                        {storeName}
                      </h4>
                    </div>
                    <p className="text-xs font-bold text-[var(--fb-ink)] max-w-sm truncate">
                      To: {o.address.line} <span className="text-[var(--fb-text-secondary)] font-medium">({o.address.landmark})</span>
                    </p>
                    <p className="text-xs font-medium text-[var(--fb-text-muted)] mt-1">
                      ₹{o.total} • {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <button
                    onClick={() => partnerId && acceptDelivery(o.id, partnerId)}
                    className="shrink-0 bg-[var(--fb-surface)] border border-[var(--fb-border)] hover:border-[var(--fb-ink)] text-[var(--fb-ink)] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Accept <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
