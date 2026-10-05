import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import StoreConflictModal from './StoreConflictModal';
import { getProductFallbackImage } from '@/utils/imageFallback';

export default function ProductCard({ product }: { product: Product }) {
  const { toggleFavorite, favorites, stores } = useStore();
  const { cart, addToCart, replaceCartAndAdd, updateQuantity } = useCart();
  const isFav = favorites.includes(product.id);
  const store = stores.find(s => s.id === product.storeId);

  const cartItem = cart.find(i => i.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictStoreName, setConflictStoreName] = useState('');

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addToCart(product.id, product.storeId, 1);
    if (!result.success) {
      setConflictStoreName(result.existingStoreName || 'another store');
      setConflictModalOpen(true);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, -1);
  };

  const handleConfirmReplace = () => {
    replaceCartAndAdd(product.id, product.storeId, 1);
    setConflictModalOpen(false);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <>
      <div className="group relative flex flex-col h-full bg-[var(--fb-surface)] border border-[var(--fb-border)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[var(--fb-blue)]/40">
        {/* Visual Hero Image Container (Borderless) */}
        <Link
          to={`/product/${product.id}`}
          className="relative block aspect-[4/5] w-full bg-[var(--fb-bg)] overflow-hidden border-b border-[var(--fb-border)]"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getProductFallbackImage(product.categoryId || product.category);
            }}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] mix-blend-multiply dark:mix-blend-normal"
          />

          {/* Abstract scrim on hover */}
          <div className="absolute inset-0 bg-[var(--fb-blue)]/0 group-hover:bg-[var(--fb-blue)]/[0.02] transition-colors duration-300" />

          {/* Discount Tag */}
          {hasDiscount && (
            <span className="absolute left-0 top-0 bg-[var(--fb-ink)] px-2 py-1 text-[11px] font-bold tracking-wider text-[var(--fb-surface)] uppercase">
              Save ₹{(product.originalPrice || 0) - product.price}
            </span>
          )}

          {/* Favorite Toggle */}
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`absolute right-3 top-3 p-2 bg-[var(--fb-surface)] rounded-full shadow-sm transition-transform active:scale-90 hover:scale-110 cursor-pointer z-10 ${
              isFav ? 'text-[var(--fb-danger)]' : 'text-[var(--fb-text-muted)] hover:text-[var(--fb-blue)]'
            }`}
            aria-label="Save to favorites"
          >
            <Heart
              size={14}
              strokeWidth={2.5}
              className={`transition-colors ${isFav ? 'fill-[var(--fb-danger)]' : ''}`}
            />
          </button>
        </Link>

        {/* Content & Action Area */}
        <div className="flex flex-1 flex-col justify-between p-3 bg-[var(--fb-surface)]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] truncate mb-0.5 group-hover:text-[var(--fb-blue)] transition-colors">
              {store?.name || 'Campus Store'}
            </div>

            <Link
              to={`/product/${product.id}`}
              className="font-display font-bold text-sm sm:text-[15px] text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug line-clamp-2"
            >
              {product.name}
            </Link>
          </div>

          {/* Price & Add Action Row */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--fb-border)] pt-3">
            <div className="flex flex-col">
              <span className="font-display font-black text-[var(--fb-ink)] text-base sm:text-[17px] leading-none">
                ₹{product.price}
              </span>
              {hasDiscount && (
                <span className="text-[11px] font-bold text-[var(--fb-text-muted)] line-through mt-0.5">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Availability / Add Action */}
            <div className="h-8 relative min-w-[70px] flex justify-end">
              {product.isAvailable ? (
                <div className="relative w-full h-full flex justify-end">
                  {/* The Add Button (Fades out when qty > 0) */}
                  <button
                    onClick={handleAdd}
                    className={`absolute inset-y-0 right-0 inline-flex items-center justify-center px-3.5 bg-[var(--fb-surface)] border border-[var(--fb-border)] group-hover:border-[var(--fb-blue)] group-hover:text-[var(--fb-blue)] group-hover:bg-[var(--fb-blue-soft)] active:scale-95 text-[var(--fb-ink)] font-bold text-xs uppercase tracking-wider rounded-sm transition-all cursor-pointer
                      ${quantity > 0 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                    aria-label="Add to cart"
                  >
                    ADD
                  </button>

                  {/* Quantity Controls (Fades in when qty > 0) */}
                  <div
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={`absolute inset-y-0 right-0 flex items-center bg-[var(--fb-ink)] text-white rounded-sm transition-all duration-200 origin-right shadow-xs
                      ${quantity > 0 ? 'opacity-100 scale-100 w-auto' : 'opacity-0 scale-95 pointer-events-none w-0 overflow-hidden'}`}
                  >
                    <button
                      onClick={handleDecrement}
                      className="h-full px-2.5 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="px-1 text-xs font-black min-w-[16px] text-center select-none font-display">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="h-full px-2.5 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ) : (
                <span className="flex items-center h-full bg-[var(--fb-bg)] px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] rounded-sm">
                  Out
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <StoreConflictModal
        isOpen={conflictModalOpen}
        existingStoreName={conflictStoreName}
        onConfirm={handleConfirmReplace}
        onCancel={() => setConflictModalOpen(false)}
      />
    </>
  );
}
