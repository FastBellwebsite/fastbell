import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { api } from '@/services/api';
import { PageHeader } from '@/components/UI';
import { Store as StoreIcon, Mail, Phone, MapPin, Power, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function VendorProfile() {
  const { user } = useAuth();
  const { stores, updateStoreStatus, updateStoreImage } = useStore();
  const [uploadingStoreId, setUploadingStoreId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<{ [storeId: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeStoreIdRef = useRef<string | null>(null);

  if (!user) return null;

  // Find all stores belonging to this vendor
  const vendorStores = stores.filter(
    s => s.vendorId === user.id || s.id === (user as any).storeId
  );

  const handleStoreImageSelect = (storeId: string) => {
    activeStoreIdRef.current = storeId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetStoreId = activeStoreIdRef.current;
    if (!file || !targetStoreId) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be 5 MB or smaller.');
      return;
    }

    // Display instant preview of the selected image
    const objectUrl = URL.createObjectURL(file);
    setPreviewImages(prev => ({ ...prev, [targetStoreId]: objectUrl }));
    setUploadingStoreId(targetStoreId);

    try {
      const uploadRes = await api.uploadStoreImage(file, targetStoreId);
      if (!uploadRes?.data?.imageUrl) {
        throw new Error(uploadRes?.message || 'Failed to upload store image.');
      }
      const newImageUrl = uploadRes.data.imageUrl;

      // Update backend record
      await api.updateStore(targetStoreId, { imageUrl: newImageUrl });

      // Update StoreContext state
      updateStoreImage(targetStoreId, newImageUrl);

      toast.success('Store image updated successfully!');
    } catch (err: any) {
      console.error('Store image upload error:', err);
      // Revert preview on failure
      setPreviewImages(prev => {
        const next = { ...prev };
        delete next[targetStoreId];
        return next;
      });
      URL.revokeObjectURL(objectUrl);
      toast.error(err.message || 'Failed to update store image.');
    } finally {
      setUploadingStoreId(null);
      activeStoreIdRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Vendor Profile" subtitle="Your campus merchant account and store management." />

      {/* Hidden file input for store photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

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
          {vendorStores.map(store => {
            const isUploadingThis = uploadingStoreId === store.id;
            const currentImg = previewImages[store.id] || store.image;

            return (
              <div
                key={store.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] shadow-sm hover:border-[var(--fb-blue)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative group/img h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-[var(--fb-border)] bg-[var(--fb-bg)]">
                    <img
                      src={currentImg}
                      alt={store.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={isUploadingThis}
                      onClick={() => handleStoreImageSelect(store.id)}
                      className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer disabled:opacity-75"
                      title="Change store photo"
                    >
                      {isUploadingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--fb-ink)]">{store.name}</h4>
                    <p className="text-xs text-[var(--fb-ink)]/60">
                      {store.locationLabel} • ★ {store.rating}
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingThis}
                      onClick={() => handleStoreImageSelect(store.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--fb-blue)] hover:underline cursor-pointer"
                    >
                      {isUploadingThis ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading photo...
                        </>
                      ) : (
                        <>
                          <Camera className="h-3 w-3" /> Change cover photo
                        </>
                      )}
                    </button>
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
            );
          })}
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
