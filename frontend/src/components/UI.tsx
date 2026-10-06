import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <div className="mb-6">
      {back && <Link to={back} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fb-ink)]/60 hover:text-[var(--fb-blue)]"><ArrowLeft className="h-4 w-4" /> Back</Link>}
      <h1 className="font-display text-3xl font-extrabold text-[var(--fb-ink)]">{title}</h1>
      {subtitle && <p className="mt-1 text-[var(--fb-ink)]/60">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-background-50 text-[var(--fb-blue)]">{icon}</div>
      <h3 className="mt-4 font-display text-xl font-bold text-[var(--fb-ink)]">{title}</h3>
      <p className="mt-1 max-w-sm text-[var(--fb-ink)]/60">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PLACED: 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)]/20',
    ACCEPTED: 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)]/20',
    PREPARING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    READY: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    OUT_FOR_DELIVERY: 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] border border-[var(--fb-blue)]/30 font-extrabold',
    DELIVERED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-[var(--fb-danger)] border border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${styles[status] || 'bg-[var(--fb-surface)] text-[var(--fb-text-muted)] border border-[var(--fb-border)]'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
