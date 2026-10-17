import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home, Store, Receipt, ShoppingBag, User, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function StudentLayout() {
  const { cartCount, cartTotal } = useCart();
  const location = useLocation();

  const isCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/stores', icon: Store, label: 'Stores' },
    { to: '/orders', icon: Receipt, label: 'Orders' },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: cartCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[var(--fb-bg)] pb-[76px] md:pb-0 font-sans">
      <Navbar />
      <main className="flex-1 w-full pt-16 md:pt-20">
        <div key={location.pathname} className="fade-in">
          <Outlet />
        </div>
      </main>
      <div className="hidden md:block"><Footer /></div>

      {/* Floating Quick Cart Bar (Appears when cart has items and user isn't on cart/checkout) */}
      {!isCartOrCheckout && cartCount > 0 && (
        <div className="fixed bottom-[74px] md:bottom-6 left-4 right-4 md:left-auto md:right-8 z-40 max-w-sm md:w-80 ml-auto slide-up">
          <Link
            to="/cart"
            className="flex items-center justify-between p-3.5 bg-[var(--fb-blue)] hover:bg-[var(--fb-blue-dark)] text-white rounded-xl shadow-[0_4px_16px_rgba(49,91,255,0.3)] transition-all duration-300 ease-out active:scale-95 hover:-translate-y-1 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs transition-colors group-hover:bg-white/30">
                {cartCount}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  {cartCount === 1 ? '1 item added' : `${cartCount} items added`}
                </span>
                <span className="font-display font-extrabold text-sm">
                  ₹{cartTotal}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-lg group-hover:bg-white/25 transition-colors">
              <span>View Cart</span>
              <ArrowRight size={14} className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      )}

      {/* Mobile Bottom Dock (App-Like Quick Commerce) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--fb-border)] bg-white/95 backdrop-blur-lg pb-safe pt-1.5 pb-2 md:hidden shadow-lg">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-200 ${
                isActive
                  ? 'text-[var(--fb-blue)] font-bold'
                  : 'text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)] font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ease-out ${isActive ? 'bg-[var(--fb-blue-soft)] scale-110' : ''}`}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  {badge && badge > 0 ? (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--fb-blue)] px-1 text-[10px] font-black text-white shadow-sm scale-in">
                      {badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-[var(--fb-blue)]' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
