import { useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import { storage } from '@/services/storage';
import { useStore } from '@/context/StoreContext';
import { api } from '@/services/api';
import { Product } from '@/types';
import { FastBellSelect } from '@/components/FastBellSelect';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

  // Image editing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setPreviewUrl(objectUrl);
  };

  const cancelImageChange = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = existing.image;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadRes = await api.uploadProductImage(selectedFile, existing.id, existing.storeId);
        if (uploadRes?.data?.imageUrl) {
          finalImageUrl = uploadRes.data.imageUrl;
        } else {
          throw new Error(uploadRes?.message || 'Failed to upload image.');
        }
      } catch (err: any) {
        setIsUploading(false);
        toast.error(err.message || 'Image upload failed. Please try again.');
        return;
      }
    }

    const updated: Product = {
      ...existing,
      name,
      price: Number(price),
      category,
      description,
      isAvailable,
      image: finalImageUrl
    };

    await updateProduct(updated);
    setIsUploading(false);
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

          {/* Product Image Section */}
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
            />
            <div className="flex items-center gap-4 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-bg)] p-3">
              <img
                src={previewUrl || existing.image}
                alt={name || existing.name}
                className="h-20 w-20 rounded-lg object-cover border border-[var(--fb-border)] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--fb-ink)]/60">
                  {selectedFile ? 'Selected new image: ' + selectedFile.name : 'Current product photo'}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--fb-blue)] hover:underline"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {selectedFile ? 'Choose different file' : 'Change photo'}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={cancelImageChange}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--fb-danger)] hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel change
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                <Save className="h-4 w-4" /> Save changes
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
