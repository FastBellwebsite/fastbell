import { useState } from 'react';
import { Search, Power, Users, ShieldCheck } from 'lucide-react';
import { mockUserService } from '@/services/mockUserService';
import { User } from '@/types';

export default function AdminUsers() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<User[]>(mockUserService.getUsers());

  const filtered = list.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    const updated = list.map(u => {
      if (u.id === id) {
        const toggledStatus = u.status === 'Suspended' ? 'Active' : 'Suspended';
        return mockUserService.toggleUserStatus(id, toggledStatus) || u;
      }
      return u;
    });
    setList(updated);
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
                return (
                  <tr key={u.id} className="hover:bg-[var(--fb-background)]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-[var(--fb-text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[var(--fb-brand)]/10 text-[var(--fb-brand)] flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
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
                            ? 'bg-[#FFEBEE] text-[var(--fb-danger)] border-[var(--fb-danger)]'
                            : 'bg-[#E8F5E9] text-[var(--fb-success)] border-[var(--fb-success)]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? 'bg-[#FFEBEE]' : 'bg-[#E8F5E9]'}`} />
                        {uStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggle(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--fb-border)] bg-[var(--fb-background)] hover:bg-[var(--fb-surface-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--fb-text-secondary)] hover:text-[var(--fb-text-primary)] transition-colors cursor-pointer"
                      >
                        <Power className="h-3.5 w-3.5" /> {uStatus === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
