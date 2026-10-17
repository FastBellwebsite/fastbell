import { Link } from 'react-router-dom';
import { Package, Clock, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { getOrdersForVendor } from '@/selectors/orderSelectors';
import { StatusBadge } from '@/components/UI';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { products, stores } = useStore();
  const { orders } = useOrder();

  const userStoreId = (user as any)?.storeId;
  const vendorStores = stores.filter(
    s => s.vendorId === user?.id || (userStoreId && s.id === userStoreId)
  );
  const vendorStoreIds = vendorStores.map(s => s.id);
  const effectiveStoreIds = vendorStoreIds.length > 0 ? vendorStoreIds : (userStoreId ? [userStoreId] : []);

  const vendorOrders = getOrdersForVendor(orders, effectiveStoreIds);
  const vendorProducts = products.filter(p => effectiveStoreIds.includes(p.storeId));

  const today = vendorOrders.length;
  const pending = vendorOrders.filter(o =>
    ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)
  ).length;
  const revenue = vendorOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="w-full h-full bg-[var(--fb-surface)] text-[var(--fb-text-primary)] font-sans">
      {/* Dense Operational Header */}
      <div className="bg-[var(--fb-bg)] border-b border-[var(--fb-border)] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--fb-ink)] tracking-tight">
            Vendor Operations
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--fb-text-secondary)] mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[var(--fb-brand)]" /> {today} TODAY
            </span>
            <span className="text-[var(--fb-border)]">|</span>
            <span className="flex items-center gap-1 text-[var(--fb-warning)]">
              <Package className="h-3 w-3" /> {pending} ACTION NEEDED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right border-r border-[var(--fb-border)] pr-4">
            <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider">
              GMV (Today)
            </p>
            <p className="font-display text-lg font-black text-[var(--fb-ink)] flex items-center gap-1 justify-end">
              ₹{revenue}
              <TrendingUp className="h-3 w-3 text-[var(--fb-success)]" />
            </p>
          </div>
          <Link
            to="/vendor/products/new"
            className="btn-action-primary"
          >
            <Plus className="h-3 w-3" /> New Item
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Operations Queue - Tabular Flat Design */}
        <div className="flex-1 border-r border-[var(--fb-border)] min-h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--fb-bg)] border-b border-[var(--fb-border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">
              Active Queue
            </h3>
            <Link
              to="/vendor/orders"
              className="text-xs font-bold uppercase tracking-wider text-[var(--fb-blue)] hover:text-[var(--fb-ink)] flex items-center gap-1 transition-colors"
            >
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#fcfcfc] dark:bg-black/20 border-b border-[var(--fb-border)]">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Order</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Time</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Summary</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] text-right">Value</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fb-border)]">
                {vendorOrders.slice(0, 8).map(o => (
                  <tr key={o.id} className="hover:bg-[var(--fb-bg)] transition-colors">
                    <td className="px-4 py-2 font-mono text-xs font-bold text-[var(--fb-ink)]">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2 text-[10px] font-bold text-[var(--fb-text-secondary)]">
                      {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-xs font-bold text-[var(--fb-ink)] truncate max-w-[180px]">
                        {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-[var(--fb-ink)] text-right">
                      ₹{o.total}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/vendor/orders/${o.id}`}
                        className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[var(--fb-surface)] border border-[var(--fb-border)] hover:border-[var(--fb-ink)] text-[var(--fb-ink)] px-2.5 py-1 rounded-sm transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vendorOrders.length === 0 && (
              <div className="py-4 text-center text-xs font-medium text-[var(--fb-text-muted)]">
                Queue is empty.
              </div>
            )}
          </div>
        </div>

        {/* Inventory - High Density List */}
        <div className="w-full lg:w-[320px] xl:w-[380px] bg-[var(--fb-surface)] shrink-0 flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--fb-bg)] border-b border-[var(--fb-border)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-ink)]">
              Inventory Feed
            </h3>
            <Link
              to="/vendor/products"
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-blue)] hover:text-[var(--fb-ink)] transition-colors"
            >
              Catalog
            </Link>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex px-4 py-2.5 border-b border-[var(--fb-border)] bg-[#fcfcfc] dark:bg-black/20">
              <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                Item
              </span>
              <span className="w-14 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                State
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[var(--fb-border)]">
              {vendorProducts.slice(0, 10).map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[var(--fb-bg)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <div className="h-6 w-6 shrink-0 overflow-hidden bg-[var(--fb-bg)] flex items-center justify-center p-0.5 border border-[var(--fb-border)]">
                      <img src={p.image} alt={p.name} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[var(--fb-ink)] truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] font-bold text-[var(--fb-text-secondary)]">
                        ₹{p.price}
                      </p>
                    </div>
                  </div>

                  {p.isAvailable ? (
                    <span className="px-2 py-0.5 bg-[var(--fb-success)]/10 text-[var(--fb-success)] text-[10px] font-bold uppercase tracking-wider border border-[var(--fb-success)]/30 rounded-sm w-10 text-center shrink-0">
                      ON
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[var(--fb-text-muted)]/10 text-[var(--fb-text-muted)] text-[10px] font-bold uppercase tracking-wider border border-[var(--fb-text-muted)]/30 rounded-sm w-10 text-center shrink-0">
                      OFF
                    </span>
                  )}
                </div>
              ))}

              {vendorProducts.length === 0 && (
                <div className="py-6 text-center text-[10px] text-[var(--fb-text-muted)]">
                  No items listed.
                </div>
              )}
            </div>

            <Link
              to="/vendor/products"
              className="mt-auto block w-full text-center py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] hover:bg-[var(--fb-bg)] hover:text-[var(--fb-ink)] transition-colors border-t border-[var(--fb-border)]"
            >
              Manage {vendorProducts.length} Items
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
