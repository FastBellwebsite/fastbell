import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Zap, ArrowUpDown, Compass } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import { getPopularProducts } from '@/selectors/productSelectors';
import { getNearbyStores } from '@/utils/location';
import { storage } from '@/services/storage';
import { FastBellSelect } from '@/components/FastBellSelect';

const popularChips = [
  'Cold Coffee',
  'A4 Notebook',
  'Chicken Shawarma',
  'Maggi Noodles',
  'Blue Pen',
  'Soap & Shampoo',
  'Laundry Wash'
];

export default function Shop() {
  const { products, stores } = useStore();
  const { user } = useAuth();
  const { orders } = useOrder();
  const categories = storage.getCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const campusId = user?.campusId || 'sns';

  // Campus scoping & Location-based 6 km service radius
  const campusStores = useMemo(
    () => stores.filter(s => s.campusId === campusId),
    [stores, campusId]
  );
  const nearbyStores = useMemo(
    () => getNearbyStores(user?.location, campusStores, 6),
    [user?.location, campusStores]
  );
  const nearbyStoreIds = useMemo(
    () => new Set(nearbyStores.map(s => s.id)),
    [nearbyStores]
  );
  const campusProducts = useMemo(
    () => products.filter(p => nearbyStoreIds.has(p.storeId)),
    [products, nearbyStoreIds]
  );

  const urlQ = searchParams.get('q') || '';
  const urlCat = searchParams.get('category') || 'all';
  const urlScope = searchParams.get('scope') || '';

  const [query, setQuery] = useState(urlQ);
  const [activeCategory, setActiveCategory] = useState(urlCat);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<'default' | 'popular' | 'price-asc' | 'price-desc'>(
    urlScope === 'popular' ? 'popular' : 'default'
  );

  // Sync state if URL changes externally
  useEffect(() => {
    if (urlQ !== query) setQuery(urlQ);
    if (urlCat !== activeCategory) setActiveCategory(urlCat);
    if (urlScope === 'popular' && sort !== 'popular') setSort('popular');
  }, [urlQ, urlCat, urlScope]);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val.trim()) next.set('q', val.trim());
      else next.delete('q');
      return next;
    });
  };

  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (catId !== 'all') next.set('category', catId);
      else next.delete('category');
      return next;
    });
  };

  const clearScope = () => {
    setSort('default');
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('scope');
      return next;
    });
  };

  const clearAllFilters = () => {
    setQuery('');
    setActiveCategory('all');
    setInStockOnly(false);
    setSort('default');
    setSearchParams({});
  };

  // Filter matching stores (scoped to nearby within service radius)
  const matchingStores = useMemo(() => {
    const q = query.toLowerCase().trim();
    return nearbyStores.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.locationLabel.toLowerCase().includes(q)
      );
    });
  }, [nearbyStores, query, activeCategory]);

  // Popular products map for sorting
  const popularRankMap = useMemo(() => {
    const popularList = getPopularProducts(campusProducts, orders);
    const map = new Map<string, number>();
    popularList.forEach((p, idx) => map.set(p.id, idx));
    return map;
  }, [campusProducts, orders]);

  // Filter matching products (scoped to campus)
  const matchingProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = campusProducts.filter(p => {
      const storeObj = campusStores.find(s => s.id === p.storeId);
      const storeName = storeObj?.name.toLowerCase() || '';

      const matchCat =
        activeCategory === 'all' ||
        p.category === activeCategory ||
        (p as any).categoryId === activeCategory;
      if (!matchCat) return false;

      if (inStockOnly && !p.isAvailable) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        storeName.includes(q)
      );
    });

    // Sort products
    if (sort === 'popular') {
      result = [...result].sort((a, b) => {
        const rankA = popularRankMap.has(a.id) ? popularRankMap.get(a.id)! : 999;
        const rankB = popularRankMap.has(b.id) ? popularRankMap.get(b.id)! : 999;
        return rankA - rankB;
      });
    } else if (sort === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    // Secondary rule: In full listing, available items always rank higher than out-of-stock items
    result = [...result].sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });

    return result;
  }, [campusProducts, campusStores, query, activeCategory, inStockOnly, sort, popularRankMap]);

  const hasActiveFilters =
    query.trim() !== '' ||
    activeCategory !== 'all' ||
    inStockOnly ||
    sort !== 'default' ||
    urlScope === 'popular';

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* Scope Banner if navigated from "See all" Popular */}
        {urlScope === 'popular' && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--fb-ink)] text-white px-4 py-3 border border-[var(--fb-ink)] rounded-xl">
            <div className="flex items-center gap-3">
              <Zap size={15} className="text-[var(--fb-brand)] shrink-0" strokeWidth={3} />
              <span className="text-xs font-bold tracking-wider uppercase">
                Showing Popular Campus Products
              </span>
            </div>
            <button
              onClick={clearScope}
              className="text-xs font-bold uppercase tracking-wider text-[var(--fb-text-muted)] hover:text-white cursor-pointer transition-colors"
            >
              Reset view ✕
            </button>
          </div>
        )}

        {/* Main Header & Search */}
        <div className={`transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--fb-border)] pb-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
                Marketplace
              </h1>
              <p className="text-sm font-normal text-[var(--fb-text-secondary)] mt-1">
                Explore campus inventory across partner stores
              </p>
            </div>
          </div>

          {/* Typographic Search Interface */}
          <div className="fb-search-bar mb-6">
            <Search className="h-4 w-4 text-[var(--fb-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search products, stores..."
              className="fb-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1 text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] cursor-pointer"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full xl:w-auto">
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                className={`fb-filter-chip ${activeCategory === 'all' ? 'fb-filter-chip-active' : ''}`}
              >
                <span>All</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`fb-filter-chip ${activeCategory === cat.id ? 'fb-filter-chip-active' : ''}`}
                >
                  {cat.icon ? (
                    <div className="h-4 w-4 bg-white/10 rounded flex items-center justify-center mr-1">
                      <img src={cat.icon} alt={cat.name} className="h-3.5 w-3.5 object-contain" />
                    </div>
                  ) : (
                    <Compass size={14} className="opacity-70 mr-1" />
                  )}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Utility Filters */}
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer bg-[var(--fb-surface)] border border-[var(--fb-border)] px-3 py-1.5 text-xs font-semibold text-[var(--fb-text-secondary)] select-none hover:border-[var(--fb-blue)] hover:text-[var(--fb-ink)] transition-colors rounded-lg">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="rounded-none cursor-pointer accent-[var(--fb-ink)]"
                />
                <span>In Stock Only</span>
              </label>

              <div className="flex items-center gap-2 bg-[var(--fb-surface)] border border-[var(--fb-border)] px-4 py-2.5 text-[var(--fb-ink)] hover:border-[var(--fb-ink)] transition-colors rounded-sm">
                <ArrowUpDown size={14} className="shrink-0" strokeWidth={2.5} />
                <div className="w-[150px]">
                  <FastBellSelect
                    options={[
                      { value: 'default', label: 'Relevance' },
                      { value: 'popular', label: 'Popular' },
                      { value: 'price-asc', label: 'Price (Low)' },
                      { value: 'price-desc', label: 'Price (High)' }
                    ]}
                    value={sort}
                    onChange={val => setSort(val as any)}
                    className="!bg-transparent !border-none !text-[10px] !font-bold !uppercase !tracking-widest"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Meta Banner */}
        <div className="flex items-center justify-between mb-8 border-b border-[var(--fb-border)] pb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--fb-text-secondary)]">
            Showing {matchingProducts.length} product{matchingProducts.length !== 1 ? 's' : ''}
            {matchingStores.length > 0 && ` & ${matchingStores.length} store${matchingStores.length !== 1 ? 's' : ''}`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-blue)] hover:text-[var(--fb-ink)] transition-colors cursor-pointer"
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* MATCHING STORES SECTION */}
        {matchingStores.length > 0 && query.trim() !== '' && (
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-4 tracking-tight border-b border-[var(--fb-border)] pb-2">
              Stores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {matchingStores.map(store => (
                <div key={store.id} className="h-full">
                  <StoreCard store={store} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS SECTION */}
        {matchingProducts.length > 0 ? (
          <div>
            {matchingStores.length > 0 && query.trim() !== '' && (
              <h2 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-4 tracking-tight border-b border-[var(--fb-border)] pb-2">
                Products
              </h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {matchingProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          matchingStores.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center bg-[var(--fb-surface)] border border-[var(--fb-border)] mt-8">
              <Search className="h-8 w-8 text-[var(--fb-text-muted)] mb-3" strokeWidth={2} />
              <h3 className="font-display text-xl font-bold text-[var(--fb-ink)] mb-2 tracking-tight">
                No matches found
              </h3>
              <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] font-normal mb-6">
                Try a different search term or category.
              </p>
              <button onClick={clearAllFilters} className="btn-action-primary">
                Clear filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
