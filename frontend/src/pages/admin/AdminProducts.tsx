import { Search } from 'lucide-react';
import { useState } from 'react';
import { storage } from '@/services/storage';
import { PageHeader } from '@/components/UI';
import { useStore } from '@/context/StoreContext';
import { FastBellSelect } from '@/components/FastBellSelect';

export default function AdminProducts() {
  const { products, stores, toggleProductAvailability } = useStore();
  const categories = storage.getCategories();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = products.filter(
    p =>
      (query === '' || p.name.toLowerCase().includes(query.toLowerCase().trim())) &&
      (cat === 'all' || p.category === cat || (p as any).categoryId === cat)
  );

  return (
    <div>
      <PageHeader title="Products" subtitle="All catalog items across campus stores." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fb-ink)]/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-[#ebe3da] bg-[var(--fb-surface)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-coral"
          />
        </div>
        <div className="w-[200px]">
          <FastBellSelect
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
            value={cat}
            onChange={val => setCat(val)}
          />
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background-50 text-xs uppercase tracking-wider text-[var(--fb-ink)]/60">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Store</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebe3da]">
            {filtered.map(p => {
              const store = stores.find(s => s.id === p.storeId);
              const storeName = store?.name || 'Campus Store';

              return (
                <tr key={p.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background-100 flex items-center justify-center p-1">
                        <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
                      </div>
                      <span className="font-semibold text-[var(--fb-ink)]">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--fb-ink)]/60">{storeName}</td>
                  <td className="p-4 font-semibold text-[var(--fb-ink)]">₹{p.price}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        p.isAvailable
                          ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)]'
                          : 'bg-[#FFEBEE] text-[var(--fb-danger)]'
                      }`}
                    >
                      {p.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleProductAvailability(p.id)}
                      className="rounded-lg border border-[#ebe3da] px-3 py-1.5 text-xs font-semibold text-[var(--fb-ink)]/70 hover:border-coral hover:text-[var(--fb-blue)] transition-colors cursor-pointer"
                    >
                      {p.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
