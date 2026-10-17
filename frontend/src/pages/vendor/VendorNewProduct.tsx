import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { storage } from '@/services/storage';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FastBellSelect } from '@/components/FastBellSelect';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.union([z.string().min(1), z.number()]),
  category: z.string(),
  description: z.string().optional(),
  available: z.boolean()
});

type FormValues = z.infer<typeof schema>;

export default function VendorNewProduct() {
  const navigate = useNavigate();
  const { addProduct, stores } = useStore();
  const { user } = useAuth();
  const categories = storage.getCategories();

  const userStoreId = (user as any)?.storeId;
  const vendorStores = stores.filter(
    s => s.vendorId === user?.id || (userStoreId && s.id === userStoreId)
  );
  const defaultStoreId = vendorStores[0]?.id || userStoreId || 'store-001';
  const [selectedStoreId, setSelectedStoreId] = useState(defaultStoreId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'cat-food', available: true }
  });

  const onSubmit = (data: FormValues) => {
    try {
      const activeStoreId = selectedStoreId || defaultStoreId || userStoreId || vendorStores[0]?.id || 'store-001';
      const categoryId = data.category || 'cat-food';
      const product: Product = {
        id: `prod-${Date.now()}`,
        name: data.name.trim(),
        category: categoryId,
        categoryId: categoryId,
        storeId: activeStoreId,
        campusId: user?.campusId || 'sns',
        price: Number(data.price),
        rating: 4.8,
        image: PLACEHOLDER_IMAGE,
        description: data.description?.trim() || 'Fresh campus product.',
        isAvailable: data.available !== false,
        available: data.available !== false
      };
      addProduct(product);
      navigate('/vendor/products');
    } catch {
      toast.error('Failed to add product.');
    }
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
        <h2 className="font-display text-xl font-bold text-[var(--fb-ink)]">Add New Product</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {vendorStores.length > 1 && (
            <Field label="Assign to Store">
              <FastBellSelect
                options={vendorStores.map(s => ({ value: s.id, label: s.name }))}
                value={selectedStoreId}
                onChange={val => setSelectedStoreId(val)}
                className="input-field font-semibold"
              />
            </Field>
          )}
          <Field label="Product name">
            <input
              {...register('name')}
              placeholder="e.g. Veg Momos (6 pcs)"
              className={`input-field ${errors.name ? 'border-[var(--fb-danger)]' : ''}`}
            />
            {errors.name && <p className="mt-1 text-xs text-[var(--fb-danger)]">{errors.name.message}</p>}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)">
              <input
                type="number"
                {...register('price')}
                min="1"
                placeholder="70"
                className={`input-field ${errors.price ? 'border-[var(--fb-danger)]' : ''}`}
              />
              {errors.price && <p className="mt-1 text-xs text-[var(--fb-danger)]">{errors.price.message}</p>}
            </Field>
            <Field label="Category">
              <FastBellSelect
                name="category"
                id="category"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                value={watch('category')}
                onChange={val => setValue('category', val, { shouldValidate: true })}
                className={errors.category ? 'border-[var(--fb-danger)]' : ''}
              />
              {errors.category && (
                <p className="mt-1 text-xs text-[var(--fb-danger)]">{errors.category.message}</p>
              )}
            </Field>
          </div>
          <Field label="Description">
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Short product description"
              className="input-field"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('available')} className="h-4 w-4 accent-coral" />
            <span className="text-sm font-semibold text-[var(--fb-ink)]">Available for sale</span>
          </label>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> Save product
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
