import { useState } from 'react';
import { PageHeader } from '@/components/UI';
import { Bike, Mail, Phone, Star, CheckCircle, Navigation, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import { getCompletedDeliveries, getActiveDeliveries } from '@/selectors/orderSelectors';
import toast from 'react-hot-toast';

export default function DeliveryProfile() {
  const { user } = useAuth();
  const { orders } = useOrder();
  const [isOnline, setIsOnline] = useState(true);

  if (!user) return null;

  const partnerId = user.id;
  const completed = getCompletedDeliveries(orders, partnerId);
  const active = getActiveDeliveries(orders, partnerId);
  const totalEarned = completed.length * 35;

  const toggleStatus = () => {
    setIsOnline(prev => {
      const next = !prev;
      toast.success(next ? 'You are now online and ready for deliveries!' : 'You went offline');
      return next;
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Delivery Partner Profile" subtitle="Your rider details, performance, and fleet assignment." />

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--fb-blue-soft)] text-white font-display text-2xl font-bold">
              <Bike className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[var(--fb-ink)]">{user.name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-[var(--fb-ink)]/60 font-medium">
                <Star className="h-4 w-4 fill-amber-400 text-[var(--fb-warning)]" /> 4.9 Rating • {completed.length} completed
              </p>
            </div>
          </div>

          <button
            onClick={toggleStatus}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              isOnline
                ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)]'
                : 'bg-background-100 text-[var(--fb-ink)] border border-background-200'
            }`}
          >
            {isOnline ? '● Available' : '○ Offline'}
          </button>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />
          <Row
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Campus Assigned"
            value="SNS College of Technology"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <CheckCircle className="h-6 w-6 text-[var(--fb-blue)] mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">Delivered</p>
          <p className="font-display text-2xl font-extrabold text-[var(--fb-ink)] mt-1">{completed.length}</p>
        </div>

        <div className="card p-5 text-center">
          <Navigation className="h-6 w-6 text-[var(--fb-blue)] mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">Active Jobs</p>
          <p className="font-display text-2xl font-extrabold text-[var(--fb-ink)] mt-1">{active.length}</p>
        </div>

        <div className="card p-5 text-center">
          <Bike className="h-6 w-6 text-[var(--fb-ink)] mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--fb-ink)]">Earnings</p>
          <p className="font-display text-2xl font-extrabold text-[var(--fb-ink)] mt-1">₹{totalEarned}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#ebe3da] p-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-background-50 text-[var(--fb-blue)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-[var(--fb-ink)]/50">{label}</p>
        <p className="font-semibold text-[var(--fb-ink)]">{value}</p>
      </div>
    </div>
  );
}
