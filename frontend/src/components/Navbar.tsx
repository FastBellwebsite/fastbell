import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Bell, ShoppingBag, User, LogOut, Search, MapPin, Store, Receipt, Heart, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const handleBump = () => {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 350);
      return () => clearTimeout(timer);
    };
    window.addEventListener('fastbell_cart_bump', handleBump);
    return () => window.removeEventListener('fastbell_cart_bump', handleBump);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(navSearch.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLocality =
    user?.location?.locality ||
    (user as any)?.addresses?.[0]?.locality ||
    (user as any)?.addresses?.[0]?.line ||
    'Campus Delivery';

  return (
    <nav className={`fixed top-0 w-full z-50 bg-[var(--fb-bg)] border-b border-[var(--fb-border)] transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}>
      <div className="page-shell">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14 md:h-16' : 'h-16 md:h-20'} gap-4`}>

          {/* Left: Brand + Campus Indicator */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/" className="flex flex-col group">
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--fb-ink)] leading-none transition-colors group-hover:text-[var(--fb-blue)]">
                Fast<span className="italic font-medium text-[var(--fb-blue)]">Bell</span>
              </span>
            </Link>

            {/* Campus Location - Typographic */}
            <div className="hidden lg:flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-0.5">
                Delivering to
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--fb-ink)] max-w-[200px] truncate">{navLocality}</span>
              </div>
            </div>
          </div>

          {/* Right Navigation & Commerce Actions */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {(!user || user.role === 'student') && (
              <div className="hidden lg:flex items-center gap-6 text-[15px] font-semibold text-[var(--fb-ink)] mr-2">
                <Link to="/stores" className="hover:text-[var(--fb-blue)] transition-colors">
                  Stores
                </Link>
                {user && (
                  <>
                    <Link to="/orders" className="hover:text-[var(--fb-blue)] transition-colors">
                      Orders
                    </Link>
                    <Link to="/favorites" className="hover:text-[var(--fb-blue)] transition-colors">
                      Favorites
                    </Link>
                  </>
                )}
                {!user && (
                  <>
                    <a href="/#how-it-works" onClick={(e) => handleAnchorClick(e, 'how-it-works')} className="hover:text-[var(--fb-blue)] transition-colors">
                      How It Works
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Mobile Search Icon */}
            {(!user || user.role === 'student') && (
              <Link
                to="/search"
                className="md:hidden text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors"
                aria-label="Search"
              >
                <Search size={20} strokeWidth={2} />
              </Link>
            )}

            <ThemeToggle />

            {/* Student Cart - Typographic */}
            {(!user || user.role === 'student') && (
              <Link
                to="/cart"
                className={`group flex items-center gap-2 text-[15px] font-semibold text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-all duration-200 ${
                  cartBump ? 'scale-105 text-[var(--fb-blue)]' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">Cart</span>
                  <div className="relative">
                    <ShoppingBag
                      size={18}
                      strokeWidth={2}
                      className={`transition-transform duration-200 group-hover:-translate-y-0.5 ${
                        cartBump ? '-translate-y-0.5 text-[var(--fb-blue)]' : ''
                      }`}
                    />
                    {cartCount > 0 && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 bg-[var(--fb-blue)] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm transition-transform duration-200 ${
                          cartBump ? 'scale-125' : 'scale-100'
                        }`}
                      >
                        {cartCount}
                      </span>
                    )}
                  </div>
                </div>
                {cartCount > 0 && (
                  <span
                    className={`hidden sm:inline-block font-display font-bold text-xs bg-[var(--fb-surface)] border text-[var(--fb-ink)] px-2 py-0.5 rounded-lg shadow-sm transition-all duration-200 ${
                      cartBump
                        ? 'border-[var(--fb-blue)] text-[var(--fb-blue)] scale-105 shadow-md'
                        : 'border-[var(--fb-border)] group-hover:border-[var(--fb-blue)] group-hover:text-[var(--fb-blue)]'
                    }`}
                  >
                    ₹{cartTotal}
                  </span>
                )}
              </Link>
            )}

            {/* Auth / Account Profile - Typographic */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors cursor-pointer"
                >
                  <span className="hidden md:inline">Profile</span>
                  <User size={18} strokeWidth={2} className="md:hidden" />
                  <ChevronDown size={14} className={`hidden md:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-4 w-48 bg-[var(--fb-surface)] border border-[var(--fb-border)] shadow-md rounded-xl overflow-hidden z-50 slide-up">
                      <div className="px-4 py-3 border-b border-[var(--fb-border)] bg-[var(--fb-bg)]">
                        <p className="text-sm font-bold text-[var(--fb-ink)] truncate">{user.name}</p>
                        <p className="text-xs font-medium text-[var(--fb-text-secondary)] truncate mt-0.5">{user.email}</p>
                      </div>

                      <div className="py-2">
                        {user.role === 'student' && (
                          <>
                            <Link
                              to="/profile"
                              onClick={() => setShowProfileMenu(false)}
                              className="block px-4 py-2 text-sm font-medium text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] hover:bg-[var(--fb-blue-pale)] transition-colors"
                            >
                              My Profile
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setShowProfileMenu(false)}
                              className="block px-4 py-2 text-sm font-medium text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] hover:bg-[var(--fb-blue-pale)] transition-colors"
                            >
                              Orders & Reorder
                            </Link>
                          </>
                        )}
                        {user.role === 'vendor' && (
                          <Link
                            to="/vendor"
                            onClick={() => setShowProfileMenu(false)}
                            className="block px-4 py-2 text-sm font-medium text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] hover:bg-[var(--fb-blue-pale)] transition-colors"
                          >
                            Store Dashboard
                          </Link>
                        )}
                        {user.role === 'delivery' && (
                          <Link
                            to="/delivery"
                            onClick={() => setShowProfileMenu(false)}
                            className="block px-4 py-2 text-sm font-medium text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] hover:bg-[var(--fb-blue-pale)] transition-colors"
                          >
                            Delivery Portal
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="block px-4 py-2 text-sm font-medium text-[var(--fb-text-secondary)] hover:text-[var(--fb-blue)] hover:bg-[var(--fb-blue-pale)] transition-colors"
                          >
                            Admin Command
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-[var(--fb-border)]"></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-[var(--fb-danger)] hover:bg-[var(--fb-danger)] hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-[var(--fb-ink)] hover:text-[var(--fb-blue)] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/stores"
                  className="hidden sm:inline-flex btn-primary"
                >
                  Order Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
