import { Search } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PageHeader } from '@/components/UI';

export default function AdminVendors() {
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { stores, updateStoreStatus } = useStore();

  const handleToggleStatus = async (storeId: string, currentIsOpen: boolean) => {
    if (updatingId === storeId) return;
    setUpdatingId(storeId);
    try {
      await updateStoreStatus(storeId, !currentIsOpen);
    } catch {
      // Error is caught and surfaced via toast in StoreContext
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage campus partner stores and operational status." />
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fb-ink)]/40" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search vendors…"
          className="w-full rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--fb-blue)]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => {
          const isUpdating = updatingId === s.id;

          return (
            <div key={s.id} className="card overflow-hidden">
              <img src={s.image} alt={s.name} className="h-36 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-display font-bold text-[var(--fb-ink)]">{s.name}</h3>
                <p className="text-xs text-[var(--fb-ink)]/60 mt-0.5">
                  {s.locationLabel} • {s.distanceFromCampus}m
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(s.id, s.isOpen)}
                    disabled={isUpdating}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      s.isOpen ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)]/20' : 'bg-[var(--fb-danger)]/10 text-[var(--fb-danger)] border border-[var(--fb-danger)]/20'
                    }`}
                  >
                    {s.isOpen ? 'Active / Open' : 'Closed'}
                  </button>
                  <span className="text-sm font-semibold text-[var(--fb-ink)]/70">★ {s.rating}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
