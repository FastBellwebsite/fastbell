import { Search } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { PageHeader } from '@/components/UI';

export default function AdminVendors() {
  const [query, setQuery] = useState('');
  const { stores, updateStoreStatus } = useStore();

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
          className="w-full rounded-xl border border-[#ebe3da] bg-[var(--fb-surface)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-coral"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <div key={s.id} className="card overflow-hidden">
            <img src={s.image} alt={s.name} className="h-36 w-full object-cover" />
            <div className="p-4">
              <h3 className="font-display font-bold text-[var(--fb-ink)]">{s.name}</h3>
              <p className="text-xs text-[var(--fb-ink)]/60 mt-0.5">
                {s.locationLabel} • {s.distanceFromCampus}m
              </p>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => updateStoreStatus(s.id, !s.isOpen)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 cursor-pointer ${
                    s.isOpen ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)]' : 'bg-[#FFEBEE] text-[var(--fb-danger)]'
                  }`}
                >
                  {s.isOpen ? 'Active / Open' : 'Closed'}
                </button>
                <span className="text-sm font-semibold text-[var(--fb-ink)]/70">★ {s.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
