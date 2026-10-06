import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  MapPin,
  Store as StoreIcon,
  Bike,
  Clock,
  ArrowLeft,
  Receipt,
  Check,
  Box,
  Star,
  PackageCheck
} from 'lucide-react';
import { useOrder } from '@/context/OrderContext';
import { useStore } from '@/context/StoreContext';
import { mockUserService } from '@/services/mockUserService';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderStatus } from '@/types';

const steps: { status: OrderStatus; label: string; icon: any; verb: string }[] = [
  { status: 'PLACED', label: 'Placed', icon: Receipt, verb: 'Order Placed' },
  { status: 'ACCEPTED', label: 'Accepted', icon: StoreIcon, verb: 'Accepted by Vendor' },
  { status: 'PREPARING', label: 'Preparing', icon: Box, verb: 'Preparing in Kitchen' },
  { status: 'READY_FOR_PICKUP', label: 'Ready', icon: Check, verb: 'Ready for Pickup' },
  { status: 'PICKED_UP', label: 'Picked Up', icon: PackageCheck, verb: 'Picked Up by Driver' },
  { status: 'OUT_FOR_DELIVERY', label: 'On the way', icon: Bike, verb: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle, verb: 'Delivered' }
];

export default function OrderTracking() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const { orders, rateOrder } = useOrder();
  const { stores } = useStore();

  const [rating, setRating] = useState(0);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4 fade-in">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8">
          <div className="h-16 w-16 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6">
            <Clock size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-3 tracking-tight">
            Order not found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] mb-6 font-normal leading-relaxed">
            This order may have been removed or does not exist.
          </p>
          <Link
            to="/orders"
            className="inline-flex btn-action-primary"
          >
            <ArrowLeft size={14} /> My orders
          </Link>
        </div>
      </div>
    );
  }

  // Prevent students from viewing other students' orders
  if (user && user.role === 'student' && order.studentId !== user.id) {
    return (
      <div className="min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4 fade-in">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8">
          <div className="h-16 w-16 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6">
            <Clock size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-3 tracking-tight">
            Unauthorized Access
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] mb-6 font-normal leading-relaxed">
            This order was placed by another student account.
          </p>
          <Link
            to="/orders"
            className="inline-flex btn-action-primary"
          >
            <ArrowLeft size={14} /> My orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusArray = steps.map(s => s.status);
  const currentIndex =
    order.status === 'CANCELLED' ? -1 : currentStatusArray.indexOf(order.status);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : null;

  const store = stores.find(s => s.id === order.storeId);
  const driver = order.deliveryPartnerId
    ? mockUserService.getUserById(order.deliveryPartnerId)
    : null;

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white fade-in">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors"
          >
            <ArrowLeft size={14} /> Back to My Orders
          </Link>
          <div className="flex bg-[var(--fb-surface)] border border-[var(--fb-border)] px-4 py-2 items-center gap-3 rounded-lg">
            <span className="text-xs font-bold text-[var(--fb-text-secondary)] uppercase tracking-wider">
              Order ID
            </span>
            <span className="font-display text-sm font-black text-[var(--fb-ink)]">
              #{order.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Order Creation Moment / Confirmation Notice */}
        {order.status === 'PLACED' && (
          <div className="mb-6 p-4 sm:p-5 bg-[var(--fb-surface)] border-2 border-[var(--fb-blue)] rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] flex items-center justify-center font-bold shrink-0">
                <CheckCircle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-extrabold text-sm sm:text-base text-[var(--fb-ink)]">
                    ORDER PLACED
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--fb-blue)] bg-[var(--fb-blue-soft)] px-2 py-0.5 rounded">
                    #{order.id}
                  </span>
                </div>
                <p className="text-xs text-[var(--fb-text-secondary)] mt-0.5">
                  Store: <strong className="text-[var(--fb-ink)]">{store?.name || 'Campus Store'}</strong> • {order.items.reduce((acc, i) => acc + i.quantity, 0)} item(s) • Total ₹{order.total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fb-blue)] bg-[var(--fb-blue-soft)] px-3 py-1.5 rounded-lg w-fit shrink-0">
              <span className="w-2 h-2 rounded-full bg-[var(--fb-blue)] animate-ping" />
              <span>Current Status: Placed • Sent to Kitchen</span>
            </div>
          </div>
        )}

        {/* Global Tracker Hero */}
        <div className="mb-6">
          {order.status === 'CANCELLED' ? (
            <div className="border-l-[6px] border-[var(--fb-danger)] bg-[var(--fb-surface)] p-8 sm:p-10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-y border-r border-y-[var(--fb-border)] border-r-[var(--fb-border)] shadow-sm">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[var(--fb-ink)] mb-2 tracking-tight">
                  Order Cancelled
                </h1>
                <p className="text-sm sm:text-base text-[var(--fb-text-secondary)] font-normal max-w-xl">
                  Your order was cancelled and any payment has been refunded to the original payment method.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--fb-ink)] text-white p-8 md:p-10 rounded-2xl relative overflow-hidden flex flex-col items-center border border-[var(--fb-ink)] shadow-md">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--fb-blue)] to-transparent opacity-20 pointer-events-none mix-blend-screen" />
              
              <div className="relative z-10 text-center w-full mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-white/20 bg-white/10 text-xs font-bold uppercase tracking-wider mb-6 rounded-lg">
                  <span className="h-1.5 w-1.5 bg-[var(--fb-blue)] animate-pulse rounded-full" /> Live Status
                </div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-4 text-white">
                  {currentStep?.verb || 'Processing...'}
                </h1>
                <p className="text-sm sm:text-base text-white/90 font-normal max-w-2xl mx-auto leading-relaxed">
                  {order.status === 'DELIVERED'
                    ? 'Delivered to your location!'
                    : `Arriving at ${order.address.line} (${order.address.landmark})`}
                </p>
              </div>

              {/* High-Contrast Tracking Steps */}
              <div className="relative z-10 w-full max-w-5xl mx-auto mt-8">
                <div className="flex justify-between relative">
                  {/* Background Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2" />

                  {/* Active Line */}
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-[var(--fb-blue)] -translate-y-1/2 transition-all duration-700 ease-out"
                    style={{
                      width:
                        currentIndex > 0
                          ? `${(currentIndex / (steps.length - 1)) * 100}%`
                          : '0%'
                    }}
                  />

                  {/* Nodes */}
                  {steps.map((step, i) => {
                    const done = i <= currentIndex;
                    const current = i === currentIndex;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.status}
                        className="relative flex flex-col items-center group"
                      >
                        <div
                          className={`relative z-10 flex items-center justify-center h-10 w-10 md:h-14 md:w-14 transition-all duration-500 ease-in-out border-2 ${
                            current
                              ? 'bg-[var(--fb-blue)] border-[var(--fb-blue)] text-white scale-110 shadow-[0_0_30px_rgba(49,92,255,0.6)]'
                              : done
                              ? 'bg-[var(--fb-blue)] border-[var(--fb-blue)] text-white'
                              : 'bg-[var(--fb-ink)] border-white/20 text-white/30'
                          }`}
                        >
                          {done && !current && (
                            <Check className="h-5 w-5 md:h-6 md:w-6" strokeWidth={3} />
                          )}
                          {current && (
                            <StepIcon className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                          )}
                          {!done && <span className="h-2 w-2 rounded-full bg-current opacity-50" />}
                        </div>
                        {/* Label */}
                        <span
                          className={`absolute top-16 md:top-20 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                            current
                              ? 'text-white'
                              : done
                              ? 'text-white/80'
                              : 'text-white/30'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Post-Delivery Rating */}
        {order.status === 'DELIVERED' && !order.rating && (
          <div className="mb-6 border-[3px] border-[var(--fb-ink)] bg-[var(--fb-surface)] p-8 md:p-6 text-center shadow-[6px_6px_0_0_var(--fb-ink)]">
            <h3 className="font-display text-2xl font-bold text-[var(--fb-ink)] mb-2">
              Rate your delivery
            </h3>
            <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] font-normal">
              How was your experience with {store?.name || 'the vendor'}?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-4xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? 'fill-[var(--fb-ink)] text-[var(--fb-ink)]'
                        : 'fill-transparent text-[var(--fb-border)]'
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button
                onClick={() => rateOrder(order.id, rating, 'Quick and smooth campus delivery')}
                className="mt-4 btn-action-primary"
              >
                Submit Rating
              </button>
            )}
          </div>
        )}

        {/* Fulfillment Details Grid */}
        <div className="grid gap-8 lg:grid-cols-12 max-w-6xl mx-auto">
          <div className="lg:col-span-7">
            <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-4 tracking-tight border-b border-[var(--fb-border)] pb-2">
              Fulfillment
            </h3>

            <div className="flex flex-col gap-4">
              {/* Prepared By */}
              <div className="flex items-start md:items-center gap-4 bg-[var(--fb-surface)] p-4 border border-[var(--fb-border)]">
                <div className="h-12 w-12 bg-[var(--fb-bg)] flex items-center justify-center shrink-0 border border-[var(--fb-border)] text-[var(--fb-ink)]">
                  <StoreIcon size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                    Prepared by
                  </p>
                  <p className="font-display font-black text-[var(--fb-ink)] text-sm">
                    {store?.name || 'Campus Vendor'}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--fb-text-secondary)] mt-0.5 uppercase tracking-widest">
                    {store?.locationLabel}
                  </p>
                </div>
              </div>

              {/* Delivery Partner */}
              <div className="flex items-start md:items-center gap-4 bg-[var(--fb-surface)] p-4 border border-[var(--fb-border)]">
                <div className="h-12 w-12 bg-[var(--fb-bg)] flex items-center justify-center shrink-0 border border-[var(--fb-border)] text-[var(--fb-ink)]">
                  <Bike size={18} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                    Delivery Partner
                  </p>
                  <p className="font-display font-black text-[var(--fb-ink)] text-sm">
                    {driver?.name || 'Searching for nearest rider...'}
                  </p>
                  {driver && (
                    <p className="text-[10px] font-bold text-[var(--fb-text-secondary)] mt-0.5 uppercase tracking-widest">
                      {driver.role === 'delivery' && (driver as any).vehicleType
                        ? `${(driver as any).vehicleType} • ${(driver as any).vehicleNumber}`
                        : 'On duty'}
                    </p>
                  )}
                </div>
                {driver && order.status !== 'DELIVERED' && (
                  <a
                    href={`tel:${driver.phone || '9876543210'}`}
                    className="btn-action-primary text-center"
                  >
                    Call
                  </a>
                )}
              </div>
              
              {/* Call button for mobile */}
              {driver && order.status !== 'DELIVERED' && (
                <a
                  href={`tel:${driver.phone || '9876543210'}`}
                  className="w-full btn-action-primary text-center block"
                >
                  Call Partner
                </a>
              )}

              {/* Delivering to */}
              <div className="flex items-start md:items-center gap-4 bg-[var(--fb-surface)] p-4 border border-[var(--fb-border)]">
                <div className="h-12 w-12 bg-[var(--fb-bg)] flex items-center justify-center shrink-0 border border-[var(--fb-border)] text-[var(--fb-ink)]">
                  <MapPin size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                    Delivering to
                  </p>
                  <p className="font-display font-black text-[var(--fb-ink)] text-sm line-clamp-1">
                    {order.address.line}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--fb-text-secondary)] mt-0.5 uppercase tracking-widest">
                    {order.address.landmark}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-4 tracking-tight border-b border-[var(--fb-border)] pb-2">
              Receipt
            </h3>

            <div className="bg-[var(--fb-surface)] p-6 border border-[var(--fb-border)]">
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
                {order.items.map(item => (
                  <div
                    key={item.productId}
                    className="flex flex-col border-b border-[var(--fb-border)] pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-[var(--fb-ink)] line-clamp-2 pr-4 leading-tight">
                        {item.name}
                      </p>
                      <span className="font-display text-sm font-black text-[var(--fb-ink)] whitespace-nowrap">
                        ₹{item.subtotal || item.unitPrice * item.quantity}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)]">
                      ₹{item.unitPrice} × {item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--fb-border)] pt-6 space-y-3 text-xs font-bold text-[var(--fb-text-secondary)]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-[var(--fb-ink)]">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Campus Delivery</span>
                  <span className="text-[var(--fb-ink)]">₹{order.deliveryFee}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-[var(--fb-blue)]">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                
                <div className="pt-6 pb-2 flex flex-col items-end">
                  <div className="w-full flex justify-between items-end mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                      Total Paid
                    </span>
                    <span className="font-display text-3xl font-black text-[var(--fb-ink)] tracking-tighter leading-none">
                      ₹{order.total}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] text-right w-full mt-2">
                    Payment Method: {order.payment || 'UPI'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
