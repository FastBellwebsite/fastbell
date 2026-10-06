import { Link } from 'react-router-dom';
import { Bell, MapPin, ShieldCheck, Clock, Phone, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[var(--fb-surface)] border-t border-[var(--fb-border)] py-14 mt-auto">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-4">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-[var(--fb-brand)] text-white p-2 rounded-xl flex items-center justify-center shadow-soft">
                <Bell size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-extrabold tracking-tight text-[var(--fb-text-primary)] leading-none">
                  Fast<span className="text-[var(--fb-brand)]">Bell</span>
                </span>
                <span className="text-[10px] font-bold text-[var(--fb-text-muted)] tracking-wider uppercase mt-0.5">
                  SNS College of Technology
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-[var(--fb-text-secondary)] max-w-sm leading-relaxed">
              SNS College of Technology’s official hyperlocal campus commerce platform. Delivering canteen food, groceries, stationery, and laundry directly to hostels, labs, and faculty rooms in 10–15 minutes.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-[var(--fb-text-secondary)]">
              <span className="flex items-center gap-1.5 bg-[var(--fb-background)] px-3 py-1.5 rounded-lg border border-[var(--fb-border)]">
                <ShieldCheck size={14} className="text-[var(--fb-success)]" /> Verified Campus Partners
              </span>
              <span className="flex items-center gap-1.5 bg-[var(--fb-background)] px-3 py-1.5 rounded-lg border border-[var(--fb-border)]">
                <Clock size={14} className="text-[var(--fb-brand)]" /> 8:00 AM – 11:00 PM
              </span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-[var(--fb-text-primary)]">
              Campus Hub
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-[var(--fb-text-secondary)]">
              <li>
                <Link to="/stores" className="hover:text-[var(--fb-brand)] transition-colors">
                  All Campus Stores
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-[var(--fb-brand)] transition-colors">
                  Search Food & Stationery
                </Link>
              </li>
              <li>
                <Link to="/category/cat-food" className="hover:text-[var(--fb-brand)] transition-colors">
                  Cafeterias & Canteens
                </Link>
              </li>
              <li>
                <Link to="/category/cat-stationery" className="hover:text-[var(--fb-brand)] transition-colors">
                  Stationery & Lab Records
                </Link>
              </li>
              <li>
                <Link to="/category/cat-laundry" className="hover:text-[var(--fb-brand)] transition-colors">
                  FastWash Laundry Pickup
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-[var(--fb-text-primary)]">
              Portals & Roles
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-[var(--fb-text-secondary)]">
              <li>
                <Link to="/login" className="hover:text-[var(--fb-brand)] transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth/vendor" className="hover:text-[var(--fb-brand)] transition-colors">
                  Vendor Console
                </Link>
              </li>
              <li>
                <Link to="/auth/delivery" className="hover:text-[var(--fb-brand)] transition-colors">
                  Delivery Partner App
                </Link>
              </li>
              <li>
                <Link to="/auth/admin" className="hover:text-[var(--fb-brand)] transition-colors">
                  Admin Command Center
                </Link>
              </li>
              <li>
                <Link to="/register/student" className="hover:text-[var(--fb-brand)] transition-colors">
                  New Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-[var(--fb-text-primary)]">
              Support & Help
            </h4>
            <div className="space-y-2 text-xs font-medium text-[var(--fb-text-secondary)] leading-relaxed">
              <p className="font-semibold text-[var(--fb-text-primary)]">Student Affairs Desk</p>
              <p>Block A • Intercom 4421</p>
              <p className="font-semibold text-[var(--fb-text-primary)] pt-1">Delivery Support</p>
              <p>support@sns.fastbell</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--fb-border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-[var(--fb-text-muted)]">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[var(--fb-brand)]" />
            <span>SNS College of Technology, Sathy Main Road, Coimbatore – 641035</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 FastBell</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built for campus life with <Heart size={12} className="text-[var(--fb-brand)] fill-current" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
