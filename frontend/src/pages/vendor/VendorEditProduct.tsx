import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { storage } from '@/services/storage';
import { useStore } from '@/context/StoreContext';
import { Product } from '@/types';
import { FastBellSelect } from '@/components/FastBellSelect';

export default function VendorEditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct } = useStore();
  const categories = storage.getCategories();
  const existing = products.find(p => p.id === productId);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [category, setCategory] = useState(existing?.category ?? 'cat-food');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isAvailable, setIsAvailable] = useState(existing?.isAvailable ?? true);

  if (!existing) {
    return (
      <div className="max-w-xl">
        <Link
          to="/vendor/products"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fb-ink)]/60 hover:text-[var(--fb-blue)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="card p-6 text-center">
          <p className="text-[var(--fb-ink)]/60">Product not found.</p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Product = {
      ...existing,
      name,
      price: Number(price),
      category,
      description,
      isAvailable
    };
    updateProduct(updated);
    navigate('/vendor/products');
  };

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate('/vendor/products')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fb-ink)]/60 hover:text-[var(--fb-blue)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-[var(--fb-ink)]">Edit Product</h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Product name">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="input-field"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)">
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                min="1"
                className="input-field"
              />
            </Field>
            <Field label="Category">
              <FastBellSelect
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                value={category}
                onChange={val => setCategory(val)}
                className="input-field"
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="input-field"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={e => setIsAvailable(e.target.checked)}
              className="h-4 w-4 accent-coral"
            />{' '}
            <span className="text-sm font-semibold text-[var(--fb-ink)]">Available for sale</span>
          </label>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> Save changes
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[var(--fb-ink)]">{label}</span>
      {children}
    </label>
  );
}
