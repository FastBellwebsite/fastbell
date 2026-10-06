import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { Store } from '@/types';
import { getStoreFallbackImage } from '@/utils/imageFallback';

export default function StoreCard({ store }: { store: Store }) {
  const categoryLabel = store.category.replace('cat-', '').replace('-', ' ');

  return (
    <Link
      to={`/store/${store.id}`}
      className="group relative flex flex-col h-full bg-[var(--fb-surface)] border border-[var(--fb-border)] overflow-hidden transition-colors hover:border-[var(--fb-ink)]"
    >
      {/* Store Cover Image with Scrim */}
      <div className="relative h-44 sm:h-48 w-full bg-[var(--fb-bg)] overflow-hidden border-b border-[var(--fb-border)]">
        <img
          src={store.image}
          alt={store.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getStoreFallbackImage(store.category);
          }}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        {/* Deep, refined gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Subtle blue overlay on hover */}
        <div className="absolute inset-0 bg-[var(--fb-ink)]/0 group-hover:bg-[var(--fb-ink)]/5 transition-colors duration-500" />

        {/* Live Status Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
          {store.isOpen ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Open</span>
            </>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Closed</span>
          )}
        </div>

        {/* Bottom Image Overlay Tag: Category & Turnaround */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-black/75 backdrop-blur-xs text-white/90 px-2 py-0.5 rounded">
            <Clock size={11} className="text-[var(--fb-blue)]" />
            {store.deliveryMinutes}m
          </span>
          <span className="text-[11px] font-medium bg-black/75 backdrop-blur-xs text-white/90 px-2 py-0.5 rounded capitalize">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col justify-between p-4 sm:p-5 flex-1">
        <div>
          <h3 className="font-display font-bold text-lg sm:text-[19px] text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] transition-colors leading-snug line-clamp-1">
            {store.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-[var(--fb-text-muted)] mt-1">
            <MapPin size={12} className="shrink-0 text-[var(--fb-text-muted)]" />
            <span className="truncate">{store.locationLabel || 'Campus Location'}</span>
          </div>
          {store.description && (
            <p className="text-xs sm:text-[13px] text-[var(--fb-text-secondary)] line-clamp-2 mt-2 font-normal leading-relaxed">
              {store.description}
            </p>
          )}
        </div>

        {/* Footer Action Row */}
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-[var(--fb-border)]">
          <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--fb-text-muted)] group-hover:text-[var(--fb-ink)] transition-colors">
            Explore Store
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--fb-blue)] group-hover:text-[var(--fb-blue-dark)] shrink-0 whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5">
            <span>Shop Now</span>
            <ArrowRight size={13} strokeWidth={2.5} className="shrink-0" />
          </span>
        </div>
      </div>
    </Link>
  );
}
