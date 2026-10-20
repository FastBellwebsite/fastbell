import { useState, useEffect, useMemo } from 'react';
import { Search, Power, Users, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { api, authToken } from '@/services/api';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [list, setList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = authToken.get();
      if (!token) {
        throw new Error('Authorization token required. Please sign in as an administrator.');
      }

      const response = await api.getUsers();
      if (response && response.success && Array.isArray(response.data)) {
        setList(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      let msg = err.message || 'Failed to connect to users service';
      if (
        msg.includes('Authorization token required') ||
        msg.includes('Authentication token missing') ||
        msg.includes('Invalid or expired token')
      ) {
        msg = 'Authorization token required. Please sign in as an administrator.';
      }
      setError(msg);
      // Use unique toast ID to prevent repeated error toasts
      toast.error(msg, { id: 'admin-users-fetch-error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  }, [list, query]);

  const toggle = async (id: string) => {
    const target = list.find(u => u.id === id);
    if (!target) return;

    // Safety guard: Prevent administrator from suspending their own account
    if (currentAdmin && currentAdmin.id === id && target.status === 'Active') {
      toast.error('You cannot suspend your own administrator account');
      return;
    }

    const nextIsActive = target.status !== 'Active';
    setUpdatingId(id);

    try {
      const response = await api.updateUserStatus(id, nextIsActive);
      if (response && response.success) {
        const nextStatus = nextIsActive ? 'Active' : 'Suspended';
        setList(prev =>
          prev.map(u => (u.id === id ? { ...u, status: nextStatus, isActive: nextIsActive } : u))
        );
        toast.success(
          `User ${target.name} ${nextIsActive ? 'activated' : 'suspended'} successfully`
        );
      } else {
        throw new Error(response?.message || 'Status update failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 md:px-8 pb-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--fb-brand)]/10 text-[var(--fb-brand)]">
              <Users size={12} /> Campus Directory
            </span>
            <span className="text-xs font-semibold text-[var(--fb-text-muted)]">• SNS College of Technology</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[var(--fb-text-primary)]">
            Registered Users ({list.length})
          </h1>
          <p className="text-xs font-semibold text-[var(--fb-text-secondary)] mt-1">
            Manage authenticated students, vendor accounts, and campus delivery partners.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            title="Refresh user directory"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] hover:bg-[var(--fb-background)] text-xs font-semibold text-[var(--fb-text-secondary)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fb-text-muted)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search students, vendors..."
              className="w-full rounded-xl border border-[var(--fb-border)] bg-[var(--fb-surface)] py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:border-[var(--fb-brand)] focus:ring-2 focus:ring-[var(--fb-brand)]/15 shadow-xs"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl p-12 text-center shadow-soft">
          <Loader2 className="animate-spin mx-auto text-[var(--fb-brand)] mb-3" size={32} />
          <p className="text-sm font-bold text-[var(--fb-text-primary)]">Loading campus directory...</p>
          <p className="text-xs text-[var(--fb-text-muted)] mt-1">Connecting to MySQL database</p>
        </div>
      ) : error ? (
        <div className="bg-[var(--fb-surface)] border border-[var(--fb-danger)]/30 rounded-2xl p-8 text-center shadow-soft">
          <AlertCircle className="mx-auto text-[var(--fb-danger)] mb-3" size={36} />
          <h3 className="font-bold text-sm text-[var(--fb-text-primary)]">Unable to Load Users</h3>
          <p className="text-xs text-[var(--fb-text-secondary)] mt-1 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--fb-brand)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl p-12 text-center shadow-soft">
          <Users className="mx-auto text-[var(--fb-text-muted)] mb-3 opacity-40" size={40} />
          <h3 className="font-bold text-sm text-[var(--fb-text-primary)]">
            {query ? 'No matching users found' : 'No users registered yet'}
          </h3>
          <p className="text-xs text-[var(--fb-text-secondary)] mt-1">
            {query ? `No accounts matched "${query}"` : 'Registered accounts will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--fb-background)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-muted)] border-b border-[var(--fb-border)]">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email / Identifier</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fb-border)]">
                {filtered.map(u => {
                  const isSuspended = u.status === 'Suspended';
                  const uStatus = u.status || 'Active';
                  const isSelf = currentAdmin && currentAdmin.id === u.id;
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[var(--fb-background)]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-xs text-[var(--fb-text-primary)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--fb-brand)]/10 text-[var(--fb-brand)] flex items-center justify-center font-bold text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span>
                            {u.name || 'Unnamed User'}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-bold text-[var(--fb-brand)] bg-[var(--fb-brand)]/10 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--fb-text-secondary)]">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-[var(--fb-background)] border border-[var(--fb-border)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--fb-text-secondary)]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                            isSuspended
                              ? 'bg-[var(--fb-danger)]/10 text-[var(--fb-danger)] border-[var(--fb-danger)]/30'
                              : 'bg-[var(--fb-success)]/10 text-[var(--fb-success)] border-[var(--fb-success)]/30'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? 'bg-[var(--fb-danger)]' : 'bg-[var(--fb-success)]'}`} />
                          {uStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggle(u.id)}
                          disabled={isSelf || isUpdating}
                          title={isSelf ? 'Cannot suspend your own account' : undefined}
                          className={`inline-flex items-center gap-1.5 rounded-xl border border-[var(--fb-border)] px-3 py-1.5 text-xs font-bold transition-colors ${
                            isSelf
                              ? 'bg-[var(--fb-background)] text-[var(--fb-text-muted)] opacity-50 cursor-not-allowed'
                              : 'bg-[var(--fb-background)] hover:bg-[var(--fb-surface-elevated)] text-[var(--fb-text-secondary)] hover:text-[var(--fb-text-primary)] cursor-pointer'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {uStatus === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
