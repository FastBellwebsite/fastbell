import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Heart, Minus, Plus, Zap, ArrowLeft } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import StoreConflictModal from '@/components/StoreConflictModal';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, stores, toggleFavorite, favorites } = useStore();
  const { cart, addToCart, replaceCartAndAdd, updateQuantity } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictStoreName, setConflictStoreName] = useState('');

  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="py-8 min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center text-center px-6">
        <Zap className="h-16 w-16 text-[var(--fb-text-muted)] mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-4xl font-black text-[var(--fb-ink)] tracking-tight mb-4">
          Product not found
        </h1>
        <p className="text-lg font-medium text-[var(--fb-text-secondary)] max-w-lg mb-8">
          This campus item may have been removed or is no longer listed.
        </p>
        <Link to="/shop" className="btn-action-primary">
          Back to catalog
        </Link>
      </div>
    );
  }

  const store = stores.find(s => s.id === product.storeId);
  const isFav = favorites.includes(product.id);
  const cartItem = cart.find(item => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  // Related products strictly from the SAME store
  const relatedProducts = products
    .filter(p => p.storeId === product.storeId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    const result = addToCart(product.id, product.storeId, 1);
    if (!result.success) {
      setConflictStoreName(result.existingStoreName || 'another store');
      setConflictModalOpen(true);
    }
  };

  const handleConfirmReplace = () => {
    replaceCartAndAdd(product.id, product.storeId, 1);
    setConflictModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 mb-8 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)]">
          <Link to="/shop" className="hover:text-[var(--fb-ink)] transition-colors inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Catalog</Link>
          <span className="text-[var(--fb-border)]">/</span>
          {store && (
            <>
              <Link to={`/store/${store.id}`} className="hover:text-[var(--fb-ink)] transition-colors truncate max-w-[180px]">
                {store.name}
              </Link>
              <span className="text-[var(--fb-border)]">/</span>
            </>
          )}
          <span className="text-[var(--fb-ink)] truncate max-w-[240px]">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className={`flex flex-col lg:flex-row gap-6 lg:gap-10 mb-8 border-b border-[var(--fb-border)] pb-8 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Left: Product Image */}
          <div className="lg:w-1/2 flex flex-col items-start relative group">
            <div className="relative w-full aspect-square md:aspect-[4/5] bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl flex items-center justify-center overflow-hidden p-8 lg:p-10 shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain mix-blend-multiply transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-[var(--fb-surface)]', 'border', 'border-[var(--fb-border)]');
                  e.currentTarget.parentElement!.innerHTML = `<div class="text-center p-4"><span class="block text-[var(--fb-text-muted)] font-display text-sm font-bold uppercase tracking-widest mb-2">FastBell Asset</span><span class="block text-xs font-semibold text-[var(--fb-text-secondary)]">${product.name}</span></div>`;
                }}
              />

              {/* Discount Tag */}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="absolute top-6 left-6 bg-[var(--fb-ink)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-md">
                  Save ₹{product.originalPrice - product.price}
                </span>
              )}

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute right-6 top-6 p-3 bg-[var(--fb-surface)] rounded-full shadow-lg transition-transform active:scale-90 hover:scale-105 cursor-pointer z-10 border border-[var(--fb-border)] ${
                  isFav ? 'text-[var(--fb-danger)]' : 'text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)]'
                }`}
                aria-label="Save to favorites"
              >
                <Heart size={20} strokeWidth={2.5} className={isFav ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {/* Right: Details & Purchase Actions */}
          <div className="lg:w-1/2 flex flex-col pt-2 lg:pt-2">
            <div>
              {/* Store & Category */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-text-secondary)]">
                  {product.category.replace('cat-', '').replace('-', ' ')}
                </span>
                <span className="text-xs text-[var(--fb-border)]">|</span>
                {store && (
                  <Link
                    to={`/store/${store.id}`}
                    className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors border-b border-[var(--fb-ink)] pb-0.5"
                  >
                    From {store.name}
                  </Link>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--fb-ink)] tracking-tight leading-[1.08] mb-5">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-end gap-4 mb-6">
                <span className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--fb-ink)] tracking-tight leading-none">
                  ₹{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl sm:text-2xl text-[var(--fb-text-muted)] line-through font-bold mb-1">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity & CTA Buttons */}
            {product.isAvailable ? (
              <div className="w-full max-w-sm">
                {quantity > 0 ? (
                  <div className="flex items-center h-14 sm:h-16 bg-[var(--fb-blue)] text-white w-full rounded-xl shadow-lg">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-14 sm:w-16 flex items-center justify-center h-full hover:bg-black/15 cursor-pointer transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={20} strokeWidth={2.5} />
                    </button>
                    <span className="flex-1 font-display font-black text-2xl text-center select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-14 sm:w-16 flex items-center justify-center h-full hover:bg-black/15 cursor-pointer transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-14 sm:h-16 bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 rounded-xl shadow-md"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-[var(--fb-surface)] border border-[var(--fb-border)] text-[var(--fb-text-secondary)] text-center font-bold tracking-wider text-sm uppercase w-full max-w-sm rounded-xl">
                Out of Stock
              </div>
            )}

            {/* Description (Below Cart Action) */}
            <div className="mt-8 pt-8 border-t border-[var(--fb-border)]">
              <h2 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-3">
                About this item
              </h2>
              <p className="text-sm sm:text-base font-normal text-[var(--fb-text-secondary)] leading-relaxed max-w-xl">
                {product.description || 'Verified authentic campus product. Prepared or packaged right inside SNS College facilities.'}
              </p>
            </div>
          </div>
        </div>

        {/* More from this store */}
        {relatedProducts.length > 0 && (
          <div className={`mt-4 transition-all duration-700 ease-out delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-[var(--fb-border)] pb-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-2">
                  Continue Shopping
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                  More from {store?.name || 'this store'}
                </h2>
              </div>
              {store && (
                <Link
                  to={`/store/${store.id}`}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] transition-colors"
                >
                  View store →
                </Link>
              )}
            </div>

            <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 pt-2">
              {relatedProducts.map(p => (
                <div key={p.id} className="w-[160px] md:w-[200px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StoreConflictModal
        isOpen={conflictModalOpen}
        existingStoreName={conflictStoreName}
        onConfirm={handleConfirmReplace}
        onCancel={() => setConflictModalOpen(false)}
      />
    </div>
  );
}
