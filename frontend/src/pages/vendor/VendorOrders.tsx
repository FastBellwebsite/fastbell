import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { getOrdersForVendor } from '@/selectors/orderSelectors';
import { StatusBadge } from '@/components/UI';
import { Package, ArrowRight, Check, Box, Clock, ChevronRight, MapPin, ChefHat, Sparkles } from 'lucide-react';
import { Store, OrderStatus } from '@/types';

export default function VendorOrders() {
  const { user } = useAuth();
  const { stores } = useStore();
  const { orders, acceptOrder, markPreparing, markReady } = useOrder();
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>('ALL');

  const userStoreId = (user as any)?.storeId;
  const vendorStores = stores.filter(
    (s: Store) => s.vendorId === user?.id || (userStoreId && s.id === userStoreId)
  );
  const vendorStoreIds = vendorStores.map((s: Store) => s.id);
  const effectiveStoreIds = vendorStoreIds.length > 0 ? vendorStoreIds : (userStoreId ? [userStoreId] : []);

  const vendorOrders = getOrdersForVendor(orders, effectiveStoreIds);

  const newOrdersCount = vendorOrders.filter(o => o.status === 'PLACED').length;
  const preparingOrdersCount = vendorOrders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const readyOrdersCount = vendorOrders.filter(o => o.status === 'READY_FOR_PICKUP').length;
  const completedOrdersCount = vendorOrders.filter(o => ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)).length;

  const filteredOrders = vendorOrders.filter(o => {
    if (selectedStatusTab === 'ALL') return true;
    if (selectedStatusTab === 'NEW') return o.status === 'PLACED';
    if (selectedStatusTab === 'PREPARING') return ['ACCEPTED', 'PREPARING'].includes(o.status);
    if (selectedStatusTab === 'READY') return o.status === 'READY_FOR_PICKUP';
    if (selectedStatusTab === 'COMPLETED') return ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(o.status);
    return true;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 pb-8 pt-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--fb-brand)]/10 text-[var(--fb-brand)]">
              <ChefHat size={12} /> Kitchen & Store Operations
            </span>
            <span className="text-xs font-semibold text-[var(--fb-text-muted)]">• SNS Campus Merchant</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[var(--fb-text-primary)]">
            Incoming Orders
          </h1>
          <p className="text-xs font-semibold text-[var(--fb-text-secondary)] mt-1">
            Real-time fulfillment queue. Accept, prepare, and release orders for campus delivery partners.
          </p>
        </div>

        {newOrdersCount > 0 && (
          <div className="flex items-center gap-2 bg-[var(--fb-warning)] border border-[var(--fb-warning)] text-[var(--fb-warning)] px-4 py-2 rounded-xl text-xs font-bold animate-pulse">
            <Sparkles size={14} className="text-[var(--fb-warning)]" />
            <span>{newOrdersCount} new {newOrdersCount === 1 ? 'order needs' : 'orders need'} your immediate acceptance!</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-[var(--fb-border)]">
        {[
          { id: 'ALL', label: 'All Orders', count: vendorOrders.length },
          { id: 'NEW', label: 'New / Placed', count: newOrdersCount, highlight: newOrdersCount > 0 },
          { id: 'PREPARING', label: 'In Preparation', count: preparingOrdersCount },
          { id: 'READY', label: 'Ready for Pickup', count: readyOrdersCount },
          { id: 'COMPLETED', label: 'Dispatched / Done', count: completedOrdersCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatusTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedStatusTab === tab.id
                ? 'bg-[var(--fb-brand)] text-white shadow-soft'
                : 'bg-[var(--fb-surface)] border border-[var(--fb-border)] text-[var(--fb-text-secondary)] hover:text-[var(--fb-text-primary)] hover:bg-[var(--fb-background)]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                selectedStatusTab === tab.id
                  ? 'bg-black/20 text-white'
                  : tab.highlight
                  ? 'bg-[var(--fb-warning)] text-[var(--fb-warning)]'
                  : 'bg-[var(--fb-background)] text-[var(--fb-text-muted)]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-[var(--fb-surface)] border border-[var(--fb-border)] border-dashed rounded-3xl shadow-xs">
          <div className="h-16 w-16 place-items-center rounded-2xl bg-[var(--fb-background)] text-[var(--fb-text-muted)] flex items-center justify-center mb-4 border border-[var(--fb-border)]">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-[var(--fb-text-primary)]">No orders in this stage</h3>
          <p className="text-xs font-semibold text-[var(--fb-text-muted)] max-w-sm mt-1">
            Orders matching this filter will stream here automatically as students place them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(o => (
            <div
              key={o.id}
              className="bg-[var(--fb-surface)] border border-[var(--fb-border)] hover:border-[var(--fb-brand)]/40 rounded-2xl p-5 shadow-soft transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Order Information & Items */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Link
                      to={`/vendor/orders/${o.id}`}
                      className="font-mono text-xs font-black bg-[var(--fb-background)] border border-[var(--fb-border)] px-2.5 py-1 rounded-lg text-[var(--fb-text-primary)] hover:border-[var(--fb-brand)] transition-colors"
                    >
                      #{o.id.slice(0, 8)}
                    </Link>

                    <span className="text-xs font-bold text-[var(--fb-text-muted)] flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(o.date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    <span className="text-xs font-semibold text-[var(--fb-text-muted)]">•</span>

                    <span className="font-display font-extrabold text-base text-[var(--fb-text-primary)]">
                      ₹{o.total}
                    </span>

                    <div className="ml-auto lg:ml-0">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fb-text-secondary)] mb-3 bg-[var(--fb-background)] px-3 py-1.5 rounded-xl border border-[var(--fb-border)] w-fit">
                    <MapPin size={13} className="text-[var(--fb-brand)]" />
                    <span>Deliver to:</span>
                    <span className="text-[var(--fb-text-primary)]">{o.address.line}</span>
                    {o.address.landmark && (
                      <span className="text-[var(--fb-text-muted)]">({o.address.landmark})</span>
                    )}
                  </div>

                  {/* Item Chips */}
                  <div className="flex flex-wrap gap-2">
                    {o.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--fb-background)] border border-[var(--fb-border)] px-3 py-1.5 text-xs font-bold text-[var(--fb-text-primary)] shadow-xs"
                      >
                        <Box className="h-3.5 w-3.5 text-[var(--fb-text-muted)]" />
                        <span>{item.name}</span>
                        <span className="text-[var(--fb-brand)] font-black">×{item.quantity}</span>
                        <span className="text-[var(--fb-text-muted)] font-normal ml-0.5">(₹{item.unitPrice})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="lg:border-l lg:border-[var(--fb-border)] lg:pl-6 shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 justify-center">
                  {o.status === 'PLACED' && (
                    <button
                      onClick={() => acceptOrder(o.id)}
                      className="h-11 px-5 rounded-xl font-bold text-xs bg-[var(--fb-success)] hover:brightness-110 text-white shadow-soft flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Accept Order
                    </button>
                  )}

                  {o.status === 'ACCEPTED' && (
                    <button
                      onClick={() => markPreparing(o.id)}
                      className="h-11 px-5 rounded-xl font-bold text-xs bg-black hover:bg-black/80 text-white shadow-soft flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" /> Start Preparing
                    </button>
                  )}

                  {o.status === 'PREPARING' && (
                    <button
                      onClick={() => markReady(o.id)}
                      className="h-11 px-5 rounded-xl font-bold text-xs bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)] text-white shadow-soft flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Ready for Pickup
                    </button>
                  )}

                  {o.status === 'READY_FOR_PICKUP' && (
                    <div className="h-11 px-4 rounded-xl bg-[var(--fb-warning)] text-[var(--fb-warning)] border border-[var(--fb-warning)] font-bold text-xs flex items-center justify-center text-center">
                      Waiting for Rider Pickup
                    </div>
                  )}

                  {o.status === 'PICKED_UP' && (
                    <div className="h-11 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center text-center">
                      Picked Up by Partner
                    </div>
                  )}

                  {o.status === 'OUT_FOR_DELIVERY' && (
                    <div className="h-11 px-4 rounded-xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)] font-bold text-xs flex items-center justify-center text-center">
                      Out for Campus Delivery
                    </div>
                  )}

                  {o.status === 'DELIVERED' && (
                    <div className="h-11 px-4 rounded-xl bg-[#E8F5E9] text-[var(--fb-success)] border border-[var(--fb-success)] font-bold text-xs flex items-center justify-center text-center">
                      Successfully Delivered
                    </div>
                  )}

                  {o.status === 'CANCELLED' && (
                    <div className="h-11 px-4 rounded-xl bg-[#FFEBEE] text-[var(--fb-danger)] font-bold text-xs flex items-center justify-center border border-[var(--fb-danger)] text-center">
                      Cancelled
                    </div>
                  )}

                  <Link
                    to={`/vendor/orders/${o.id}`}
                    className="h-9 px-4 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-background)] hover:bg-[var(--fb-surface-elevated)] text-[var(--fb-text-secondary)] font-bold text-xs flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    View Slip <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
