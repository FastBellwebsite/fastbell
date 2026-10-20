import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storage } from '@/services/storage';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Product } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FastBellSelect } from '@/components/FastBellSelect';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
  const userStoreIds = (user as any)?.storeIds || [];
  const userVendorProfileId = (user as any)?.vendorProfileId;
  const vendorStores = stores.filter(
    s =>
      (user?.id && (s.vendorId === user.id || s.vendorUserId === user.id)) ||
      (userVendorProfileId && (s.vendorProfileId === userVendorProfileId || s.vendorId === userVendorProfileId)) ||
      (userStoreId && s.id === userStoreId) ||
      (Array.isArray(userStoreIds) && userStoreIds.includes(s.id))
  );
  const defaultStoreId = vendorStores[0]?.id || userStoreId || (stores.length > 0 ? stores[0].id : '');
  const [selectedStoreId, setSelectedStoreId] = useState(defaultStoreId);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be 5 MB or smaller.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const clearSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const activeStoreId = selectedStoreId || defaultStoreId || userStoreId || vendorStores[0]?.id;
      if (!activeStoreId) {
        toast.error('No authorized vendor store found.');
        return;
      }
      const categoryId = data.category || 'cat-food';
      let finalImageUrl = PLACEHOLDER_IMAGE;

      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploadRes = await api.uploadProductImage(selectedFile, undefined, activeStoreId);
          if (uploadRes?.data?.imageUrl) {
            finalImageUrl = uploadRes.data.imageUrl;
          } else {
            throw new Error(uploadRes?.message || 'Failed to upload image.');
          }
        } catch (uploadErr: any) {
          setIsUploading(false);
          toast.error(uploadErr.message || 'Image upload failed. Please check the file and try again.');
          return;
        }
      }

      const product: Product = {
        id: `prod-${Date.now()}`,
        name: data.name.trim(),
        category: categoryId,
        categoryId: categoryId,
        storeId: activeStoreId,
        campusId: user?.campusId || 'sns',
        price: Number(data.price),
        rating: 4.8,
        image: finalImageUrl,
        description: data.description?.trim() || 'Fresh campus product.',
        isAvailable: data.available !== false,
        available: data.available !== false
      };

      await addProduct(product);
      navigate('/vendor/products');
    } catch {
      toast.error('Failed to add product.');
    } finally {
      setIsUploading(false);
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

          {/* Product Image Upload Section */}
          <div className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[var(--fb-ink)]">
              Product Image
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="product-image-input"
            />
            {imagePreview ? (
              <div className="relative flex items-center gap-4 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover border border-[var(--fb-border)]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--fb-ink)] truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-[var(--fb-ink)]/60 mt-0.5">
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-[var(--fb-blue)] hover:underline"
                  >
                    Change photo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="rounded-lg p-1.5 text-[var(--fb-ink)]/60 hover:bg-[var(--fb-surface)] hover:text-[var(--fb-danger)] transition-colors"
                  title="Remove image"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--fb-border)] p-6 hover:border-[var(--fb-blue)] transition-colors cursor-pointer bg-[var(--fb-surface)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] mb-2">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--fb-ink)]">
                  Click to select product image
                </p>
                <p className="text-xs text-[var(--fb-ink)]/50 mt-1">
                  Supports JPEG, PNG, WebP up to 5 MB
                </p>
              </div>
            )}
          </div>

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
          <button
            type="submit"
            disabled={isUploading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading image & saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save product
              </>
            )}
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
