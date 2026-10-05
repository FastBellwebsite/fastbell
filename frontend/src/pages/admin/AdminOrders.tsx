import { useOrder } from '@/context/OrderContext';
import { useStore } from '@/context/StoreContext';
import { StatusBadge } from '@/components/UI';
import { Package, Clock, ShieldCheck } from 'lucide-react';

export default function AdminOrders() {
  const { orders } = useOrder();
  const { stores } = useStore();

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 pb-8 pt-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--fb-brand)]/10 text-[var(--fb-brand)]">
            <ShieldCheck size={12} /> Global Campus Audit
          </span>
          <span className="text-xs font-semibold text-[var(--fb-text-muted)]">• SNS College of Technology</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[var(--fb-text-primary)]">
          Platform Orders ({orders.length})
        </h1>
        <p className="text-xs font-semibold text-[var(--fb-text-secondary)] mt-1">
          Complete cross-campus transaction logs, store fulfillments, and order statuses.
        </p>
      </div>

      <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--fb-background)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] border-b border-[var(--fb-border)]">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Vendor Store</th>
                <th className="px-6 py-3.5">Items Summary</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Total Value</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fb-border)]">
              {orders.map(o => {
                const store = stores.find(s => s.id === o.storeId);
                const storeName = store?.name || 'Campus Store';

                return (
                  <tr key={o.id} className="hover:bg-[var(--fb-background)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-black bg-[var(--fb-background)] border border-[var(--fb-border)] px-2 py-0.5 rounded text-[var(--fb-text-primary)]">
                        #{o.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs text-[var(--fb-text-primary)]">{storeName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-[var(--fb-text-secondary)] max-w-xs truncate">
                      {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[var(--fb-text-muted)]">
                      {new Date(o.date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-display font-extrabold text-sm text-[var(--fb-text-primary)]">
                      ₹{o.total}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="p-6 text-center">
            <Package className="h-8 w-8 text-[var(--fb-text-muted)] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[var(--fb-text-muted)]">No platform orders placed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
