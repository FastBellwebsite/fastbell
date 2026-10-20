import { useState, useEffect, useMemo } from 'react';
import { Search, Bike, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export interface AdminDeliveryPartner {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  campusId: string;
  campusName: string;
  collegeId?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  serviceArea?: string | null;
  baseAddress?: string | null;
  availabilityStatus: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export default function AdminDeliveryPartners() {
  const [partners, setPartners] = useState<AdminDeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDeliveryPartners();
      if (res && res.data) {
        setPartners(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load delivery partners:', err);
      toast.error(err.message || 'Failed to load delivery partners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleUpdateStatus = async (partnerId: string, partnerName: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setActionInProgress(partnerId);
      const res = await api.updateDeliveryPartnerVerification(partnerId, newStatus);
      if (res && res.data) {
        setPartners(prev =>
          prev.map(p => (p.id === partnerId || p.userId === partnerId ? { ...p, verificationStatus: newStatus } : p))
        );
        toast.success(
          newStatus === 'APPROVED'
            ? `${partnerName} is now APPROVED for campus deliveries.`
            : `${partnerName}'s delivery verification was REJECTED.`
        );
      }
    } catch (err: any) {
      console.error('Failed to update verification status:', err);
      toast.error(err.message || 'Status update failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const counts = useMemo(() => {
    return {
      total: partners.length,
      pending: partners.filter(p => p.verificationStatus === 'PENDING').length,
      approved: partners.filter(p => p.verificationStatus === 'APPROVED').length,
      rejected: partners.filter(p => p.verificationStatus === 'REJECTED').length,
    };
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const matchesStatus = statusFilter === 'ALL' || p.verificationStatus === statusFilter;
      const q = query.toLowerCase().trim();
      if (!q) return matchesStatus;
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.collegeId && p.collegeId.toLowerCase().includes(q)) ||
        (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [partners, statusFilter, query]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 pb-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--fb-brand)]/10 text-[var(--fb-brand)]">
              <Bike size={12} /> Campus Delivery Fleet
            </span>
            <span className="text-xs font-semibold text-[var(--fb-text-muted)]">• SNS College Campus</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[var(--fb-text-primary)]">
            Delivery Partner Verification ({partners.length})
          </h1>
          <p className="text-xs font-semibold text-[var(--fb-text-secondary)] mt-1">
            Review applicant credentials and authorize delivery partners to claim and deliver campus orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPartners}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] hover:bg-[var(--fb-surface-elevated)] px-3 py-2 text-xs font-bold text-[var(--fb-text-secondary)] hover:text-[var(--fb-text-primary)] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fb-text-muted)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email, vehicle..."
              className="w-full rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:border-[var(--fb-brand)] focus:ring-2 focus:ring-[var(--fb-brand)]/15 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[var(--fb-surface-elevated)] border-[var(--fb-brand)] ring-2 ring-[var(--fb-brand)]/15'
              : 'bg-[var(--fb-surface)] border-[var(--fb-border)] hover:border-[var(--fb-brand)]/40'
          }`}
        >
          <p className="text-[11px] font-bold text-[var(--fb-text-muted)] uppercase tracking-wider mb-1">Total Fleet</p>
          <p className="font-display text-2xl font-black text-[var(--fb-text-primary)]">{counts.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/15'
              : 'bg-[var(--fb-surface)] border-[var(--fb-border)] hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</p>
            {counts.pending > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="font-display text-2xl font-black text-amber-800 dark:text-amber-300">{counts.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/15'
              : 'bg-[var(--fb-surface)] border-[var(--fb-border)] hover:border-emerald-400'
          }`}
        >
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Approved & Active</p>
          <p className="font-display text-2xl font-black text-emerald-800 dark:text-emerald-300">{counts.approved}</p>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'REJECTED'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-500 ring-2 ring-red-500/15'
              : 'bg-[var(--fb-surface)] border-[var(--fb-border)] hover:border-red-400'
          }`}
        >
          <p className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Rejected</p>
          <p className="font-display text-2xl font-black text-red-800 dark:text-red-300">{counts.rejected}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--fb-background)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] border-b border-[var(--fb-border)]">
              <tr>
                <th className="px-6 py-3.5">Delivery Partner</th>
                <th className="px-6 py-3.5">Campus / Area</th>
                <th className="px-6 py-3.5">Vehicle & Identity</th>
                <th className="px-6 py-3.5">Availability</th>
                <th className="px-6 py-3.5">Verification Status</th>
                <th className="px-6 py-3.5 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fb-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--fb-text-muted)] font-bold">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--fb-brand)]" />
                    Loading delivery partner records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--fb-text-muted)] font-semibold">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-[var(--fb-text-muted)]" />
                    No delivery partners match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isPending = p.verificationStatus === 'PENDING';
                  const isApproved = p.verificationStatus === 'APPROVED';
                  const isRejected = p.verificationStatus === 'REJECTED';
                  const isBusy = actionInProgress === p.id || actionInProgress === p.userId;

                  return (
                    <tr key={p.id} className="hover:bg-[var(--fb-background)]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-xs text-[var(--fb-text-primary)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[var(--fb-brand)]/10 text-[var(--fb-brand)] flex items-center justify-center font-bold text-xs border border-[var(--fb-brand)]/20">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-xs text-[var(--fb-text-primary)]">{p.name}</span>
                            <span className="block text-[11px] font-medium text-[var(--fb-text-secondary)]">{p.email}</span>
                            {p.phone && <span className="block text-[10px] text-[var(--fb-text-muted)]">{p.phone}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-[var(--fb-text-secondary)]">
                        <div>
                          <span className="font-bold text-[var(--fb-text-primary)]">{p.campusName || p.campusId}</span>
                          {p.serviceArea && (
                            <span className="block text-[11px] text-[var(--fb-text-muted)]">Area: {p.serviceArea}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-[var(--fb-text-secondary)]">
                        <div>
                          <span className="font-semibold text-[var(--fb-text-primary)]">
                            {p.vehicleType || 'Bicycle'} {p.vehicleNumber ? `(${p.vehicleNumber})` : ''}
                          </span>
                          {p.collegeId && (
                            <span className="block text-[10px] text-[var(--fb-text-muted)] font-mono">ID: {p.collegeId}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-[var(--fb-background)] border border-[var(--fb-border)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-secondary)]">
                          {p.availabilityStatus || 'OFFLINE'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <Clock className="h-3 w-3" /> PENDING
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <ShieldCheck className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isApproved && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, p.name, 'APPROVED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, p.name, 'REJECTED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
