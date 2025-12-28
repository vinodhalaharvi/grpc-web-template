import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCertificate, useRevokeCertificate, useRenewCertificate } from '../hooks/useApi';
import { CertificateStatus, KeyAlgorithm } from '../types';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  FileKey,
  Calendar,
  Key,
  Shield,
  Globe,
  Tag,
} from 'lucide-react';
import { useState } from 'react';

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cert, isLoading, error } = useCertificate(id!);
  const revokeMutation = useRevokeCertificate();
  const renewMutation = useRenewCertificate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!cert || !confirm('Are you sure you want to revoke this certificate?')) return;
    await revokeMutation.mutateAsync({ certId: cert.certId });
    navigate('/certificates');
  };

  const handleRenew = async () => {
    if (!cert) return;
    await renewMutation.mutateAsync(cert.certId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Certificate not found</p>
        <Link to="/certificates" className="btn btn-secondary mt-4 inline-flex">
          Back to Certificates
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
            to="/certificates"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {cert.commonName}
              </h1>
              <StatusBadge status={cert.status} />
            </div>
            <p className="text-slate-500 mt-1">Serial: {cert.serialNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Download
          </button>
          {cert.status === CertificateStatus.ACTIVE && (
            <button
              onClick={handleRenew}
              disabled={renewMutation.isPending}
              className="btn btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${renewMutation.isPending ? 'animate-spin' : ''}`} />
              Renew
            </button>
          )}
          {cert.status !== CertificateStatus.REVOKED && (
            <button
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="btn btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              Revoke
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Overview
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <InfoItem
                icon={Calendar}
                label="Valid From"
                value={new Date(cert.notBefore).toLocaleDateString()}
              />
              <InfoItem
                icon={Calendar}
                label="Valid Until"
                value={new Date(cert.notAfter).toLocaleDateString()}
                highlight={cert.daysRemaining <= 30}
              />
              <InfoItem
                icon={Key}
                label="Key Algorithm"
                value={`${getAlgorithmLabel(cert.keyAlgorithm)} ${cert.keySize}`}
              />
              <InfoItem
                icon={Shield}
                label="Signature Algorithm"
                value={cert.signatureAlgorithm}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Subject
            </h2>
            <div className="space-y-3">
              <SubjectItem label="Common Name (CN)" value={cert.subject.commonName} />
              {cert.subject.organization && (
                <SubjectItem label="Organization (O)" value={cert.subject.organization} />
              )}
              {cert.subject.organizationalUnit && (
                <SubjectItem label="Organizational Unit (OU)" value={cert.subject.organizationalUnit} />
              )}
              {cert.subject.country && (
                <SubjectItem label="Country (C)" value={cert.subject.country} />
              )}
              {cert.subject.state && (
                <SubjectItem label="State (ST)" value={cert.subject.state} />
              )}
              {cert.subject.locality && (
                <SubjectItem label="Locality (L)" value={cert.subject.locality} />
              )}
            </div>
          </div>

          {/* SANs */}
          {cert.san && cert.san.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-400" />
                Subject Alternative Names
              </h2>
              <div className="flex flex-wrap gap-2">
                {cert.san.map((name, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fingerprint */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Fingerprint (SHA-256)
            </h2>
            <div className="flex items-center gap-3">
              <code className="flex-1 p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 break-all">
                {cert.fingerprintSha256 || 'N/A'}
              </code>
              <button
                onClick={() => handleCopy(cert.fingerprintSha256 || '')}
                className="btn btn-secondary py-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={cert.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Days Remaining</span>
                <span
                  className={`font-semibold ${
                    cert.daysRemaining <= 0
                      ? 'text-red-600'
                      : cert.daysRemaining <= 30
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {cert.daysRemaining <= 0 ? 'Expired' : cert.daysRemaining}
                </span>
              </div>
            </div>

            {cert.daysRemaining > 0 && cert.daysRemaining <= 30 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  This certificate is expiring soon. Consider renewing it.
                </p>
              </div>
            )}
          </div>

          {/* Issuer Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Issuer
            </h2>
            <Link
              to={`/cas/${cert.caId}`}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{cert.issuerCn}</p>
                <p className="text-xs text-slate-500">View CA</p>
              </div>
            </Link>
          </div>

          {/* Tags */}
          {cert.tags && cert.tags.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-slate-400" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {cert.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Metadata
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-900">
                  {new Date(cert.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created By</span>
                <span className="text-slate-900">{cert.createdBy}</span>
              </div>
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
  highlight = false,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`font-medium ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>
          {value}
        </p>
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

function getAlgorithmLabel(algorithm: KeyAlgorithm): string {
  const labels = {
    [KeyAlgorithm.RSA]: 'RSA',
    [KeyAlgorithm.ECDSA]: 'ECDSA',
    [KeyAlgorithm.ED25519]: 'Ed25519',
    [KeyAlgorithm.UNSPECIFIED]: 'Unknown',
  };
  return labels[algorithm] || 'Unknown';
}
