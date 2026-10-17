import { Users, Package, IndianRupee, TrendingUp, Activity, ArrowRight, ScanLine } from 'lucide-react';
import { useOrder } from '@/context/OrderContext';
import { useStore } from '@/context/StoreContext';
import { storage } from '@/services/storage';
import { getAdminMetrics } from '@/selectors/adminSelectors';
import { StatusBadge } from '@/components/UI';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { orders } = useOrder();
  const { stores, products } = useStore();
  const users = storage.getUsers();

  const metrics = getAdminMetrics(orders, stores, products, users);

  return (
    <div className="w-full h-full bg-[var(--fb-surface)] text-[var(--fb-text-primary)] font-sans">
      {/* Dense Operational Header */}
      <div className="bg-[var(--fb-bg)] border-b border-[var(--fb-border)] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--fb-ink)] tracking-tight flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-[var(--fb-brand)]" /> Platform Command
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-[var(--fb-border)] pr-6">
            <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-0.5">
              Platform GMV
            </p>
            <p className="font-display text-lg font-black text-[var(--fb-ink)] flex items-center gap-1 leading-none text-[var(--fb-success)]">
              ₹{metrics.totalRevenue} <TrendingUp className="h-3 w-3" />
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-0.5">
                Users
              </p>
              <p className="font-display text-lg font-bold text-[var(--fb-ink)] leading-none">
                {metrics.totalUsers}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-0.5">
                Live Orders
              </p>
              <p className="font-display text-lg font-bold text-[var(--fb-ink)] leading-none text-[var(--fb-warning)]">
                {metrics.liveOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--fb-border)] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">
            Live Global Feed
          </h3>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[var(--fb-blue)] hover:text-[var(--fb-ink)] uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            All Logs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="w-full overflow-x-auto border border-[var(--fb-border)] bg-[var(--fb-surface)]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#fcfcfc] dark:bg-black/20 border-b border-[var(--fb-border)]">
              <tr>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Order ID</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Store</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Time</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">Value</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fb-border)]">
              {orders.slice(0, 15).map(o => {
                const store = stores.find(s => s.id === o.storeId);
                const storeName = store?.name || 'Unknown';

                return (
                  <tr key={o.id} className="hover:bg-[var(--fb-bg)] transition-colors">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs font-bold bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-ink)] px-1.5 py-0.5">
                        #{o.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-[var(--fb-ink)] truncate max-w-[200px]">
                      {storeName}
                    </td>
                    <td className="px-4 py-2 text-[10px] font-bold text-[var(--fb-text-secondary)]">
                      {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-[var(--fb-ink)]">
                      ₹{o.total}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="p-6 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--fb-text-muted)]">
              No live activity detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
