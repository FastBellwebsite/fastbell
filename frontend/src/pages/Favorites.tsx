import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import ProductCard from '@/components/ProductCard';

export default function Favorites() {
  const { favorites, products } = useStore();
  const list = products.filter(p => favorites.includes(p.id));

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <div className="mb-8 border-b border-[var(--fb-border)] pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
            Saved Favorites
          </h1>
          <p className="text-sm text-[var(--fb-text-secondary)] mt-1 font-normal">
            Your saved snacks, drinks, and campus essentials for 1-tap re-ordering.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="p-8 sm:p-10 md:p-12 text-center max-w-xl mx-auto bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl shadow-sm">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-[var(--fb-bg)] border border-[var(--fb-border)] rounded-2xl mx-auto flex items-center justify-center text-[var(--fb-blue)] mb-6 shadow-2xs">
              <Heart size={28} className="fill-[var(--fb-blue)]/10" />
            </div>
            <h2 className="font-display text-[22px] sm:text-2xl md:text-[28px] font-extrabold text-[var(--fb-ink)] mb-3 tracking-tight">
              Save your campus essentials here
            </h2>
            <p className="text-sm sm:text-base text-[var(--fb-text-secondary)] mb-7 leading-relaxed font-normal max-w-md mx-auto">
              Tap the heart icon on any canteen meal, stationery item, or grocery pack to keep it handy for instant checkout.
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2 text-sm sm:text-[15px] py-3.5 px-7 rounded-xl">
              <span>Browse campus products</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {list.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
