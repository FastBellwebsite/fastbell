import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, Search, Box, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { FastBellSelect } from '@/components/FastBellSelect';

export default function VendorProducts() {
  const { user } = useAuth();
  const { products, stores, toggleProductAvailability, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Find all stores belonging to this vendor
  const vendorStores = stores.filter(
    s => s.vendorId === user?.id || s.id === (user as any)?.storeId
  );
  const vendorStoreIds = vendorStores.map(s => s.id);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const list = products.filter(p => {
    const belongsToVendor = vendorStoreIds.includes(p.storeId) || p.storeId === (user as any)?.storeId;
    if (!belongsToVendor) return false;
    if (selectedStore !== 'all' && p.storeId !== selectedStore) return false;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from store menu? This cannot be undone.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 pb-8 pt-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--fb-brand)]/10 text-[var(--fb-brand)]">
              <Sparkles size={11} /> Store Menu & Catalog
            </span>
            <span className="text-xs font-semibold text-[var(--fb-text-muted)]">• SNS Campus Merchant</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[var(--fb-text-primary)]">
            Store Items ({list.length})
          </h1>
          <p className="text-xs font-semibold text-[var(--fb-text-secondary)] mt-1">
            Toggle item availability instantly when dishes run out or stationery restocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {vendorStores.length > 1 && (
            <div className="w-[200px]">
              <FastBellSelect
                options={[
                  { value: 'all', label: `All Stores (${vendorStores.length})` },
                  ...vendorStores.map(s => ({ value: s.id, label: s.name }))
                ]}
                value={selectedStore}
                onChange={val => setSelectedStore(val)}
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fb-text-muted)]" />
            <input
              type="text"
              placeholder="Search store items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] py-2 pl-9 pr-4 text-xs font-semibold text-[var(--fb-text-primary)] outline-none transition-all placeholder:text-[var(--fb-text-muted)] focus:border-[var(--fb-brand)] focus:ring-2 focus:ring-[var(--fb-brand)]/15 shadow-xs"
            />
          </div>

          <Link
            to="/vendor/products/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)] text-white text-xs font-extrabold rounded-xl shadow-soft transition-all"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Link>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--fb-background)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] border-b border-[var(--fb-border)]">
              <tr>
                <th className="px-6 py-3.5">Product & Details</th>
                <th className="px-6 py-3.5">Campus Price</th>
                <th className="px-6 py-3.5">Live Stock Status</th>
                <th className="px-6 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fb-border)]">
              {list.map(p => (
                <tr key={p.id} className="transition-colors hover:bg-[var(--fb-background)]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--fb-background)] border border-[var(--fb-border)] flex items-center justify-center p-1.5">
                        <img src={p.image} alt={p.name} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <span className="block font-bold text-xs text-[var(--fb-text-primary)]">{p.name}</span>
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] mt-0.5 bg-[var(--fb-background)] px-2 py-0.5 rounded border border-[var(--fb-border)]">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-display text-base font-extrabold text-[var(--fb-text-primary)]">
                      ₹{p.price}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleProductAvailability(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        p.isAvailable
                          ? 'bg-[#E8F5E9] text-[var(--fb-success)] border-[var(--fb-success)] hover:bg-[#E8F5E9]'
                          : 'bg-[#FFEBEE] text-[var(--fb-danger)] border-[var(--fb-danger)] hover:bg-[#FFEBEE]'
                      }`}
                      title="Click to toggle availability"
                    >
                      {p.isAvailable ? (
                        <>
                          <CheckCircle2 size={12} className="text-[var(--fb-success)]" />
                          <span>In Stock (ON)</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} className="text-[var(--fb-danger)]" />
                          <span>Sold Out (OFF)</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                          p.isAvailable
                            ? 'border-[var(--fb-border)] text-[var(--fb-text-muted)] hover:bg-black/5 hover:text-[var(--fb-text-primary)]'
                            : 'border-[var(--fb-success)] bg-[#E8F5E9] text-[var(--fb-success)] hover:bg-[#E8F5E9]'
                        }`}
                        title="Toggle stock availability"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>

                      <Link
                        to={`/vendor/products/${p.id}/edit`}
                        className="h-8 w-8 rounded-xl border border-[var(--fb-border)] text-[var(--fb-text-secondary)] hover:bg-[var(--fb-background)] hover:text-[var(--fb-brand)] hover:border-[var(--fb-brand)] flex items-center justify-center transition-colors"
                        title="Edit Item"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="h-8 w-8 rounded-xl border border-[var(--fb-border)] text-[var(--fb-text-muted)] hover:bg-[#FFEBEE] hover:text-[var(--fb-danger)] hover:border-[var(--fb-danger)] flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[var(--fb-background)] border border-[var(--fb-border)] flex items-center justify-center mb-3 text-[var(--fb-text-muted)]">
              <Box className="h-7 w-7" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--fb-text-primary)]">No items found</h3>
            <p className="text-xs font-semibold text-[var(--fb-text-muted)] max-w-xs mx-auto mt-1 mb-5">
              Add products or food items to let students order from your campus shop.
            </p>
            <Link
              to="/vendor/products/new"
              className="px-4 py-2 bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)] text-white text-xs font-bold rounded-xl shadow-soft"
            >
              Add First Item
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
