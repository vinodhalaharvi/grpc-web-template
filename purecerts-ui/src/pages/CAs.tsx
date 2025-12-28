import { Link } from 'react-router-dom';
import { useCAs } from '../hooks/useApi';
import { CAStatus, CAType } from '../types';
import { Plus, Building2, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function CAs() {
  const { data, isLoading } = useCAs();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const cas = data?.cas || [];

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
        <p className="text-slate-500">
          Manage your root and intermediate certificate authorities
        </p>
        <Link to="/cas/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Create CA
        </Link>
      </div>

      {/* Grid */}
      {cas.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Certificate Authorities
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first CA to start issuing certificates
          </p>
          <Link to="/cas/new" className="btn btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Create CA
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cas.map((ca) => (
            <div
              key={ca.caId}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ca.name}</h3>
                    <p className="text-sm text-slate-500">
                      {getCATypeLabel(ca.type)}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === ca.caId ? null : ca.caId)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                  {menuOpen === ca.caId && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <Link
                          to={`/cas/${ca.caId}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <StatusBadge status={ca.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Active Certs</span>
                  <span className="font-medium text-slate-900">
                    {ca.stats?.certificatesActive ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Issued</span>
                  <span className="font-medium text-slate-900">
                    {ca.stats?.certificatesIssued ?? 0}
                  </span>
                </div>
              </div>

              <Link
                to={`/cas/${ca.caId}`}
                className="mt-4 btn btn-secondary w-full text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CAStatus }) {
  const config = {
    [CAStatus.ACTIVE]: { label: 'Active', className: 'badge-success' },
    [CAStatus.DISABLED]: { label: 'Disabled', className: 'badge-neutral' },
    [CAStatus.EXPIRED]: { label: 'Expired', className: 'badge-danger' },
    [CAStatus.UNSPECIFIED]: { label: 'Unknown', className: 'badge-neutral' },
  };
  const { label, className } = config[status] || config[CAStatus.UNSPECIFIED];
  return <span className={`badge ${className}`}>{label}</span>;
}

function getCATypeLabel(type: CAType): string {
  const labels = {
    [CAType.ROOT]: 'Root CA',
    [CAType.INTERMEDIATE]: 'Intermediate CA',
    [CAType.EXTERNAL]: 'External CA',
    [CAType.UNSPECIFIED]: 'Unknown',
  };
  return labels[type] || 'Unknown';
}
