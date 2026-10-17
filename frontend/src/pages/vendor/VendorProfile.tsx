import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PageHeader } from '@/components/UI';
import { Store as StoreIcon, Mail, Phone, MapPin, Power } from 'lucide-react';

export default function VendorProfile() {
  const { user } = useAuth();
  const { stores, updateStoreStatus } = useStore();

  if (!user) return null;

  // Find all stores belonging to this vendor
  const vendorStores = stores.filter(
    s => s.vendorId === user.id || s.id === (user as any).storeId
  );

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Vendor Profile" subtitle="Your campus merchant account and store management." />

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] font-display text-2xl font-bold">
            <StoreIcon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[var(--fb-ink)]">{user.name}</h3>
            <p className="text-sm text-[var(--fb-ink)]/60">
              Campus Vendor • {(user as any).businessName || 'Verified Partner'}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />
          <Row icon={<MapPin className="h-4 w-4" />} label="Campus" value="SNS College of Technology" />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg font-bold text-[var(--fb-ink)] mb-4">
          Managed Stores ({vendorStores.length})
        </h3>

        <div className="space-y-4">
          {vendorStores.map(store => (
            <div
              key={store.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] shadow-sm hover:border-[var(--fb-blue)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={store.image}
                  alt={store.name}
                  className="h-12 w-12 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h4 className="font-bold text-[var(--fb-ink)]">{store.name}</h4>
                  <p className="text-xs text-[var(--fb-ink)]/60">
                    {store.locationLabel} • ★ {store.rating}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    store.isOpen
                      ? 'bg-[#E8F5E9] text-[var(--fb-success)]'
                      : 'bg-[#FFEBEE] text-[var(--fb-danger)]'
                  }`}
                >
                  {store.isOpen ? 'Open' : 'Closed'}
                </span>

                <button
                  onClick={() => updateStoreStatus(store.id, !store.isOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--fb-border)] bg-[var(--fb-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--fb-ink)]/70 hover:border-[var(--fb-blue)] hover:text-[var(--fb-blue)] transition-colors cursor-pointer"
                >
                  <Power className="h-3.5 w-3.5" />
                  {store.isOpen ? 'Close' : 'Open'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--fb-border)] p-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-[var(--fb-ink)]/50">{label}</p>
        <p className="font-semibold text-[var(--fb-ink)]">{value}</p>
      </div>
    </div>
  );
}
