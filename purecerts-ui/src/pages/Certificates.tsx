import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCertificates } from '../hooks/useApi';
import { CertificateStatus, KeyAlgorithm } from '../types';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileKey,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
} from 'lucide-react';

export default function Certificates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const statusFilter = searchParams.get('status');
  const status = statusFilter
    ? (CertificateStatus[statusFilter.toUpperCase() as keyof typeof CertificateStatus] as CertificateStatus)
    : undefined;

  const { data, isLoading, error } = useCertificates({
    page,
    limit: 10,
    status,
    search: search || undefined,
  });

  const certificates = data?.certificates || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const toggleSelect = (certId: string) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCerts.length === certificates.length) {
      setSelectedCerts([]);
    } else {
      setSelectedCerts(certificates.map((c) => c.certId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500">
            Manage and monitor your SSL/TLS certificates
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link to="/certificates/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Issue Certificate
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryCard
            label="Total"
            value={summary.total}
            active={!statusFilter}
            onClick={() => setSearchParams({})}
          />
          <SummaryCard
            label="Active"
            value={summary.active}
            color="text-emerald-600"
            active={statusFilter === 'active'}
            onClick={() => setSearchParams({ status: 'active' })}
          />
          <SummaryCard
            label="Expiring"
            value={summary.expiring}
            color="text-amber-600"
            active={statusFilter === 'expiring'}
            onClick={() => setSearchParams({ status: 'expiring' })}
          />
          <SummaryCard
            label="Expired"
            value={summary.expired}
            color="text-red-600"
            active={statusFilter === 'expired'}
            onClick={() => setSearchParams({ status: 'expired' })}
          />
          <SummaryCard
            label="Revoked"
            value={summary.revoked}
            color="text-slate-600"
            active={statusFilter === 'revoked'}
            onClick={() => setSearchParams({ status: 'revoked' })}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by domain name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn btn-secondary">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedCerts.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-brand-50 border border-brand-200 rounded-lg">
          <span className="text-sm font-medium text-brand-700">
            {selectedCerts.length} selected
          </span>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-xs py-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Renew
            </button>
            <button className="btn btn-secondary text-xs py-1.5 text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
              Revoke
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            Failed to load certificates
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedCerts.length === certificates.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300"
                      />
                    </th>
                    <th>Common Name</th>
                    <th>Status</th>
                    <th>Issuer</th>
                    <th>Expires</th>
                    <th>Algorithm</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.map((cert) => (
                    <tr key={cert.certId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCerts.includes(cert.certId)}
                          onChange={() => toggleSelect(cert.certId)}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300"
                        />
                      </td>
                      <td>
                        <Link
                          to={`/certificates/${cert.certId}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {cert.commonName}
                        </Link>
                        {cert.san && cert.san.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            +{cert.san.length} SAN{cert.san.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={cert.status} />
                      </td>
                      <td className="text-slate-500">{cert.issuerCn}</td>
                      <td>
                        <ExpiryBadge daysRemaining={cert.daysRemaining} />
                      </td>
                      <td className="text-slate-500">
                        {getAlgorithmLabel(cert.keyAlgorithm)} {cert.keySize}
                      </td>
                      <td>
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === cert.certId ? null : cert.certId)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg"
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                          {menuOpen === cert.certId && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                <Link
                                  to={`/certificates/${cert.certId}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Link>
                                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <Copy className="w-4 h-4" />
                                  Copy PEM
                                </button>
                                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                  <RefreshCw className="w-4 h-4" />
                                  Renew
                                </button>
                                <hr className="my-1 border-slate-100" />
                                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                  Revoke
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
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 10 + 1} to{' '}
                  {Math.min(page * 10, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary py-1.5 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="btn btn-secondary py-1.5 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color = 'text-slate-900',
  active,
  onClick,
}: {
  label: string;
  value: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 bg-white rounded-xl border-2 text-left transition-all ${
        active
          ? 'border-brand-500 shadow-sm'
          : 'border-transparent shadow-sm hover:border-slate-200'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </button>
  );
}

function StatusBadge({ status }: { status: CertificateStatus }) {
  const config = {
    [CertificateStatus.ACTIVE]: { label: 'Active', className: 'badge-success' },
    [CertificateStatus.EXPIRING]: { label: 'Expiring', className: 'badge-warning' },
    [CertificateStatus.EXPIRED]: { label: 'Expired', className: 'badge-danger' },
    [CertificateStatus.REVOKED]: { label: 'Revoked', className: 'badge-neutral' },
    [CertificateStatus.UNSPECIFIED]: { label: 'Unknown', className: 'badge-neutral' },
  };
  const { label, className } = config[status] || config[CertificateStatus.UNSPECIFIED];
  return <span className={`badge ${className}`}>{label}</span>;
}

function ExpiryBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining <= 0) {
    return <span className="text-red-600 font-medium">Expired</span>;
  }
  if (daysRemaining <= 30) {
    return <span className="text-amber-600 font-medium">{daysRemaining} days</span>;
  }
  return <span className="text-slate-600">{daysRemaining} days</span>;
}

function getAlgorithmLabel(algorithm: KeyAlgorithm): string {
  const labels = {
    [KeyAlgorithm.RSA]: 'RSA',
    [KeyAlgorithm.ECDSA]: 'ECDSA',
    [KeyAlgorithm.ED25519]: 'Ed25519',
    [KeyAlgorithm.UNSPECIFIED]: 'Unknown',
  };
  return labels[algorithm] || 'Unknown';
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileKey className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No certificates yet
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        Get started by issuing your first SSL/TLS certificate
      </p>
      <Link to="/certificates/new" className="btn btn-primary inline-flex">
        <Plus className="w-4 h-4" />
        Issue Certificate
      </Link>
    </div>
  );
}
