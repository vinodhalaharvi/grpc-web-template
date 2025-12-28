import { useState } from 'react';
import { useUsers, useInviteUser, useDeleteUser } from '../hooks/useApi';
import { Role } from '../types';
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Trash2,
  Edit,
  Users as UsersIcon,
  Shield,
  X,
} from 'lucide-react';

export default function Users() {
  const { data, isLoading } = useUsers();
  const inviteMutation = useInviteUser();
  const deleteMutation = useDeleteUser();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const users = data?.users || [];
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteMutation.mutateAsync(userId);
    setMenuOpen(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-slate-500">Manage team members and permissions</p>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No users found
            </h3>
            <p className="text-slate-500 mb-6">
              {search ? 'Try a different search term' : 'Invite your first team member'}
            </p>
            {!search && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="btn btn-primary inline-flex"
              >
                <Plus className="w-4 h-4" />
                Invite User
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        user.active ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-slate-500">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === user.userId ? null : user.userId)
                        }
                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                      {menuOpen === user.userId && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Mail className="w-4 h-4" />
                              Resend Invite
                            </button>
                            <hr className="my-1 border-slate-100" />
                            <button
                              onClick={() => handleDelete(user.userId)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <InviteModal
          onClose={() => setInviteModalOpen(false)}
          onInvite={async (email, role) => {
            await inviteMutation.mutateAsync({ email, role });
            setInviteModalOpen(false);
          }}
          isLoading={inviteMutation.isPending}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const config = {
    [Role.OWNER]: { label: 'Owner', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
    [Role.ADMIN]: { label: 'Admin', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    [Role.OPERATOR]: { label: 'Operator', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    [Role.VIEWER]: { label: 'Viewer', className: 'bg-slate-100 text-slate-700 ring-slate-500/20' },
    [Role.UNSPECIFIED]: { label: 'Unknown', className: 'bg-slate-100 text-slate-700 ring-slate-500/20' },
  };
  const { label, className } = config[role] || config[Role.UNSPECIFIED];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${className}`}>
      <Shield className="w-3 h-3" />
      {label}
    </span>
  );
}

function InviteModal({
  onClose,
  onInvite,
  isLoading,
}: {
  onClose: () => void;
  onInvite: (email: string, role: Role) => Promise<void>;
  isLoading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.VIEWER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onInvite(email, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Invite User</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="colleague@company.com"
              required
            />
          </div>

          <div>
            <label className="label">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(parseInt(e.target.value) as Role)}
              className="input"
            >
              <option value={Role.VIEWER}>Viewer - Read-only access</option>
              <option value={Role.OPERATOR}>Operator - Issue & manage certificates</option>
              <option value={Role.ADMIN}>Admin - Full access except billing</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
