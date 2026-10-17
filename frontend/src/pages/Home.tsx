import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  ShoppingBag,
  MapPin,
  ChevronRight,
  Store,
  CheckCircle2,
  BookOpen,
  Coffee,
  ShoppingBasket,
  Shirt,
  HeartPulse
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import {
  getAvailableProductsForUser,
  getCuratedDiscoveryProducts,
  getOrderAgainProducts
} from '@/selectors/productSelectors';
import { getNearbyStores } from '@/utils/location';
import { storage } from '@/services/storage';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import { Product } from '@/types';

const quickSearchChips = [
  'Cold Coffee',
  'Masala Dosa',
  'A4 Notebook',
  'Laundry',
  'Maggi'
];

export default function Home() {
  const navigate = useNavigate();
  const [homeSearch, setHomeSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const { products, stores } = useStore();
  const { user } = useAuth();
  const { orders } = useOrder();
  const categories = storage.getCategories();

  useEffect(() => {
    setMounted(true);
  }, []);

  const campusId = user?.campusId || 'sns';

  // 1. Campus stores & nearby filter
  const campusStores = useMemo(
    () => stores.filter(s => !s.campusId || s.campusId === campusId),
    [stores, campusId]
  );

  const nearbyStores = useMemo(
    () => getNearbyStores(user?.location, campusStores, 6),
    [user?.location, campusStores]
  );

  // 2. Canonical available products for the user (scoped to campus, service radius, and non-orphaned)
  const availableProducts = useMemo(
    () => getAvailableProductsForUser(products, stores, user, categories),
    [products, stores, user, categories]
  );

  // 3. Order Again subset — ONLY for users with actual order history
  const orderAgainProducts = useMemo(() => {
    return getOrderAgainProducts(availableProducts, orders, user, 6);
  }, [availableProducts, orders, user]);

  // 4. Discovery subset for "Available Around You" rail (curated 6–8 items from canonical catalog)
  const homeDiscoveryProducts = useMemo(() => {
    return getCuratedDiscoveryProducts(availableProducts, orders, user, 8);
  }, [availableProducts, orders, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      navigate(`/shop?q=${encodeURIComponent(homeSearch.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-[var(--fb-bg)] text-[var(--fb-ink)] font-sans pb-16 selection:bg-[var(--fb-blue)] selection:text-white pt-4 md:pt-6">
      
      {/* 1. HERO / COMMERCE GATEWAY SECTION */}
      <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 mb-8 md:mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-[280px] md:min-h-[320px]">
          
          {/* LEFT ZONE: Greeting, Headline, Supporting Text, Search & Suggested Chips (Cols 1-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-6">
            
            {/* Greeting & Location Context */}
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fb-blue)]">
                  {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </span>
                <span className="text-xs text-[var(--fb-text-muted)] font-medium">
                  • Delivering to {(user as any)?.address?.line || (user as any)?.addresses?.[0]?.line || user?.location?.address || user?.location?.locality || (user as any)?.deliveryLocation || 'your saved campus address'}
                </span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.08] text-[var(--fb-ink)] mb-3">
              What do you <span className="italic font-medium text-[var(--fb-blue)]">need?</span>
            </h1>

            <p className="text-xs sm:text-sm font-normal text-[var(--fb-text-secondary)] mb-5 max-w-md leading-relaxed">
              Food, essentials and services from nearby campus partners.
            </p>

            {/* Clean Commerce Search Surface with Live Responsive Feedback */}
            <div className="relative w-full max-w-xl mb-3.5">
              <form onSubmit={handleSearchSubmit} className="relative w-full group">
                <div className="relative flex items-center border-b-2 border-[var(--fb-ink)] focus-within:border-[var(--fb-blue)] transition-colors py-2">
                  <input
                    type="text"
                    value={homeSearch}
                    onChange={e => setHomeSearch(e.target.value)}
                    placeholder="Search food, groceries, stationery..."
                    className="w-full bg-transparent border-none text-sm sm:text-base font-medium tracking-tight outline-none placeholder:text-[var(--fb-text-muted)] text-[var(--fb-ink)] pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors p-1 cursor-pointer"
                    aria-label="Search"
                  >
                    <Search size={20} strokeWidth={2.4} />
                  </button>
                </div>
              </form>

              {/* Instant Live Search Results Popover */}
              {homeSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--fb-surface)] border border-[var(--fb-border)] shadow-lg rounded-xl overflow-hidden z-50 slide-up">
                  <div className="p-2 border-b border-[var(--fb-border)] bg-[var(--fb-bg)] flex items-center justify-between text-xs text-[var(--fb-text-muted)]">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Quick Matches</span>
                    <button
                      onClick={() => navigate(`/shop?q=${encodeURIComponent(homeSearch.trim())}`)}
                      className="text-[var(--fb-blue)] hover:underline font-bold text-[11px]"
                    >
                      View all in Shop →
                    </button>
                  </div>

                  {availableProducts.filter(p => p.name.toLowerCase().includes(homeSearch.toLowerCase().trim())).length > 0 ? (
                    <div className="divide-y divide-[var(--fb-border)] max-h-64 overflow-y-auto">
                      {availableProducts
                        .filter(p => p.name.toLowerCase().includes(homeSearch.toLowerCase().trim()))
                        .slice(0, 4)
                        .map(p => (
                          <div
                            key={p.id}
                            onClick={() => navigate(`/product/${p.id}`)}
                            className="flex items-center justify-between p-2.5 hover:bg-[var(--fb-bg)] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-9 h-9 object-cover rounded-md bg-[var(--fb-bg)] shrink-0 border border-[var(--fb-border)]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/products/classmate-notebook.webp';
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-[var(--fb-text-muted)] truncate">
                                  {stores.find(s => s.id === p.storeId)?.name || 'Campus Store'}
                                </p>
                              </div>
                            </div>
                            <span className="font-display font-black text-xs sm:text-sm text-[var(--fb-ink)] shrink-0 pl-2">
                              ₹{p.price}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--fb-text-muted)]">
                      No exact product matches. Press Enter or click "View all" to search catalog.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Suggested Searches */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--fb-text-secondary)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
                SUGGESTED:
              </span>
              {quickSearchChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => navigate(`/shop?q=${encodeURIComponent(chip)}`)}
                  className="text-xs font-medium text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors hover:underline cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

          </div>

          {/* RIGHT ZONE: REFINED FASTBELL BRANDING COMPOSITION (Cols 8-12) */}
          <div className="lg:col-span-5 relative w-full h-[260px] sm:h-[280px] lg:h-[300px] flex items-center justify-center select-none">
            
            {/* Subtle Ambient Background Circles */}
            <div className="absolute w-56 sm:w-64 h-56 sm:h-64 rounded-full border border-[var(--fb-blue)]/15 bg-gradient-to-tr from-[var(--fb-blue)]/5 to-transparent pointer-events-none -z-0" />
            <div className="absolute w-72 h-72 rounded-full border border-[var(--fb-border)]/40 pointer-events-none -z-0" />
            
            {/* COMPONENT 1: Center Item — Stationery */}
            <div 
              onClick={() => navigate('/category/cat-stationery')}
              className="absolute z-20 w-36 sm:w-40 bg-[var(--fb-surface)] border border-[var(--fb-border)] p-2 shadow-lg hover:shadow-xl transform -rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-blue)]">
                  Stationery
                </span>
                <span className="text-[11px] font-bold text-[var(--fb-ink)] font-display">₹75</span>
              </div>
              <div className="w-full h-16 sm:h-20 bg-[var(--fb-bg)] border border-[var(--fb-border)]/40 mb-1 overflow-hidden">
                <img 
                  src="/products/classmate-notebook.webp" 
                  alt="Stationery" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                Classmate Notebook
              </p>
            </div>

            {/* COMPONENT 2: Top-Left Item — Food & Snacks */}
            <div 
              onClick={() => navigate('/category/cat-food')}
              className="absolute top-1 sm:top-2 left-2 sm:left-4 z-10 w-28 sm:w-32 bg-[var(--fb-surface)] border border-[var(--fb-border)] p-1.5 shadow-md hover:shadow-lg transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Food
                </span>
                <span className="text-[10px] font-bold text-[var(--fb-ink)] font-display">₹60</span>
              </div>
              <div className="w-full h-12 bg-[var(--fb-bg)] border border-[var(--fb-border)]/40 mb-0.5 overflow-hidden">
                <img 
                  src="/products/cheese-grilled-sandwich.webp" 
                  alt="Food" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                Canteen Snacks
              </p>
            </div>

            {/* COMPONENT 3: Top-Right Item — Groceries */}
            <div 
              onClick={() => navigate('/category/cat-grocery')}
              className="absolute top-1 sm:top-3 right-2 sm:right-4 z-10 w-28 sm:w-32 bg-[var(--fb-surface)] border border-[var(--fb-border)] p-1.5 shadow-md hover:shadow-lg transform rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Groceries
                </span>
                <span className="text-[10px] font-bold text-[var(--fb-ink)] font-display">₹28</span>
              </div>
              <div className="w-full h-12 bg-[var(--fb-bg)] border border-[var(--fb-border)]/40 mb-0.5 overflow-hidden">
                <img 
                  src="/products/amul-milk.webp" 
                  alt="Groceries" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                Pantry Essentials
              </p>
            </div>

            {/* COMPONENT 4: Bottom-Left Item — Laundry */}
            <div 
              onClick={() => navigate('/category/cat-laundry')}
              className="absolute bottom-2 sm:bottom-3 left-4 sm:left-8 z-25 w-28 sm:w-32 bg-[var(--fb-surface)] border border-[var(--fb-border)] p-1.5 shadow-md hover:shadow-lg transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Laundry
                </span>
                <span className="text-[10px] font-bold text-[var(--fb-ink)] font-display">₹120</span>
              </div>
              <div className="w-full h-12 bg-[var(--fb-bg)] border border-[var(--fb-border)]/40 mb-0.5 overflow-hidden">
                <img 
                  src="/products/daily-wash.webp" 
                  alt="Laundry" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                Wash & Iron
              </p>
            </div>

            {/* COMPONENT 5: Bottom-Right Item — Personal Care */}
            <div 
              onClick={() => navigate('/category/cat-care')}
              className="absolute bottom-2 sm:bottom-3 right-4 sm:right-8 z-25 w-28 sm:w-32 bg-[var(--fb-surface)] border border-[var(--fb-border)] p-1.5 shadow-md hover:shadow-lg transform -rotate-4 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-0.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Personal Care
                </span>
                <span className="text-[10px] font-bold text-[var(--fb-ink)] font-display">₹99</span>
              </div>
              <div className="w-full h-12 bg-[var(--fb-bg)] border border-[var(--fb-border)]/40 mb-0.5 overflow-hidden">
                <img 
                  src="/products/dettol-sanitizer.webp" 
                  alt="Care" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-bold text-[var(--fb-ink)] truncate group-hover:text-[var(--fb-blue)] transition-colors">
                Dorm Hygiene
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 2. COMPACT COMMERCE CATEGORY TILES */}
      <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--fb-border)]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)]">
              BROWSE
            </span>
            <span className="font-display font-bold text-sm text-[var(--fb-ink)] tracking-tight">
              Categories
            </span>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] transition-colors flex items-center gap-1"
          >
            All Products <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const thumbnail =
              cat.id === 'cat-food'
                ? '/products/cheese-grilled-sandwich.webp'
                : cat.id === 'cat-grocery'
                ? '/products/amul-milk.webp'
                : cat.id === 'cat-stationery'
                ? '/products/classmate-notebook.webp'
                : cat.id === 'cat-laundry'
                ? '/products/daily-wash.webp'
                : '/products/dettol-sanitizer.webp';

            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${cat.id}`)}
                className="group relative flex items-center gap-3 p-2.5 sm:p-3 bg-[var(--fb-surface)] border border-[var(--fb-border)] hover:border-[var(--fb-blue)] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 text-left cursor-pointer rounded-sm"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-[var(--fb-bg)] border border-[var(--fb-border)] overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-display font-bold text-xs sm:text-sm text-[var(--fb-ink)] group-hover:text-[var(--fb-blue)] truncate transition-colors">
                    {cat.name}
                  </span>
                  <span className="block text-[10px] text-[var(--fb-text-muted)] truncate capitalize">
                    {cat.description || cat.slug}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. MARKETPLACE CONTENT RAILS */}
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 flex flex-col gap-10">
        
        {/* ORDER AGAIN (ONLY rendered if the user has legitimate past orders) */}
        {orderAgainProducts.length > 0 && (
          <section className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--fb-border)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                  PREVIOUS PURCHASES
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight flex items-center gap-2">
                  <Clock className="text-[var(--fb-blue)]" size={18} strokeWidth={2.5} /> Order Again
                </h2>
              </div>
              <Link to="/orders" className="text-xs font-bold text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] transition-colors flex items-center gap-1">
                Past Orders <ArrowRight size={13} />
              </Link>
            </div>
            
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth snap-x snap-mandatory">
                {orderAgainProducts.map(product => (
                  <div key={product.id} className="w-[190px] sm:w-[220px] shrink-0 snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* Subtle edge fade mask to communicate "There is more here" */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-[var(--fb-bg)] to-transparent hidden sm:block opacity-75" />
            </div>
          </section>
        )}

        {/* POPULAR ON CAMPUS / AVAILABLE AROUND YOU */}
        {homeDiscoveryProducts.length > 0 ? (
          <section className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                  Marketplace Discovery
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                  Available Around You
                  <span className="hidden sm:inline font-normal text-xs text-[var(--fb-text-muted)] ml-2">
                    • Featured Around You
                  </span>
                </h2>
              </div>
              <Link to="/shop" className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors flex items-center gap-1">
                EXPLORE ALL <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {homeDiscoveryProducts.map(product => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                  Marketplace Discovery
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                  Available Around You
                  <span className="hidden sm:inline font-normal text-xs text-[var(--fb-text-muted)] ml-2">
                    • Featured Around You
                  </span>
                </h2>
              </div>
            </div>
            <div className="p-8 text-center text-sm font-medium text-[var(--fb-text-muted)] border border-dashed border-[var(--fb-border)] rounded-sm bg-[var(--fb-surface)]">
              <p className="font-display text-base font-bold text-[var(--fb-ink)] mb-1">
                No stores within 6 km of this location
              </p>
              <p className="text-xs text-[var(--fb-text-secondary)] max-w-md mx-auto">
                Your current delivery location has no active campus stores in range. Switch to a campus location to browse active merchants and order.
              </p>
            </div>
          </section>
        )}

        {/* CAMPUS STORES & OUTLETS */}
        {nearbyStores.length > 0 ? (
          <section className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                  CAMPUS MERCHANTS
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                  Stores Around You
                </h2>
              </div>
              <Link to="/stores" className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors flex items-center gap-1">
                EXPLORE ALL <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyStores.slice(0, 4).map(store => (
                <div key={store.id} className="h-full">
                  <StoreCard store={store} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className={`transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                  CAMPUS MERCHANTS
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--fb-ink)] tracking-tight">
                  Stores Around You
                </h2>
              </div>
            </div>
            <div className="p-8 text-center text-sm font-medium text-[var(--fb-text-muted)] border border-dashed border-[var(--fb-border)] rounded-sm bg-[var(--fb-surface)]">
              <p className="font-display text-base font-bold text-[var(--fb-ink)] mb-1">
                No stores within 6 km of this location
              </p>
              <p className="text-xs text-[var(--fb-text-secondary)] max-w-md mx-auto">
                Your current delivery location has no active campus stores in range. Switch to a campus location to order.
              </p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
