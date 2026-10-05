import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, Bike, ShieldCheck, ArrowRight, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Login() {
  // Subtle mouse-parallax for Student feature panel (desktop fine-pointer only)
  const [studentOffset, setStudentOffset] = useState({ x: 0, y: 0 });
  const [isStudentHovered, setIsStudentHovered] = useState(false);
  const studentRef = useRef<HTMLAnchorElement>(null);
  const canHoverRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine hover and user prefers motion
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
    canHoverRef.current = hoverQuery.matches && motionQuery.matches;

    const handleHoverChange = (e: MediaQueryListEvent) => {
      canHoverRef.current = e.matches && motionQuery.matches;
    };
    hoverQuery.addEventListener('change', handleHoverChange);
    return () => hoverQuery.removeEventListener('change', handleHoverChange);
  }, []);

  const handleStudentMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canHoverRef.current || !studentRef.current) return;
    const rect = studentRef.current.getBoundingClientRect();
    // Normalized offset between -0.5 and 0.5
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    // Restrained 2-4px positional shift
    setStudentOffset({ x: normX * 6, y: normY * 5 });
  };

  const handleStudentMouseEnter = () => {
    if (!canHoverRef.current) return;
    setIsStudentHovered(true);
  };

  const handleStudentMouseLeave = () => {
    setIsStudentHovered(false);
    setStudentOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between font-sans bg-[var(--fb-bg)] text-[var(--fb-text)] selection:bg-[var(--fb-blue)] selection:text-white overflow-x-hidden transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-[var(--fb-border)] bg-[var(--fb-surface)] shrink-0 z-20 transition-colors duration-200">
        <div className="w-[calc(100%-48px)] sm:w-[calc(100%-64px)] max-w-[1520px] mx-auto py-3.5 flex justify-between items-center">
          <Link to="/login" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
            <span className="font-display text-2xl font-black tracking-tight text-[var(--fb-ink)] dark:text-white">
              Fast<span className="italic font-medium text-[var(--fb-blue)]">Bell</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-[var(--fb-text-secondary)] dark:text-white/80">
              <Link 
                to="/register/student" 
                className="hover:text-[var(--fb-blue)] dark:hover:text-white transition-colors duration-200"
              >
                Join as Student
              </Link>
              <Link 
                to="/register/vendor" 
                className="hover:text-[var(--fb-blue)] dark:hover:text-white transition-colors duration-200"
              >
                Partner Store
              </Link>
              <Link 
                to="/register/delivery" 
                className="hover:text-[var(--fb-blue)] dark:hover:text-white transition-colors duration-200"
              >
                Ride with us
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-[calc(100%-48px)] sm:w-[calc(100%-64px)] max-w-[1520px] mx-auto pt-6 sm:pt-8 pb-6 sm:pb-8 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Hero Headline - Concise & Product-Oriented */}
        <div className="mb-4 sm:mb-5 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] font-black tracking-[-0.035em] text-[var(--fb-ink)] dark:text-white leading-[1.08] mb-2">
            Campus commerce,<br />
            without the runaround.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fb-text-secondary)] dark:text-white/60 font-normal">
            Food, essentials and everyday services from stores around you.
          </p>
        </div>

        {/* Role Portal Grid - ~69% Student / ~31% Vendor+Delivery */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,69fr)_minmax(320px,31fr)] gap-3.5 items-stretch mb-3.5">
          
          {/* Large Featured Student Panel - 69% Visual Weight, Dynamic Mouse-Parallax */}
          <Link
            ref={studentRef}
            to="/auth/student"
            onMouseMove={handleStudentMouseMove}
            onMouseEnter={handleStudentMouseEnter}
            onMouseLeave={handleStudentMouseLeave}
            className="group rounded-none border-2 border-[var(--fb-blue)] bg-[var(--role-student-surface)] dark:bg-[#121c2e] hover:border-[#4d82ff] transition-all duration-300 overflow-hidden flex flex-col sm:flex-row shadow-sm min-h-[380px] lg:h-[455px]"
          >
            {/* Left Content Area */}
            <div className="sm:w-1/2 px-8 lg:px-10 py-7 lg:py-9 flex flex-col justify-between bg-transparent relative z-10">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-8 h-8 rounded-none border border-blue-400/25 bg-blue-500/10 flex items-center justify-center text-[var(--fb-blue)] group-hover:border-blue-400/50 group-hover:bg-blue-500/20 transition-all duration-300">
                    <ShoppingBag size={16} strokeWidth={2.2} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--fb-blue)] transition-colors">
                    Campus Shopping
                  </p>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[var(--fb-ink)] dark:text-white tracking-tight mb-2 leading-tight transition-transform duration-300 group-hover:-translate-y-0.5">
                  Student
                </h2>

                <p className="text-xs sm:text-[13.5px] text-[var(--fb-text-secondary)] dark:text-white/70 leading-relaxed font-normal mb-3">
                  <span className="font-semibold text-[var(--fb-ink)] dark:text-white/90 block mb-0.5">
                    Everything you need, closer to campus.
                  </span>
                  Food, essentials and everyday services from stores around you.
                </p>

                {/* Subtle Commerce Cue & Small Category Hints */}
                <div className="pt-3 border-t border-[var(--fb-border)] dark:border-white/10 max-w-[340px]">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-[var(--fb-bg)] dark:bg-white/5 border border-[var(--fb-border)] dark:border-white/10 text-xs text-[var(--fb-text-muted)] dark:text-white/50 mb-2 transition-colors group-hover:border-[var(--fb-blue)]/40">
                    <Search size={13} className="text-[var(--fb-blue)] shrink-0" />
                    <span className="truncate">Search food, groceries, stationery...</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--fb-text-muted)] dark:text-white/50">
                    <span>Food</span>
                    <span className="text-[var(--fb-border)] dark:text-white/20">•</span>
                    <span>Groceries</span>
                    <span className="text-[var(--fb-border)] dark:text-white/20">•</span>
                    <span>Stationery</span>
                    <span className="text-[var(--fb-border)] dark:text-white/20">•</span>
                    <span>Laundry</span>
                  </div>
                </div>
              </div>

              {/* Anchored Primary CTA with animated arrow */}
              <div className="pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--fb-blue)] group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                <span>Enter Marketplace</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
              </div>
            </div>

            {/* Right Visual Image - Campus-life imagery with subtle mouse parallax */}
            <div className="sm:w-1/2 relative min-h-[220px] sm:min-h-full bg-slate-900 overflow-hidden">
              <img
                src="/student-campus-lifestyle.jpg"
                alt="Student campus life and everyday essentials"
                className="w-full h-full object-cover will-change-transform"
                style={{
                  transform: isStudentHovered
                    ? `translate3d(${studentOffset.x}px, ${studentOffset.y}px, 0) scale(1.03)`
                    : 'translate3d(0, 0, 0) scale(1)',
                  transition: isStudentHovered
                    ? 'transform 120ms ease-out'
                    : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/products/classmate-notebook.webp';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[var(--role-student-surface)] dark:from-[#121c2e] via-[var(--role-student-surface)]/40 dark:via-[#121c2e]/40 to-transparent opacity-70 group-hover:opacity-55 transition-opacity duration-500 pointer-events-none" />
            </div>
          </Link>

          {/* Stacked Right Column: Vendor & Delivery */}
          <div className="flex flex-col gap-3.5">
            {/* Vendor Card - Smaller block with Manage your store */}
            <Link
              to="/auth/vendor"
              className="flex-1 group rounded-none border border-[var(--fb-border)] dark:border-white/10 bg-[var(--role-vendor-surface)] dark:bg-[#11141c] hover:border-amber-500/60 transition-all duration-300 relative overflow-hidden p-6 lg:p-7 flex flex-col justify-between min-h-[180px] lg:h-[220px] shadow-sm"
            >
              <div className="absolute inset-0 z-0 opacity-25 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-45 transition-opacity duration-500 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80"
                  alt="Campus store vendor"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out will-change-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/products/classmate-notebook.webp';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--role-vendor-surface)] dark:from-[#11141c] via-[var(--role-vendor-surface)]/85 dark:via-[#11141c]/85 to-[var(--role-vendor-surface)]/40 dark:to-[#11141c]/40 transition-colors duration-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Store size={14} className="text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    Business
                  </p>
                </div>
                <h3 className="font-display text-2xl lg:text-[28px] font-bold tracking-tight text-[var(--fb-ink)] dark:text-white transition-transform duration-300 group-hover:-translate-y-0.5">
                  Vendor
                </h3>
              </div>

              <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--fb-text-secondary)] dark:text-white/70 group-hover:text-[var(--fb-ink)] dark:group-hover:text-white transition-colors">
                <span>Manage your store</span>
                <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
              </div>
            </Link>

            {/* Delivery Card - Smaller block with Start route */}
            <Link
              to="/auth/delivery"
              className="flex-1 group rounded-none border border-[var(--fb-border)] dark:border-white/10 bg-[var(--role-delivery-surface)] dark:bg-[#11141c] hover:border-emerald-500/60 transition-all duration-300 relative overflow-hidden p-6 lg:p-7 flex flex-col justify-between min-h-[180px] lg:h-[220px] shadow-sm"
            >
              <div className="absolute inset-0 z-0 opacity-25 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-45 transition-opacity duration-500 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=800&q=80"
                  alt="Delivery runner transit"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out will-change-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/products/daily-wash.webp';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--role-delivery-surface)] dark:from-[#11141c] via-[var(--role-delivery-surface)]/85 dark:via-[#11141c]/85 to-[var(--role-delivery-surface)]/40 dark:to-[#11141c]/40 transition-colors duration-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bike size={14} className="text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    Fleet
                  </p>
                </div>
                <h3 className="font-display text-2xl lg:text-[28px] font-bold tracking-tight text-[var(--fb-ink)] dark:text-white transition-transform duration-300 group-hover:-translate-y-0.5">
                  Delivery
                </h3>
              </div>

              <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--fb-text-secondary)] dark:text-white/70 group-hover:text-[var(--fb-ink)] dark:group-hover:text-white transition-colors">
                <span>Start route</span>
                <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Horizontal Quiet Admin Bar */}
        <Link
          to="/auth/admin"
          className="group w-full rounded-none border border-[var(--fb-border)] dark:border-white/10 bg-[var(--role-admin-surface)] dark:bg-[#11141c] hover:border-purple-500/50 px-6 py-3.5 flex items-center justify-between transition-all duration-300 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-none bg-[var(--fb-bg)] dark:bg-white/5 border border-[var(--fb-border)] dark:border-white/10 flex items-center justify-center text-[var(--fb-text-secondary)] dark:text-white/60 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-all duration-300">
              <ShieldCheck size={14} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <span className="font-display text-sm font-bold text-[var(--fb-ink)] dark:text-white tracking-tight">
                Platform Admin
              </span>
              <span className="text-xs text-[var(--fb-text-muted)] dark:text-white/50 font-normal group-hover:text-[var(--fb-text-secondary)] dark:group-hover:text-white/65 transition-colors">
                Marketplace & Operations Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--fb-text-secondary)] dark:text-white/60 group-hover:text-[var(--fb-ink)] dark:group-hover:text-white transition-colors">
            <span>Manage</span>
            <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
          </div>
        </Link>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-[var(--fb-border)] dark:border-white/5 bg-[var(--fb-surface)] dark:bg-[#0a0c10] text-[11px] text-[var(--fb-text-muted)] dark:text-white/40 shrink-0 z-20 transition-colors duration-200">
        <div className="w-[calc(100%-48px)] sm:w-[calc(100%-64px)] max-w-[1520px] mx-auto py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            FastBell Campus Commerce • Hyperlocal ecosystem connecting students, stores & couriers
          </div>
          <div className="flex items-center gap-4 uppercase font-bold text-[10px]">
            <Link to="/auth/student" className="hover:text-[var(--fb-ink)] dark:hover:text-white transition-colors duration-200">Student Login</Link>
            <Link to="/auth/vendor" className="hover:text-[var(--fb-ink)] dark:hover:text-white transition-colors duration-200">Vendor Login</Link>
            <Link to="/auth/delivery" className="hover:text-[var(--fb-ink)] dark:hover:text-white transition-colors duration-200">Delivery Login</Link>
            <Link to="/auth/admin" className="hover:text-[var(--fb-ink)] dark:hover:text-white transition-colors duration-200">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
