import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store as StoreIcon, Search, X, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { getNearbyStores } from '@/utils/location';
import { storage } from '@/services/storage';
import StoreCard from '@/components/StoreCard';

export default function Stores() {
  const { stores } = useStore();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const campusId = user?.campusId || 'sns';
  const categories = storage.getCategories();

  const urlCategory = searchParams.get('category') || 'all';
  const urlOpenOnly = searchParams.get('open') === 'true';
  const urlQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(urlQ);
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [openOnly, setOpenOnly] = useState(urlOpenOnly);

  // Sync state if URL changes externally
  useEffect(() => {
    if (urlQ !== query) setQuery(urlQ);
    if (urlCategory !== categoryFilter) setCategoryFilter(urlCategory);
    if (urlOpenOnly !== openOnly) setOpenOnly(urlOpenOnly);
  }, [urlQ, urlCategory, urlOpenOnly]);

  // Campus-scoped stores & Location-based 6 km radius selector
  const campusStores = useMemo(
    () => stores.filter(s => s.campusId === campusId),
    [stores, campusId]
  );

  const nearbyStores = useMemo(
    () => getNearbyStores(user?.location, campusStores, 6),
    [user?.location, campusStores]
  );

  const updateFilters = (newQ: string, newCat: string, newOpen: boolean) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newQ.trim()) next.set('q', newQ.trim());
      else next.delete('q');

      if (newCat !== 'all') next.set('category', newCat);
      else next.delete('category');

      if (newOpen) next.set('open', 'true');
      else next.delete('open');

      return next;
    });
  };

  const handleSearchChange = (val: string) => {
    setQuery(val);
    updateFilters(val, categoryFilter, openOnly);
  };

  const handleCategorySelect = (catId: string) => {
    setCategoryFilter(catId);
    updateFilters(query, catId, openOnly);
  };

  const handleOpenToggle = (checked: boolean) => {
    setOpenOnly(checked);
    updateFilters(query, categoryFilter, checked);
  };

  const clearAllFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setOpenOnly(false);
    setSearchParams({});
  };

  const filteredStores = useMemo(() => {
    const q = query.toLowerCase().trim();
    return nearbyStores.filter(s => {
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      if (!matchCat) return false;

      if (openOnly && !s.isOpen) return false;

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.locationLabel.toLowerCase().includes(q)
      );
    });
  }, [nearbyStores, categoryFilter, openOnly, query]);

  const activeCategoryObj = categories.find(c => c.id === categoryFilter);
  const hasActiveFilters = query.trim() !== '' || categoryFilter !== 'all' || openOnly;

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 font-sans selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* 1. Header & Intro */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">
                Stores
              </h1>
              <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] mt-1 font-normal max-w-xl">
                {activeCategoryObj
                  ? `Discover ${activeCategoryObj.name.toLowerCase()} merchant partners across campus with under 15-minute delivery.`
                  : 'Discover verified campus stores and merchant partners with under 15-minute delivery.'}
              </p>
            </div>

            {/* Quick Open Now Switch */}
            <button
              type="button"
              onClick={() => handleOpenToggle(!openOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border self-start sm:self-auto shrink-0 ${
                openOnly
                  ? 'bg-[var(--fb-blue)] text-white border-[var(--fb-blue)] shadow-2xs'
                  : 'bg-[var(--fb-surface)] border-[var(--fb-border)] text-[var(--fb-text-secondary)] hover:border-[var(--fb-blue)] hover:text-[var(--fb-ink)]'
              }`}
            >
              <Clock size={13} className={openOnly ? 'animate-pulse text-white' : ''} />
              <span>Open Stores Only</span>
              {openOnly && <CheckCircle2 size={12} className="text-white" />}
            </button>
          </div>

          {/* 2. Store Search Input */}
          <div className="fb-search-bar mt-4 mb-3">
            <Search className="h-4 w-4 text-[var(--fb-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search stores by name, location, cuisine, laundry..."
              className="fb-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1 text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] cursor-pointer"
                aria-label="Clear store search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* 3. Category Filter Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-[var(--fb-border)]">
            <button
              type="button"
              onClick={() => handleCategorySelect('all')}
              className={`fb-filter-chip ${categoryFilter === 'all' ? 'fb-filter-chip-active' : ''}`}
            >
              All Stores ({campusStores.length})
            </button>

            {categories.map(cat => {
              const count = campusStores.filter(s => s.category === cat.id).length;
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`fb-filter-chip ${isSelected ? 'fb-filter-chip-active' : ''}`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto text-xs font-bold text-[var(--fb-danger)] hover:underline whitespace-nowrap px-2 cursor-pointer shrink-0"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* 4. Section Heading & Store Count */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mt-6 mb-5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
              {activeCategoryObj ? `${activeCategoryObj.name} Stores` : 'Nearby Stores'}
            </h2>
            <span className="text-sm sm:text-base font-semibold text-[var(--fb-text-muted)]">
              ({filteredStores.length})
            </span>
            {openOnly && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--fb-success)] ml-2">
                • Open now
              </span>
            )}
          </div>
          {query.trim() && (
            <span className="text-xs sm:text-sm text-[var(--fb-text-secondary)]">
              Matching &ldquo;{query.trim()}&rdquo;
            </span>
          )}
        </div>

        {/* 5. Stores Grid */}
        {filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-[var(--fb-surface)] rounded-2xl border border-[var(--fb-border)] p-8 max-w-lg mx-auto shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-[var(--fb-bg)] border border-[var(--fb-border)] flex items-center justify-center mx-auto mb-3 text-[var(--fb-text-muted)]">
              <StoreIcon size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-1">
              No matching stores found
            </h3>
            <p className="text-xs text-[var(--fb-text-secondary)] mb-4">
              {openOnly
                ? 'No stores matching your filter are currently open right now.'
                : 'Try adjusting your search or category filter.'}
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn-primary text-xs py-2 px-4 rounded-xl cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
