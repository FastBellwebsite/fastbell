import { Link } from 'react-router-dom';
import { Package, RotateCcw, ArrowRight, Store, Clock } from 'lucide-react';
import { useOrder } from '@/context/OrderContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { getOrdersForStudent } from '@/selectors/orderSelectors';
import { StatusBadge } from '@/components/UI';
import { Order } from '@/types';
import toast from 'react-hot-toast';

export default function Orders() {
  const { user } = useAuth();
  const { orders } = useOrder();
  const { stores } = useStore();
  const { addToCart, clearCart } = useCart();

  const studentId = user?.id;
  const myOrders = studentId ? getOrdersForStudent(orders, studentId) : [];
  const active = myOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const past = myOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const handleReorder = (order: Order) => {
    clearCart();
    order.items.forEach(item => {
      addToCart(item.productId, order.storeId, item.quantity);
    });
    toast.success('Items added to cart');
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4 py-8">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8 sm:p-10 rounded-2xl shadow-sm">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6 rounded-2xl border border-[var(--fb-border)] shadow-2xs">
            <Package size={28} strokeWidth={2} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] mb-3 tracking-tight">
            Sign in required
          </h1>
          <p className="text-sm sm:text-base text-[var(--fb-text-secondary)] mb-7 font-normal leading-relaxed">
            Please log in with your student account to view and track your orders.
          </p>
          <Link
            to="/auth/student"
            className="inline-flex btn-action-primary"
          >
            Sign in as Student <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-[var(--fb-border)] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight mb-1">
              My Orders
            </h1>
            <p className="text-sm text-[var(--fb-text-secondary)] font-normal">
              Track live deliveries and re-order previous campus purchases
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--fb-text-muted)] bg-[var(--fb-surface)] border border-[var(--fb-border)] px-3 py-1 rounded-md self-start sm:self-auto">
            {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'} on record
          </span>
        </div>

        {myOrders.length === 0 ? (
          <div className="space-y-8 max-w-4xl">
            <div className="p-8 sm:p-10 md:p-12 text-center bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl shadow-sm">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6 rounded-2xl border border-[var(--fb-border)] shadow-2xs">
                <Package size={28} strokeWidth={2} />
              </div>
              <h2 className="font-display text-[22px] sm:text-2xl md:text-[28px] font-extrabold text-[var(--fb-ink)] mb-3 tracking-tight">
                No orders yet
              </h2>
              <p className="text-sm sm:text-base md:text-[16px] text-[var(--fb-text-secondary)] max-w-md mx-auto mb-8 leading-[1.6]">
                Your campus order history is fresh and clean. Hot canteen meals, stationery, hostel groceries, and laundry services are ready for doorstep delivery.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white text-sm sm:text-[15px] font-bold uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Browse Campus Marketplace</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>

            {/* Suggested Categories */}
            <div className="border border-[var(--fb-border)] bg-[var(--fb-surface)] p-6 sm:p-7 rounded-2xl shadow-sm">
              <h3 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-4">
                Explore Campus Offerings
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Link
                  to="/category/cat-food"
                  className="p-4 sm:p-5 border border-[var(--fb-border)] bg-[var(--fb-bg)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                >
                  <p className="font-display text-sm sm:text-base font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">Food & Canteen</p>
                  <p className="text-xs text-[var(--fb-text-muted)] mt-1">12-15 min drop</p>
                </Link>
                <Link
                  to="/category/cat-stationery"
                  className="p-4 sm:p-5 border border-[var(--fb-border)] bg-[var(--fb-bg)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                >
                  <p className="font-display text-sm sm:text-base font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">Stationery & Print</p>
                  <p className="text-xs text-[var(--fb-text-muted)] mt-1">Lab & exam gear</p>
                </Link>
                <Link
                  to="/category/cat-grocery"
                  className="p-4 sm:p-5 border border-[var(--fb-border)] bg-[var(--fb-bg)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                >
                  <p className="font-display text-sm sm:text-base font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">Dorm Groceries</p>
                  <p className="text-xs text-[var(--fb-text-muted)] mt-1">Milk & snacks</p>
                </Link>
                <Link
                  to="/category/cat-laundry"
                  className="p-4 sm:p-5 border border-[var(--fb-border)] bg-[var(--fb-bg)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                >
                  <p className="font-display text-sm sm:text-base font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">Laundry & Ironing</p>
                  <p className="text-xs text-[var(--fb-text-muted)] mt-1">Doorstep pickup</p>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl">
            {/* Active Deliveries Section */}
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--fb-border)] pb-2">
                  <span className="h-2 w-2 bg-[var(--fb-blue)] animate-pulse" />
                  <h2 className="font-display text-lg font-black text-[var(--fb-ink)] uppercase tracking-tight">
                    Active Deliveries ({active.length})
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  {active.map(o => {
                    const store = stores.find(s => s.id === o.storeId);
                    return (
                      <div
                        key={o.id}
                        className="bg-[var(--fb-surface)] border border-[var(--fb-blue)] p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-[11px] font-bold text-[var(--fb-blue)] uppercase tracking-wider bg-[var(--fb-blue-soft)] px-2 py-0.5 border border-[var(--fb-blue)]/20 rounded-sm">
                              #{o.id}
                            </span>
                            <StatusBadge status={o.status} />
                            <span className="text-[11px] font-medium text-[var(--fb-text-muted)]">
                              {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-display font-black text-lg text-[var(--fb-ink)]">
                            <Store size={16} strokeWidth={2.5} className="text-[var(--fb-blue)]" />
                            <span>{store?.name || 'Campus Merchant'}</span>
                          </div>

                          <p className="text-xs font-medium text-[var(--fb-text-secondary)] line-clamp-1">
                            {o.items.map(i => <span key={i.productId} className="mr-2"><b className="text-[var(--fb-ink)]">{i.quantity}x</b> {i.name}</span>)}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 md:pt-0 border-t md:border-0 border-[var(--fb-border)]">
                          <div className="text-left md:text-right w-full sm:w-auto">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] block">
                              Total
                            </span>
                            <span className="font-display font-black text-xl text-[var(--fb-ink)] leading-none">
                              ₹{o.total}
                            </span>
                          </div>

                          <Link
                            to={`/orders/${o.id}`}
                            className="w-full sm:w-auto btn-action-primary"
                          >
                            <span>Live Tracking</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Orders Section */}
            {past.length > 0 && (
              <section>
                <div className="mb-6 border-b-2 border-[var(--fb-ink)] pb-4">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                    Past Orders
                  </h2>
                </div>

                <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] divide-y divide-[var(--fb-border)] shadow-sm">
                  {past.map(o => {
                    const store = stores.find(s => s.id === o.storeId);
                    return (
                      <div
                        key={o.id}
                        className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-black/5 transition-colors group"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs font-bold text-[var(--fb-text-secondary)] uppercase tracking-wider">
                              #{o.id}
                            </span>
                            <StatusBadge status={o.status} />
                            <span className="text-xs font-medium text-[var(--fb-text-muted)]">
                              {new Date(o.date).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors">
                            {store?.name || 'Campus Merchant'}
                          </h3>

                          <p className="text-xs sm:text-sm font-normal text-[var(--fb-text-secondary)] line-clamp-1">
                            {o.items.map(i => <span key={i.productId} className="mr-2"><b>{i.quantity}x</b> {i.name}</span>)}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 md:pt-0 border-t md:border-0 border-[var(--fb-border)]">
                          <div className="text-left md:text-right w-full sm:w-auto">
                            <span className="font-display font-black text-2xl text-[var(--fb-ink)]">
                              ₹{o.total}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                              to={`/orders/${o.id}`}
                              className="btn-action-outline w-full sm:w-auto"
                            >
                              Details
                            </Link>

                            <button
                              onClick={() => handleReorder(o)}
                              className="btn-action-soft w-full sm:w-auto"
                            >
                              <RotateCcw size={14} />
                              <span>Reorder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
