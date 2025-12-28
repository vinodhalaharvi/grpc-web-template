import { useParams, Link } from 'react-router-dom';
import { useCA } from '../hooks/useApi';
import { CAStatus, CAType } from '../types';
import {
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  Key,
  Shield,
  FileKey,
} from 'lucide-react';

export default function CADetail() {
  const { id } = useParams<{ id: string }>();
  const { data: ca, isLoading, error } = useCA(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ca) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">CA not found</p>
        <Link to="/cas" className="btn btn-secondary mt-4 inline-flex">
          Back to CAs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/cas"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{ca.name}</h1>
              <StatusBadge status={ca.status} />
            </div>
            <p className="text-slate-500 mt-1">{getCATypeLabel(ca.type)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Overview
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <InfoItem
                icon={Calendar}
                label="Valid From"
                value={new Date(ca.notBefore).toLocaleDateString()}
              />
              <InfoItem
                icon={Calendar}
                label="Valid Until"
                value={new Date(ca.notAfter).toLocaleDateString()}
              />
              <InfoItem
                icon={Key}
                label="Key Algorithm"
                value={`${ca.keyAlgorithm === 1 ? 'RSA' : 'ECDSA'} ${ca.keySize}`}
              />
              <InfoItem
                icon={Shield}
                label="Signature Algorithm"
                value={ca.signatureAlgorithm}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Subject
            </h2>
            <div className="space-y-3">
              <SubjectItem label="Common Name (CN)" value={ca.subject.commonName} />
              {ca.subject.organization && (
                <SubjectItem label="Organization (O)" value={ca.subject.organization} />
              )}
              {ca.subject.country && (
                <SubjectItem label="Country (C)" value={ca.subject.country} />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Statistics
            </h2>
            <div className="space-y-4">
              <StatItem
                icon={FileKey}
                label="Certificates Issued"
                value={ca.stats?.certificatesIssued ?? 0}
              />
              <StatItem
                icon={FileKey}
                label="Active Certificates"
                value={ca.stats?.certificatesActive ?? 0}
                color="text-emerald-600"
              />
              <StatItem
                icon={FileKey}
                label="Revoked"
                value={ca.stats?.certificatesRevoked ?? 0}
                color="text-red-600"
              />
              <StatItem
                icon={FileKey}
                label="Expired"
                value={ca.stats?.certificatesExpired ?? 0}
                color="text-amber-600"
              />
            </div>
          </div>

          {/* Parent CA */}
          {ca.parentCaId && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Parent CA
              </h2>
              <Link
                to={`/cas/${ca.parentCaId}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">View Parent</p>
                  <p className="text-xs text-slate-500">{ca.parentCaId}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to={`/certificates/new?ca=${ca.caId}`}
                className="btn btn-secondary w-full justify-start"
              >
                <FileKey className="w-4 h-4" />
                Issue Certificate
              </Link>
              <button className="btn btn-secondary w-full justify-start">
                <Download className="w-4 h-4" />
                Download Chain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SubjectItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 font-mono">{value}</span>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color = 'text-slate-900',
}: {
  icon: typeof FileKey;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
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
