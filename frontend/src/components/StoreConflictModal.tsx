import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

interface StoreConflictModalProps {
  isOpen: boolean;
  existingStoreName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function StoreConflictModal({
  isOpen,
  existingStoreName,
  onConfirm,
  onCancel
}: StoreConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-raise">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--fb-warning)]/10 text-[var(--fb-warning)] flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[var(--fb-text-primary)]">
              Start new order?
            </h3>
            <p className="text-xs text-[var(--fb-text-muted)] font-medium">Single-Store Policy</p>
          </div>
        </div>

        <p className="text-sm text-[var(--fb-text-secondary)] font-medium leading-relaxed mb-6">
          Your cart currently contains items from <strong className="text-[var(--fb-text-primary)]">{existingStoreName}</strong>. FastBell orders must come from a single campus store to ensure fast 15-minute delivery.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-[var(--fb-border)] text-[var(--fb-text-primary)] font-bold text-sm hover:bg-[var(--fb-background)] transition-colors"
          >
            Keep existing cart
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-[var(--fb-brand)] hover:bg-[var(--fb-brand-hover)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Trash2 className="h-4 w-4" /> Replace & Add
          </button>
        </div>
      </div>
    </div>
  );
}
