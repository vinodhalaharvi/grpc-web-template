import { Link } from 'react-router-dom';
import { useCertificates, useCAs, useUsage } from '../hooks/useApi';
import { CertificateStatus } from '../types';
import {
  FileKey,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function Dashboard() {
  const { data: certData, isLoading: certsLoading } = useCertificates({ limit: 5 });
  const { data: casData, isLoading: casLoading } = useCAs();
  const { data: usage, isLoading: usageLoading } = useUsage();

  const isLoading = certsLoading || casLoading || usageLoading;
  const summary = certData?.summary;

  const stats = [
    {
      name: 'Total Certificates',
      value: summary?.total ?? 0,
      icon: FileKey,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/certificates',
    },
    {
      name: 'Active',
      value: summary?.active ?? 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      href: '/certificates?status=active',
    },
    {
      name: 'Expiring Soon',
      value: summary?.expiring ?? 0,
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      href: '/certificates?status=expiring',
    },
    {
      name: 'Expired',
      value: summary?.expired ?? 0,
      icon: XCircle,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-600',
      href: '/certificates?status=expired',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card p-6 bg-gradient-to-r from-brand-600 to-brand-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Certificate Overview
            </h2>
            <p className="text-brand-100">
              Monitor and manage your SSL/TLS certificates
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/certificates/new" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Issue Certificate
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.lightColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-brand-600">
              View all
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Usage Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Usage</h3>
            <Link
              to="/settings/billing"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Upgrade Plan
            </Link>
          </div>
          {usage && (
            <div className="space-y-5">
              <UsageBar
                label="Certificates"
                current={usage.certificatesCount}
                limit={usage.certificatesLimit}
                icon={FileKey}
              />
              <UsageBar
                label="CAs"
                current={usage.casCount}
                limit={usage.casLimit}
                icon={Building2}
              />
              <UsageBar
                label="Users"
                current={usage.usersCount}
                limit={usage.usersLimit}
                icon={Shield}
              />
            </div>
          )}
        </div>

        {/* Recent Certificates */}
        <div className="lg:col-span-2 card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Certificates
            </h3>
            <Link
              to="/certificates"
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {certData?.certificates?.length ? (
            <ul className="divide-y divide-slate-100">
              {certData.certificates.slice(0, 5).map((cert) => (
                <li key={cert.certId}>
                  <Link
                    to={`/certificates/${cert.certId}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileKey className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {cert.commonName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cert.daysRemaining > 0
                            ? `Expires in ${cert.daysRemaining} days`
                            : 'Expired'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={cert.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <FileKey className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No certificates yet</p>
              <Link
                to="/certificates/new"
                className="btn btn-primary mt-4 inline-flex"
              >
                Issue your first certificate
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CAs Overview */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Certificate Authorities
          </h3>
          <Link
            to="/cas"
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage CAs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {casData?.cas?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {casData.cas.slice(0, 6).map((ca) => (
              <Link
                key={ca.caId}
                to={`/cas/${ca.caId}`}
                className="p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {ca.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ca.type === 1 ? 'Root' : ca.type === 2 ? 'Intermediate' : 'External'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{ca.stats?.certificatesActive ?? 0} active certs</span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      ca.status === 1
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ca.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No certificate authorities</p>
            <Link to="/cas/new" className="btn btn-primary mt-4 inline-flex">
              Create your first CA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
  icon: Icon,
}: {
  label: string;
  current: number;
  limit: number;
  icon: typeof FileKey;
}) {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const color =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 75
      ? 'bg-amber-500'
      : 'bg-brand-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className="text-sm font-medium text-slate-900">
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
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
