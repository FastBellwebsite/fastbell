import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storage } from '@/services/storage';
import ProductCard from '@/components/ProductCard';
import { Search, X, ArrowLeft, ArrowUpDown, Compass } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { FastBellSelect } from '@/components/FastBellSelect';

export default function CategoryPage() {
  const { products, stores } = useStore();
  const { user } = useAuth();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const categories = storage.getCategories();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const campusId = user?.campusId || 'sns';

  const category = categories.find(c => c.id === categoryId || c.slug === categoryId) || {
    id: categoryId || 'all',
    name: 'Campus Items',
    description: 'Explore campus essentials',
    icon: 'Utensils',
    slug: categoryId
  };

  // Stores in this category for this campus
  const categoryStores = useMemo(() => {
    return stores.filter(s => s.campusId === campusId && s.category === category.id);
  }, [stores, campusId, category.id]);

  // Products in this category for this campus
  const categoryProducts = useMemo(() => {
    const campusStoreIds = new Set(stores.filter(s => s.campusId === campusId).map(s => s.id));

    let list = products.filter(p => {
      const matchCat = p.category === category.id || (p as any).categoryId === category.id || p.category === category.slug;
      if (!matchCat) return false;
      if (!campusStoreIds.has(p.storeId)) return false;
      if (inStockOnly && !p.isAvailable) return false;
      if (!query.trim()) return true;

      const q = query.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });

    // Sort available items first
    list = [...list].sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, stores, campusId, category.id, category.slug, inStockOnly, query, sort]);

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] pb-12 pt-6 md:pt-8 selection:bg-[var(--fb-blue)] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* Navigation & Context */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Editorial Header */}
        <div className={`mb-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--fb-border)] pb-8 relative overflow-hidden group">
            
            {/* Category Visual Artwork */}
            <div className="absolute right-0 top-0 bottom-0 w-[50%] md:w-[40%] overflow-hidden mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700 ease-out opacity-20 group-hover:opacity-40 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--fb-bg)] via-transparent to-transparent z-10" />
              <img 
                src={
                  category.id === 'cat-food' ? '/products/cheese-grilled-sandwich.webp' :
                  category.id === 'cat-grocery' ? '/products/amul-milk.webp' :
                  category.id === 'cat-stationery' ? '/products/classmate-notebook.webp' :
                  category.id === 'cat-laundry' ? '/products/daily-wash.webp' :
                  '/products/dettol-sanitizer.webp'
                }
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" 
                alt={category.name} 
              />
            </div>

            <div className="relative z-10 w-full md:w-auto">
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-[var(--fb-ink)] tracking-tighter leading-[0.95]">
                {category.name}
              </h1>
              <div className="flex items-center gap-3 mt-4 text-xs sm:text-sm font-semibold text-[var(--fb-text-secondary)]">
                <span>{categoryProducts.length} items available</span>
                {categoryStores.length > 0 && (
                  <>
                    <span className="text-[var(--fb-border)]">|</span>
                    <Link to={`/stores?category=${category.id}`} className="hover:text-[var(--fb-blue)] transition-colors underline font-bold">
                      {categoryStores.length} campus store{categoryStores.length > 1 ? 's' : ''}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Sibling Categories (Typographic list) */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar md:pb-0">
              {categories.map(c => {
                const isActive = c.id === category.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/category/${c.id}`)}
                    className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer pb-1 border-b-2 ${
                      isActive
                        ? 'border-[var(--fb-ink)] text-[var(--fb-ink)]'
                        : 'border-transparent text-[var(--fb-text-secondary)] hover:text-[var(--fb-ink)]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Typographic Search Input */}
          <div className="relative group flex items-center border-b-2 border-[var(--fb-border)] hover:border-[var(--fb-ink)] focus-within:border-[var(--fb-ink)] transition-colors flex-1 max-w-xl pb-2">
            <Search className="h-5 w-5 text-[var(--fb-text-muted)] group-focus-within:text-[var(--fb-ink)] transition-colors mr-3" strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full bg-transparent border-none text-base sm:text-lg font-medium outline-none text-[var(--fb-ink)] placeholder:text-[var(--fb-text-muted)] placeholder:text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] px-2 cursor-pointer font-bold transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer bg-[var(--fb-surface)] border border-[var(--fb-border)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] select-none hover:border-[var(--fb-ink)] transition-colors rounded-sm">
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
              <div className="w-[140px]">
                <FastBellSelect
                  options={[
                    { value: 'default', label: 'Relevance' },
                    { value: 'price-asc', label: 'Price (Low)' },
                    { value: 'price-desc', label: 'Price (High)' }
                  ]}
                  value={sort}
                  onChange={val => setSort(val as any)}
                  className="!bg-transparent !border-none !text-xs !font-bold !uppercase !tracking-wider"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {categoryProducts.length > 0 ? (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 transition-all duration-700 ease-out delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {categoryProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto bg-[var(--fb-surface)] border border-[var(--fb-border)] mt-4">
            <Compass className="h-12 w-12 text-[var(--fb-text-muted)] mb-4" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-1">
              No matches found
            </h3>
            <p className="text-xs sm:text-sm font-normal text-[var(--fb-text-secondary)] mb-6 max-w-sm">
              {query ? `No items in ${category.name} matched "${query}".` : 'No items currently listed in this category.'}
            </p>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="btn-action-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
