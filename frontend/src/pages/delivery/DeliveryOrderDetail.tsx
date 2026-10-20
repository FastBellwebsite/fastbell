import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { StatusBadge, EmptyState } from '@/components/UI';
import { MapPin, Store, User, Phone, Navigation, CheckCircle, Clock, PackageCheck, Box, ArrowLeft } from 'lucide-react';

export default function DeliveryOrderDetail() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const { stores } = useStore();
  const { orders, markPickedUp, markOutForDelivery, markDelivered, getOrderById, isLoading } = useOrder();
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);

  const partnerId = user?.id;
  useEffect(() => {
    if (!orderId) return;
    const exists = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!exists) {
      setIsFetchingLocal(true);
      getOrderById(orderId)
        .then(res => {
          if (res) setFetchedOrder(res);
        })
        .finally(() => setIsFetchingLocal(false));
    }
  }, [orderId, orders, getOrderById]);

  const order = orders.find(o => o.id === orderId || o.orderNumber === orderId) || fetchedOrder;

  if (!order && (isLoading || isFetchingLocal)) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--fb-brand)] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-[var(--fb-text-muted)] font-medium">Loading delivery details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<Clock className="h-7 w-7" />}
          title="Order not found"
          message="This order may have been removed."
          action={
            <Link to="/delivery" className="btn-primary">
              Back to Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  // Real customer details from backend order
  const customerName = order.customer?.name || order.student?.name || 'Campus Student';
  const rawPhone = order.customer?.phone || order.student?.phone;
  const customerPhone = rawPhone && rawPhone.trim() ? rawPhone.trim() : 'No phone provided';

  // Format real address lines with fallbacks
  const addressParts = [
    order.address.line,
    order.address.locality,
    order.address.hostelName ? `Hostel: ${order.address.hostelName}` : null,
    order.address.roomNumber ? `Room: ${order.address.roomNumber}` : null,
    order.address.landmark ? `Near ${order.address.landmark}` : null,
    order.address.city
  ].filter(Boolean);

  const dropLocation = addressParts.length > 0 ? addressParts.join(', ') : (order.address.line || 'Campus Delivery Address');

  const store = stores.find(s => s.id === order.storeId);
  const storeName = store?.name || 'Campus Vendor';

  return (
    <div className="max-w-2xl">
      <Link
        to="/delivery"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fb-ink)]/60 hover:text-[var(--fb-blue)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to delivery dashboard
      </Link>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-[var(--fb-blue)] bg-[var(--fb-blue-soft)] px-2.5 py-1 rounded border border-[var(--fb-blue)]">
            #{order.id.slice(0, 8)}
          </span>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-5 space-y-4">
          <Info icon={<Store className="h-4 w-4" />} label="Pickup from" value={storeName} />
          <Info
            icon={<MapPin className="h-4 w-4" />}
            label="Drop at"
            value={dropLocation}
          />
          <Info icon={<User className="h-4 w-4" />} label="Customer" value={customerName} />
          <Info icon={<Phone className="h-4 w-4" />} label="Contact" value={customerPhone} />
        </div>

        <div className="mt-5 border-t border-[var(--fb-border)] pt-4">
          <h4 className="text-sm font-bold text-[var(--fb-ink)] mb-3">Items</h4>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--fb-bg)] border border-[var(--fb-border)]"
              >
                <Box className="h-4 w-4 text-[var(--fb-ink)] shrink-0" />
                <span className="flex-1 text-sm font-semibold text-[var(--fb-ink)]">
                  {item.name}
                </span>
                <span className="text-sm font-bold text-[var(--fb-ink)]">
                  ₹{item.unitPrice} × {item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-[var(--fb-border)] pt-2">
            <span className="font-bold text-[var(--fb-ink)]">Total Order Amount</span>
            <span className="font-display text-lg font-bold text-[var(--fb-ink)]">
              ₹{order.total}
            </span>
          </div>
        </div>

        {/* 4-Step Delivery Controls */}
        <div className="mt-6 flex flex-col gap-3">
          {order.status === 'READY_FOR_PICKUP' && (
            <button
              onClick={() => markPickedUp(order.id)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <PackageCheck className="h-4 w-4" /> Confirm Picked Up from Vendor
            </button>
          )}

          {order.status === 'PICKED_UP' && (
            <button
              onClick={() => markOutForDelivery(order.id)}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)]"
            >
              <Navigation className="h-4 w-4" /> Start Delivery / Out for Delivery
            </button>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <button
              onClick={() => markDelivered(order.id)}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-[var(--fb-success)] text-white hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" /> Mark Order as Delivered
            </button>
          )}

          {order.status === 'DELIVERED' && (
            <div className="p-4 text-center rounded-2xl bg-[#E8F5E9] dark:bg-emerald-950/40 text-[var(--fb-success)] dark:text-emerald-400 font-bold text-sm border border-[var(--fb-success)]/30">
              Order successfully delivered. Great job!
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="p-4 text-center rounded-2xl bg-[#FFEBEE] dark:bg-rose-950/40 text-[var(--fb-danger)] dark:text-rose-400 font-bold text-sm border border-[var(--fb-danger)]/30">
              Order was cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-[var(--fb-ink)]/50 font-medium">{label}</p>
        <p className="font-semibold text-[var(--fb-ink)] text-sm">{value}</p>
      </div>
    </div>
  );
}
