import { Link } from 'react-router-dom';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PageHeader, EmptyState, StatusBadge } from '@/components/UI';
import { Package } from 'lucide-react';

export default function DeliveryOrders() {
  const { user } = useAuth();
  const { orders } = useOrder();
  const { stores } = useStore();
  const partnerId = user?.id;

  const list = partnerId ? orders.filter(o => o.deliveryPartnerId === partnerId) : [];

  return (
    <div>
      <PageHeader title="Delivery Orders" subtitle="Pickups and deliveries assigned to you." />
      {list.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="No deliveries"
          message="Accepted pickups and completed deliveries will show up here."
        />
      ) : (
        <div className="space-y-4">
          {list.map(o => {
            const store = stores.find(s => s.id === o.storeId);
            const storeName = store?.name || 'Campus Store';

            return (
              <Link
                key={o.id}
                to={`/delivery/orders/${o.id}`}
                className="card flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div>
                  <span className="font-mono text-sm font-bold text-[var(--fb-blue)] bg-[var(--fb-blue-soft)] px-2 py-0.5 rounded border border-[var(--fb-blue)]">
                    #{o.id.slice(0, 8)}
                  </span>
                  <p className="mt-1 text-sm font-medium text-[var(--fb-ink)]/70">
                    <strong className="text-[var(--fb-ink)]">{storeName}</strong> • {o.items.length} items • ₹{o.total}
                  </p>
                  <p className="text-xs text-[var(--fb-ink)]/50 mt-0.5">{o.address.line}</p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
