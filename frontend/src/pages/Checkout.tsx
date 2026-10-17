import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Wallet, Banknote, CreditCard, Check, ShoppingBag, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { calcOrderTotals } from '@/utils/order';
import { Address, Order, OrderItem, StudentProfile } from '@/types';

export default function Checkout() {
  const { populatedCart, clearCart, cartTotal, isValidForCheckout } = useCart();
  const { createOrder } = useOrder();
  const { user } = useAuth();
  const navigate = useNavigate();

  const userAddresses: Address[] = (user as StudentProfile)?.addresses || [];
  const availableAddresses: Address[] =
    userAddresses.length > 0
      ? userAddresses
      : (user as any)?.deliveryLocation
      ? [
          {
            id: 'addr-default',
            label: 'Hostel / Primary',
            line: (user as any).deliveryLocation,
            landmark: 'SNS Campus'
          }
        ]
      : [];

  const [addressId, setAddressId] = useState<string>(() => availableAddresses[0]?.id || '');
  const [customAddress, setCustomAddress] = useState('');
  const [payment, setPayment] = useState('UPI');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const { subtotal, deliveryFee, discount, total } = calcOrderTotals(cartTotal);

  if (!user) {
    return (
      <div className="min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8">
          <div className="h-16 w-16 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6">
            <ShoppingBag size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-3 tracking-tight">
            Sign in to checkout
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] mb-6 font-normal leading-relaxed">
            Please log in with your student account before placing an order.
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

  if (!isSubmitted && (!populatedCart.length || !isValidForCheckout)) {
    return (
      <div className="min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center font-sans px-4">
        <div className="w-full max-w-lg mx-auto text-center border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8">
          <div className="h-16 w-16 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6">
            <ShoppingBag size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-3 tracking-tight">
            Nothing to checkout
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] mb-6 font-normal leading-relaxed">
            Your cart is empty or contains unavailable items.
          </p>
          <Link
            to="/shop"
            className="inline-flex btn-action-primary"
          >
            Start shopping <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const selectedAddress: Address =
    availableAddresses.find(a => a.id === addressId) ??
    (customAddress
      ? { id: 'temp-custom', label: 'Delivery Address', line: customAddress, landmark: 'SNS Campus' }
      : availableAddresses[0] ?? {
          id: 'temp-default',
          label: 'Campus Delivery',
          line: (user as any)?.deliveryLocation || 'Main Campus Delivery Point',
          landmark: 'SNS Campus'
        });

  const submit = () => {
    if (!populatedCart.length || !user || isPlacing) return;
    setIsPlacing(true);
    const totals = calcOrderTotals(cartTotal);

    // Exact historical price snapshot
    const snapshotItems: OrderItem[] = populatedCart.map(pc => ({
      productId: pc.item.productId,
      name: pc.product!.name,
      quantity: pc.item.quantity,
      unitPrice: pc.product!.price,
      subtotal: pc.item.quantity * pc.product!.price
    }));

    const orderId = `FB-${Math.floor(100000 + Math.random() * 899999)}`;
    const studentId = user.id;
    const storeId = populatedCart[0].item.storeId;
    const campusId = user.campusId || 'sns';

    const order: Order = {
      id: orderId,
      campusId,
      studentId,
      storeId,
      deliveryPartnerId: null,
      date: new Date().toISOString(),
      items: snapshotItems,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      status: 'PLACED',
      address: selectedAddress,
      payment
    };

    setIsSubmitted(true);
    createOrder(order);
    clearCart();
    setTimeout(() => {
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-[var(--fb-border)] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors mb-3"
            >
              <ArrowLeft size={14} /> Back to cart
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
              Checkout
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--fb-blue)] flex items-center gap-2">
            <ShieldCheck size={16} /> Guaranteed campus delivery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Address & Payment Selection */}
          <div className="lg:col-span-7 space-y-3">
            {/* 1. Delivery Address Section */}
            <section className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--fb-border)] pb-3">
                <MapPin size={18} className="text-[var(--fb-ink)]" />
                <h2 className="font-display text-lg font-bold text-[var(--fb-ink)] tracking-tight">
                  1. Delivery Location
                </h2>
              </div>

              {availableAddresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {availableAddresses.map(a => {
                    const isSelected = addressId === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setAddressId(a.id || '')}
                        className={`relative p-6 cursor-pointer transition-all duration-200 border-2 ${
                          isSelected
                            ? 'border-[var(--fb-ink)] bg-black/5'
                            : 'border-[var(--fb-border)] hover:border-[var(--fb-border)] bg-[var(--fb-surface)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-[var(--fb-ink)]' : 'text-[var(--fb-text-secondary)]'}`}>
                            {a.label}
                          </span>
                          <div
                            className={`h-5 w-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-[var(--fb-ink)] bg-[var(--fb-ink)] text-white'
                                : 'border-[var(--fb-border)]'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={4} />}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[var(--fb-ink)] leading-snug">
                          {a.line}
                        </p>
                        {a.landmark && (
                          <p className="text-xs font-medium text-[var(--fb-text-secondary)] mt-2">
                            {a.landmark}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Custom / Additional Address Line */}
              <div className="pt-4 mt-6 border-t border-[var(--fb-border)]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)] mb-2">
                  Or enter specific room / department location:
                </label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={e => {
                    setCustomAddress(e.target.value);
                    if (e.target.value) setAddressId('');
                  }}
                  placeholder="E.g. Hostel Block B, Room 204"
                  className="w-full bg-[var(--fb-bg)] border border-[var(--fb-border)] px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--fb-ink)] transition-colors text-[var(--fb-ink)]"
                />
              </div>
            </section>

            {/* 2. Payment Method */}
            <section className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--fb-border)] pb-3">
                <Wallet size={18} className="text-[var(--fb-ink)]" />
                <h2 className="font-display text-lg font-bold text-[var(--fb-ink)] tracking-tight">
                  2. Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { id: 'UPI', label: 'UPI / QR', desc: 'GPay, PhonePe', icon: Wallet },
                  { id: 'Cash', label: 'Cash on Arrival', desc: 'Pay when delivered', icon: Banknote },
                  { id: 'Card', label: 'Card Payment', desc: 'Debit / Credit', icon: CreditCard }
                ].map(({ id, label, desc, icon: Icon }) => {
                  const isSelected = payment === id;
                  return (
                    <div
                      key={id}
                      onClick={() => setPayment(id)}
                      className={`relative p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 ${
                        isSelected
                          ? 'border-[var(--fb-ink)] bg-black/5'
                          : 'border-[var(--fb-border)] hover:border-[var(--fb-border)] bg-[var(--fb-surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <Icon size={24} className={isSelected ? 'text-[var(--fb-ink)]' : 'text-[var(--fb-text-secondary)]'} />
                        <div
                          className={`h-5 w-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[var(--fb-ink)] bg-[var(--fb-ink)] text-white' : 'border-[var(--fb-border)]'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                      </div>
                      <div>
                        <p className={`font-display text-sm font-bold tracking-tight mb-1 ${isSelected ? 'text-[var(--fb-ink)]' : 'text-[var(--fb-text-secondary)]'}`}>
                        {label}
                      </p>
                      <p className="text-xs font-medium text-[var(--fb-text-secondary)] leading-snug">
                        {desc}
                      </p>
                    </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT: Order Items & Place Order Summary */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[var(--fb-ink)] uppercase tracking-wider border-b border-[var(--fb-border)] pb-3 mb-4">
                Order Review
              </h2>

              {/* Items Snapshot */}
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--fb-border)] mb-4">
                {populatedCart.map(({ item, product }) => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-display font-black text-[10px] text-[var(--fb-surface)] bg-[var(--fb-ink)] px-2 py-1">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-xs text-[var(--fb-ink)] truncate">
                        {product?.name || 'Item'}
                      </span>
                    </div>
                    <span className="font-display font-black text-sm text-[var(--fb-ink)] shrink-0">
                      ₹{(product?.price || 0) * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 pb-4 border-t border-b border-[var(--fb-border)] pt-4 text-xs font-bold text-[var(--fb-text-secondary)]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-[var(--fb-ink)]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Campus Delivery</span>
                  <span className="text-[var(--fb-ink)]">₹{deliveryFee}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-[var(--fb-blue)]">
                    <span>Platform Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
              </div>

              {/* Total to pay */}
              <div className="pt-4 pb-6 flex flex-col items-end">
                <div className="w-full flex justify-between items-end mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                    Total
                  </span>
                  <span className="font-display text-3xl font-black text-[var(--fb-ink)] tracking-tighter leading-none">
                    ₹{total}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={submit}
                disabled={isPlacing}
                className="w-full btn-action-primary transition-all duration-200"
              >
                {isPlacing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming Order...</span>
                  </span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
