import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Store, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { calcOrderTotals } from '@/utils/order';
import { getProductFallbackImage } from '@/utils/imageFallback';

export default function Cart() {
  const navigate = useNavigate();
  const { populatedCart, updateQuantity, removeFromCart, cartTotal, isValidForCheckout } = useCart();
  const { stores } = useStore();
  const { subtotal, deliveryFee, discount, total } = calcOrderTotals(cartTotal);

  const activeStoreId = populatedCart.length > 0 ? populatedCart[0].item.storeId : null;
  const activeStore = stores.find(s => s.id === activeStoreId);

  if (!populatedCart.length) {
    return (
      <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="mb-8 border-b border-[var(--fb-border)] pb-4 flex items-center justify-between">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
              Your Cart
            </h1>
            <span className="font-mono text-xs font-bold text-[var(--fb-text-muted)] bg-[var(--fb-surface)] border border-[var(--fb-border)] px-3 py-1 rounded-md">
              0 items
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 border border-[var(--fb-border)] bg-[var(--fb-surface)] p-8 sm:p-10 md:p-12 text-center rounded-2xl shadow-sm">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-[var(--fb-bg)] flex items-center justify-center text-[var(--fb-ink)] mx-auto mb-6 rounded-2xl border border-[var(--fb-border)] shadow-2xs">
                <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
              </div>
              <h2 className="font-display text-[22px] sm:text-2xl md:text-[28px] font-extrabold text-[var(--fb-ink)] mb-3 tracking-tight">
                Your cart is empty
              </h2>
              <p className="text-sm sm:text-base md:text-[16px] text-[var(--fb-text-secondary)] max-w-md mx-auto mb-8 leading-[1.6] font-normal">
                Add canteen snacks, notebooks before lectures, cold drinks, or schedule a laundry pickup for your hostel.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2.5 bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white text-sm sm:text-[15px] font-bold uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap group"
              >
                <span>Browse All Campus Items</span>
                <ArrowRight size={16} strokeWidth={2.5} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="border border-[var(--fb-border)] bg-[var(--fb-surface)] p-6 sm:p-7 rounded-2xl shadow-sm">
                <h3 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-4">
                  Quick Category Access
                </h3>
                <div className="space-y-2.5">
                  <Link
                    to="/category/cat-food"
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-[var(--fb-bg)] border border-[var(--fb-border)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-sm sm:text-[15px] md:text-base text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug">Food & Night Canteens</p>
                      <p className="text-xs sm:text-[13px] text-[var(--fb-text-muted)] mt-0.5 leading-normal">Hot meals & quick snacks</p>
                    </div>
                    <ArrowRight size={16} strokeWidth={2.5} className="text-[var(--fb-text-muted)] group-hover:text-[var(--fb-blue)] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </Link>
                  <Link
                    to="/category/cat-stationery"
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-[var(--fb-bg)] border border-[var(--fb-border)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-sm sm:text-[15px] md:text-base text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug">Stationery & Notebooks</p>
                      <p className="text-xs sm:text-[13px] text-[var(--fb-text-muted)] mt-0.5 leading-normal">Classmate spirals & pens</p>
                    </div>
                    <ArrowRight size={16} strokeWidth={2.5} className="text-[var(--fb-text-muted)] group-hover:text-[var(--fb-blue)] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </Link>
                  <Link
                    to="/category/cat-grocery"
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-[var(--fb-bg)] border border-[var(--fb-border)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-sm sm:text-[15px] md:text-base text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug">Dorm Groceries</p>
                      <p className="text-xs sm:text-[13px] text-[var(--fb-text-muted)] mt-0.5 leading-normal">Milk, biscuits & instant noodles</p>
                    </div>
                    <ArrowRight size={16} strokeWidth={2.5} className="text-[var(--fb-text-muted)] group-hover:text-[var(--fb-blue)] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </Link>
                  <Link
                    to="/category/cat-laundry"
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-[var(--fb-bg)] border border-[var(--fb-border)] hover:border-[var(--fb-blue)] transition-colors group rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-sm sm:text-[15px] md:text-base text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug">Hostel Laundry Pickup</p>
                      <p className="text-xs sm:text-[13px] text-[var(--fb-text-muted)] mt-0.5 leading-normal">Wash, steam press & fold</p>
                    </div>
                    <ArrowRight size={16} strokeWidth={2.5} className="text-[var(--fb-text-muted)] group-hover:text-[var(--fb-blue)] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 border-b border-[var(--fb-border)] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors mb-3"
            >
              <ArrowLeft size={14} /> Continue browsing
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
              Your Cart
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--fb-blue)]">
            {populatedCart.length} item{populatedCart.length > 1 ? 's' : ''} in this order
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Items List */}
          <div className="lg:col-span-8">
            {/* Store Information Banner */}
            {activeStore && (
              <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Store size={16} className="text-[var(--fb-blue)] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                    Ordering from
                  </span>
                  <h3 className="font-display text-base font-bold text-[var(--fb-ink)] ml-1">
                    {activeStore.name}
                  </h3>
                </div>

                <span className="text-xs font-semibold text-[var(--fb-ink)] bg-[var(--fb-bg)] px-3 py-1 border border-[var(--fb-border)] rounded-lg self-start sm:self-auto">
                  {activeStore.locationLabel}
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex flex-col">
              {populatedCart.map(({ item, product, isAvailable }) => {
                if (!product || !isAvailable) {
                  return (
                    <div
                      key={item.productId}
                      className="py-5 px-4 border-b border-[var(--fb-border)] flex items-center justify-between gap-4 bg-[var(--fb-warning)]/30 rounded-xl mb-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <AlertCircle className="h-5 w-5 text-[var(--fb-warning)] shrink-0" />
                        <div>
                          <p className="font-bold text-sm sm:text-base text-[var(--fb-ink)]">
                            {product?.name || 'Item unavailable'}
                          </p>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fb-danger)]">
                            Sold out or unlisted
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs font-bold uppercase tracking-wider text-[var(--fb-danger)] hover:underline transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.productId}
                    className="p-4 sm:p-5 bg-[var(--fb-surface)] border border-[var(--fb-border)] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      {/* Product Thumbnail */}
                      <Link
                        to={`/product/${product.id}`}
                        className="h-16 w-16 sm:h-20 sm:w-20 bg-[var(--fb-bg)] border border-[var(--fb-border)] rounded-xl shrink-0 flex items-center justify-center p-1.5"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getProductFallbackImage(product.categoryId || product.category);
                          }}
                          className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                        />
                      </Link>

                      {/* Product Info */}
                      <div>
                        <Link
                          to={`/product/${product.id}`}
                          className="font-display font-bold text-base sm:text-[17px] text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors leading-snug line-clamp-2 block"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs sm:text-[13px] font-medium text-[var(--fb-text-muted)] mt-1">
                          ₹{product.price} each
                        </p>
                      </div>
                    </div>

                    {/* Stepper & Price Row */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Stepper Control */}
                      <div className="flex items-center bg-[var(--fb-bg)] border border-[var(--fb-border)] h-9 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-full px-2.5 flex items-center justify-center text-[var(--fb-ink)] hover:bg-[var(--fb-ink)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="font-display font-bold text-xs sm:text-sm min-w-[28px] text-center text-[var(--fb-ink)] select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="h-full px-2.5 flex items-center justify-center text-[var(--fb-ink)] hover:bg-[var(--fb-ink)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-display font-black text-xl text-[var(--fb-ink)]">
                          ₹{product.price * item.quantity}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[var(--fb-text-muted)] hover:text-[var(--fb-danger)] p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note on single store rule */}
            <div className="mt-4 p-4 bg-[var(--fb-surface)] border border-[var(--fb-border)] flex items-start gap-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-[var(--fb-text-muted)]" />
              <p className="text-xs sm:text-[13px] text-[var(--fb-text-secondary)] font-normal leading-relaxed">
                Orders can only contain products from one store at a time.
              </p>
            </div>
          </div>

          {/* RIGHT: Bill Summary & Checkout */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6 rounded-2xl shadow-sm">
              <h2 className="text-xs sm:text-[13px] font-bold text-[var(--fb-ink)] uppercase tracking-wider border-b border-[var(--fb-border)] pb-3 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3.5 pb-4 border-b border-[var(--fb-border)]">
                <div className="flex justify-between items-center text-sm font-medium text-[var(--fb-text-secondary)]">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-[var(--fb-ink)]">₹{subtotal}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-medium text-[var(--fb-text-secondary)]">
                  <span>Campus Delivery</span>
                  <span className="font-semibold text-[var(--fb-ink)]">₹{deliveryFee}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm font-medium text-[var(--fb-blue)]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles size={13} /> Platform Discount
                    </span>
                    <span className="font-bold">-₹{discount}</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-4 pb-6 flex flex-col items-end">
                <div className="w-full flex justify-between items-end mb-1">
                  <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                    Total Amount
                  </span>
                  <span className="font-display text-3xl font-black text-[var(--fb-ink)] tracking-tight leading-none">
                    ₹{total}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                disabled={!isValidForCheckout}
                className="w-full btn-action-primary"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Campus Trust Banner */}
            <div className="mt-4 flex items-start gap-3 p-4 bg-[var(--fb-surface)] border border-[var(--fb-border)]">
              <ShieldCheck size={16} className="text-[var(--fb-text-muted)] shrink-0" strokeWidth={2.5} />
              <p className="text-xs text-[var(--fb-text-secondary)] font-normal">
                Secure student delivery across campus.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
