import type { Order } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  Package,
  CheckCircle,
  Navigation,
  ArrowRight,
  MapPin,
  PackageCheck,
  RefreshCw,
  Loader2,
  Clock,
  ShieldAlert
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
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { stores } = useStore();
  const {
    orders,
    isLoading,
    refreshOrders,
    acceptDelivery,
    markPickedUp,
    markOutForDelivery,
    markDelivered
  } = useOrder();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingOrderId, setClaimingOrderId] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const partnerId = user?.id;
  const campusId = user?.campusId || 'sns';

  const available = getAvailableDeliveries(orders, campusId);
  const active = partnerId ? getActiveDeliveries(orders, partnerId) : [];
  const completed = partnerId ? getCompletedDeliveries(orders, partnerId) : [];

  const earnings = completed.length * 35 + active.length * 20;

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshOrders();
      toast.success('Queue refreshed', { id: 'queue-refresh', duration: 1500 });
    } catch {
      toast.error('Failed to refresh queue');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshOrders]);

  // Periodic polling every 6 seconds to capture ready-for-pickup orders in real time
  useEffect(() => {
    const timer = setInterval(() => {
      refreshOrders().catch(() => {});
    }, 6000);

    return () => clearInterval(timer);
  }, [refreshOrders]);

  // Automatic refresh when browser tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders().catch(() => {});
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [refreshOrders]);

  // Claim order with concurrency safety & localized button loader
  const handleClaimOrder = async (orderId: string) => {
    if (!partnerId) {
      toast.error('Please log in as a delivery partner to accept orders');
      return;
    }

    try {
      setClaimingOrderId(orderId);
      await acceptDelivery(orderId, partnerId);
    } catch (err: any) {
      // Error is already alerted via toast in acceptDelivery / api
    } finally {
      setClaimingOrderId(null);
    }
  };

  const handleStepTransition = async (action: () => Promise<Order | void> | void, orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      await action();
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div className="w-full h-full bg-[var(--fb-bg)] font-sans pb-12">
      {/* Driver Header */}
      <div className="bg-[var(--fb-surface)] border-b border-[var(--fb-border)] text-[var(--fb-ink)] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <Bike className="h-5 w-5 text-[var(--fb-brand)]" />
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight leading-none text-[var(--fb-ink)]">
              On Duty
            </h2>
            <p className="text-[11px] font-bold text-[var(--fb-brand)] uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--fb-brand)] animate-pulse" /> Live Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--fb-surface-elevated)] border border-[var(--fb-border)] rounded-md text-[var(--fb-ink)] hover:bg-[var(--fb-bg)] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh order queue"
            id="refresh-delivery-queue-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isLoading ? 'animate-spin text-[var(--fb-brand)]' : ''}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>

          <div className="text-right pl-3 border-l border-[var(--fb-border)]">
            <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-0.5">
              Shift Earnings
            </p>
            <p className="font-display text-xl font-black text-[var(--fb-ink)] leading-none">
              ₹{earnings}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Active Assignment (if any) */}
      {active.length > 0 && (
        <div className="p-0 border-b border-[var(--fb-border)] bg-[var(--fb-surface)] mb-6">
          <div className="px-4 py-2.5 bg-blue-500/10 dark:bg-blue-500/20 border-b border-[var(--fb-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-[var(--fb-blue)] animate-pulse" />
              <h3 className="font-bold text-[var(--fb-ink)] uppercase tracking-wider text-xs">
                Active Assignment ({active.length})
              </h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--fb-blue)] text-white">
              In Progress
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[var(--fb-border)]">
            {active.map(o => {
              const store = stores.find(s => s.id === o.storeId);
              const storeName = store?.name || (o as any).store?.name || 'Campus Vendor';
              const isProcessing = processingOrderId === o.id;

              return (
                <div key={o.id} className="p-4 sm:p-6 bg-[var(--fb-surface)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block font-mono text-xs font-bold bg-[var(--fb-bg)] border border-[var(--fb-border)] text-[var(--fb-ink)] px-2 py-0.5 mb-2">
                        #{o.id.slice(0, 8)}
                      </span>
                      <h4 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] leading-tight max-w-[280px]">
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
                      <p className="text-xs font-normal text-[var(--fb-text-secondary)]">{store?.locationLabel || 'Campus'}</p>
                    </div>
                  </div>

                  {/* Discrete Multi-step Delivery Transitions */}
                  <div className="space-y-2">
                    {o.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => handleStepTransition(() => markPickedUp(o.id), o.id)}
                        disabled={isProcessing}
                        className="w-full bg-[var(--fb-blue)] text-white py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-[var(--fb-blue-dark)] transition-colors flex items-center justify-between cursor-pointer rounded-lg border border-transparent shadow-sm disabled:opacity-70"
                      >
                        <span>{isProcessing ? 'Updating...' : 'Confirm Picked Up'}</span>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                      </button>
                    )}

                    {o.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleStepTransition(() => markOutForDelivery(o.id), o.id)}
                        disabled={isProcessing}
                        className="w-full bg-[var(--fb-blue)] text-white py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center justify-between cursor-pointer rounded-lg shadow-sm disabled:opacity-70"
                      >
                        <span>{isProcessing ? 'Updating...' : 'Start Delivery'}</span>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 animate-pulse" />}
                      </button>
                    )}

                    {o.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleStepTransition(() => markDelivered(o.id), o.id)}
                        disabled={isProcessing}
                        className="w-full bg-[var(--fb-success)] text-white py-3 px-4 font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-between cursor-pointer rounded-lg shadow-sm disabled:opacity-70"
                      >
                        <span>{isProcessing ? 'Finalizing...' : 'Mark Delivered'}</span>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
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
      )}

      {/* SECTION 2: Live Queue (Always Available) */}
      <div className="p-0 border-t-2 border-[var(--fb-border)] bg-[var(--fb-surface)]">
        <div className="px-4 py-2.5 bg-[var(--fb-surface-elevated)] border-b border-[var(--fb-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--fb-brand)]" />
            <h3 className="font-bold text-[var(--fb-ink)] uppercase tracking-wider text-xs">
              Live Queue ({available.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[var(--fb-text-muted)] flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
            Auto-syncing
          </span>
        </div>

        <div className="flex flex-col divide-y divide-[var(--fb-border)]">
          {available.length === 0 ? (
            <div className="p-6 bg-[var(--fb-surface)]">
              <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-[var(--fb-border)] bg-[var(--fb-bg)] mb-6 rounded-md">
                <div className="h-12 w-12 rounded-full bg-[var(--fb-surface)] border border-[var(--fb-border)] flex items-center justify-center mb-3">
                  <Bike className="h-5 w-5 text-[var(--fb-brand)] animate-bounce" />
                </div>
                <p className="font-display text-base font-bold text-[var(--fb-ink)] tracking-tight">
                  Queue is clear • You're on standby
                </p>
                <p className="text-xs text-[var(--fb-text-muted)] mt-1 max-w-sm">
                  Waiting for kitchen dispatch & merchant pickups. As soon as a vendor marks an order Ready for Pickup, it appears here automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[var(--fb-border)] bg-[var(--fb-surface)] rounded-md">
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

                <div className="p-4 border border-[var(--fb-border)] bg-[var(--fb-surface)] rounded-md">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] mb-3">
                    Runner Protocol
                  </h4>
                  <ul className="space-y-2 text-xs text-[var(--fb-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--fb-brand)] font-bold">1.</span>
                      <span>Verify 4-digit order number at merchant counter before pickup</span>
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
          ) : (
            available.map(o => {
              const store = stores.find(s => s.id === o.storeId);
              const storeName = store?.name || (o as any).store?.name || 'Campus Vendor';
              const isClaiming = claimingOrderId === o.id;

              return (
                <div
                  key={o.id}
                  className="p-4 sm:p-5 hover:bg-[var(--fb-bg)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold border border-[var(--fb-border)] text-[var(--fb-text-muted)] px-1.5 py-0.5 rounded">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Ready for Pickup
                      </span>
                      <h4 className="font-bold text-[var(--fb-ink)] text-sm">
                        {storeName}
                      </h4>
                    </div>
                    <p className="text-xs font-bold text-[var(--fb-ink)] max-w-sm truncate">
                      To: {o.address.line} <span className="text-[var(--fb-text-secondary)] font-medium">({o.address.landmark})</span>
                    </p>
                    <p className="text-xs font-medium text-[var(--fb-text-muted)] mt-1 flex items-center gap-2">
                      <span className="font-bold text-[var(--fb-ink)]">₹{o.total}</span>
                      <span>•</span>
                      <span>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleClaimOrder(o.id)}
                    disabled={isClaiming || Boolean(claimingOrderId)}
                    className="shrink-0 bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-md shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    id={`accept-order-${o.id}`}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Delivery</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
