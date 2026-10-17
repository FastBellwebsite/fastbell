import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { StatusBadge, EmptyState } from '@/components/UI';
import { MapPin, Store, User, Phone, Navigation, CheckCircle, Clock, PackageCheck, Box } from 'lucide-react';
import { mockUserService } from '@/services/mockUserService';

export default function DeliveryOrderDetail() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const { stores } = useStore();
  const { orders, markPickedUp, markOutForDelivery, markDelivered } = useOrder();

  const partnerId = user?.id;
  const order = orders.find(o => o.id === orderId);

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

  const customer = mockUserService.getUserById(order.studentId);
  const customerName = customer ? customer.name : 'Campus Student';
  const customerPhone = customer ? customer.phone : '9876543210';

  const store = stores.find(s => s.id === order.storeId);
  const storeName = store?.name || 'Campus Vendor';

  return (
    <div className="max-w-2xl">
      <Link
        to="/delivery"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fb-ink)]/60 hover:text-[var(--fb-blue)]"
      >
        ← Back to delivery dashboard
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
            value={`${order.address.line}, ${order.address.landmark}`}
          />
          <Info icon={<User className="h-4 w-4" />} label="Customer" value={customerName} />
          <Info icon={<Phone className="h-4 w-4" />} label="Contact" value={customerPhone} />
        </div>

        <div className="mt-5 border-t border-[#ebe3da] pt-4">
          <h4 className="text-sm font-bold text-[var(--fb-ink)] mb-3">Items</h4>
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-background-50 border border-background-100"
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
          <div className="mt-3 flex justify-between border-t border-[#ebe3da] pt-2">
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
              className="btn-primary w-full flex items-center justify-center gap-2 bg-[#E8F5E9] hover:bg-[#E8F5E9]"
            >
              <CheckCircle className="h-4 w-4" /> Mark Order as Delivered
            </button>
          )}

          {order.status === 'DELIVERED' && (
            <div className="p-4 text-center rounded-2xl bg-[#E8F5E9] text-[var(--fb-success)] font-bold text-sm border border-[var(--fb-success)]">
              Order successfully delivered. Great job!
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="p-4 text-center rounded-2xl bg-[#FFEBEE] text-[var(--fb-danger)] font-bold text-sm border border-[var(--fb-danger)]">
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
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-background-50 text-[var(--fb-blue)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-[var(--fb-ink)]/50 font-medium">{label}</p>
        <p className="font-semibold text-[var(--fb-ink)] text-sm">{value}</p>
      </div>
    </div>
  );
}
