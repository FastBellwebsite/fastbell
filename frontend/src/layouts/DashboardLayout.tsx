import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Store, Users, LogOut, ShoppingBag, UserCircle, LayoutGrid, Package } from 'lucide-react';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';

const roleConfig: Record<Exclude<Role, 'student'>, { title: string; links: { to: string; label: string; icon: typeof LayoutGrid }[]; accent: string }> = {
  vendor: {
    title: 'Vendor Center', accent: 'bg-[var(--fb-ink)] border-b-4 border-[var(--fb-blue)]', links: [
      { to: '/vendor', label: 'Overview', icon: LayoutGrid }, { to: '/vendor/products', label: 'Products', icon: Store }, { to: '/vendor/orders', label: 'Orders', icon: Package }, { to: '/vendor/profile', label: 'Settings', icon: UserCircle },
    ]
  },
  delivery: {
    title: 'Delivery Portal', accent: 'bg-[var(--fb-ink)] border-b-4 border-[var(--fb-blue)]', links: [
      { to: '/delivery', label: 'Dashboard', icon: LayoutGrid }, { to: '/delivery/orders', label: 'Active Jobs', icon: Package }, { to: '/delivery/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  admin: {
    title: 'Admin Console', accent: 'bg-[var(--fb-ink)] border-b-4 border-[var(--fb-blue)]', links: [
      { to: '/admin', label: 'Metrics', icon: LayoutGrid }, { to: '/admin/users', label: 'Users', icon: Users }, { to: '/admin/vendors', label: 'Vendors', icon: Store }, { to: '/admin/products', label: 'Products', icon: Store }, { to: '/admin/orders', label: 'All Orders', icon: Package },
    ]
  },
};

export default function DashboardLayout({ role }: { role: Exclude<Role, 'student'> }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cfg = roleConfig[role];

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[var(--fb-bg)] text-[var(--fb-text)] font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] flex-col border-r border-[var(--fb-border)] bg-[var(--fb-surface)] shadow-sm lg:flex">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--fb-border)]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] shadow-sm"><ShoppingBag className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display font-extrabold text-[var(--fb-ink)] tracking-tight leading-none text-xl">FastBell</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--fb-blue)] mt-1 block">{cfg.title}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {cfg.links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${role}`}
              className={({ isActive }) => `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] shadow-sm' : 'text-[var(--fb-text-muted)] hover:bg-[var(--fb-surface-elevated)] hover:text-[var(--fb-ink)] border border-transparent hover:border-[var(--fb-border)]'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--fb-border)]">
          <button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--fb-ink)] hover:bg-[#FFEBEE] hover:text-[var(--fb-danger)] dark:hover:bg-red-950/40 transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col w-full min-w-0">

        {/* Top Header */}
        <header className={`${cfg.accent} flex items-center justify-between px-6 py-5 text-white lg:px-10`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-0.5">Welcome back</p>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{user.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white/90">{user.email}</p>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{role}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 font-display text-lg font-bold shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-6 lg:p-10 w-full max-w-[1400px] mx-auto">
          <div key={location.pathname} className="fade-in">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation Footer */}
        <nav className="sticky bottom-0 z-40 flex items-center justify-around border-t border-[var(--fb-border)] bg-[var(--fb-surface)]/95 backdrop-blur-md pb-safe pt-2 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {cfg.links.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${role}`}
              className={({ isActive }) => `flex flex-col items-center gap-1.5 px-2 py-2 text-[10px] font-bold tracking-wide uppercase transition-colors ${isActive ? 'text-[var(--fb-blue)]' : 'text-[var(--fb-text-muted)] hover:text-[var(--fb-ink)]'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${isActive ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)]' : 'bg-transparent text-[var(--fb-ink)]'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, tone = 'coral' }: { icon: ReactNode; label: string; value: string; tone?: 'coral' | 'teal' | 'amber' | 'mint' }) {
  const tones = {
    coral: 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border-[var(--fb-blue)]',
    teal: 'bg-[#E8F5E9] text-[var(--fb-success)] border-[var(--fb-success)] dark:bg-emerald-950/40',
    amber: 'bg-[#FFF8E1] text-[var(--fb-warning)] border-[var(--fb-warning)] dark:bg-amber-950/40',
    mint: 'bg-[var(--fb-blue-pale)] text-[var(--fb-blue-dark)] border-[var(--fb-blue-dark)]'
  };
  return (
    <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] p-6 group hover:border-[var(--fb-brand)] transition-colors">
      <div className={`inline-grid h-12 w-12 place-items-center rounded-xl border ${tones[tone]} mb-4 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--fb-text-muted)] mb-1">{label}</p>
        <p className="font-display text-3xl font-extrabold text-[var(--fb-ink)] tracking-tight">{value}</p>
      </div>
    </div>
  );
}
