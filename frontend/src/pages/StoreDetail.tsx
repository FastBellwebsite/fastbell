import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, ArrowLeft, Search, ShoppingBag, X, Compass } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/context/StoreContext';
import { getStoreFallbackImage } from '@/utils/imageFallback';

export default function StoreDetail() {
  const { stores, products } = useStore();
  const { storeId } = useParams();
  const store = stores.find(s => s.id === storeId);
  const storeProducts = useMemo(() => products.filter(p => p.storeId === storeId), [products, storeId]);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredList = useMemo(() => {
    return storeProducts.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [storeProducts, search]);

  if (!store) {
    return (
      <div className="py-8 min-h-[40vh] bg-[var(--fb-bg)] flex flex-col items-center justify-center text-center px-6">
        <Compass className="h-16 w-16 text-[var(--fb-text-muted)] mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-4xl font-black text-[var(--fb-ink)] tracking-tight mb-4">
          Store not found
        </h1>
        <p className="text-lg font-medium text-[var(--fb-text-secondary)] max-w-lg mb-8">
          This campus merchant could not be found or may have been unlisted.
        </p>
        <Link to="/stores" className="btn-action-primary">
          Browse all stores
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Navigation Context */}
        <Link
          to="/stores"
          className="mb-8 inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to stores
        </Link>

        {/* Store Banner Hero */}
        <div className={`relative bg-black overflow-hidden mb-8 rounded-2xl shadow-2xl transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative h-[300px] md:h-[450px] w-full group">
            <img
              src={store.image}
              alt={store.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getStoreFallbackImage(store.category);
              }}
              className="h-full w-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

            {/* Status Badge */}
            <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md text-white px-3.5 py-2 rounded-lg flex items-center gap-2 border border-white/20">
              {store.isOpen ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Open Now</span>
                </>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Closed</span>
              )}
            </div>

            {/* Store Information */}
            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12">
              <span className="inline-block px-3 py-1.5 bg-[var(--fb-ink)] text-xs font-bold uppercase tracking-wider text-white mb-4 rounded-lg shadow-lg">
                {store.category.replace('cat-', '').replace('-', ' ')}
              </span>

              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter mb-4 leading-[0.95]">
                {store.name}
              </h1>

              <p className="max-w-3xl text-sm sm:text-base md:text-xl text-white/80 font-medium leading-relaxed">
                {store.description}
              </p>
            </div>
          </div>

          {/* Key Facts Strip */}
          <div className="bg-white/5 backdrop-blur-lg border-t border-white/10 px-6 py-4 md:px-8 flex flex-wrap items-center gap-8 md:gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Turnaround</p>
              <p className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-[var(--fb-blue)]" strokeWidth={2.5} /> ~{store.deliveryMinutes} min
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Location</p>
              <p className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <MapPin size={16} className="text-[var(--fb-blue)]" strokeWidth={2.5} /> {store.locationLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Status</p>
              <p className="text-sm md:text-base font-bold text-white">Campus Partner</p>
            </div>
          </div>
        </div>

        {/* Store Catalog Header & Search */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 border-b border-[var(--fb-border)] pb-6 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
              Catalog
            </h2>
            <p className="text-sm font-normal text-[var(--fb-text-secondary)] mt-1">
              {filteredList.length} items available from {store.name}
            </p>
          </div>

          {/* Search within Store */}
          <div className="relative group flex items-center border-b-2 border-[var(--fb-border)] hover:border-[var(--fb-ink)] focus-within:border-[var(--fb-ink)] transition-colors w-full md:w-96 pb-2">
            <Search className="h-5 w-5 text-[var(--fb-text-muted)] group-focus-within:text-[var(--fb-ink)] transition-colors mr-3" strokeWidth={2.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search in ${store.name}...`}
              className="w-full bg-transparent border-none text-base sm:text-lg font-medium outline-none text-[var(--fb-ink)] placeholder:text-[var(--fb-text-muted)] placeholder:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] px-2 cursor-pointer font-bold transition-colors"
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Store Products Grid */}
        {filteredList.length > 0 ? (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 transition-all duration-700 ease-out delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {filteredList.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center max-w-sm mx-auto bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6 mt-4 rounded-sm shadow-sm">
            <ShoppingBag className="h-12 w-12 text-[var(--fb-text-muted)] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-1">
              No matches found
            </h3>
            <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] font-normal mb-6">
              We couldn't find any items matching "{search}" in this store.
            </p>
            <button onClick={() => setSearch('')} className="btn-action-primary">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
