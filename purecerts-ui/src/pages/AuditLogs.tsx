import { useState } from 'react';
import { useAuditLogs } from '../hooks/useApi';
import { AuditAction } from '../types';
import {
  Search,
  Filter,
  Download,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  FileKey,
  Building2,
  Users,
  Key,
  Shield,
} from 'lucide-react';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAuditLogs({ page, limit: 20 });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

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
          Track all actions and changes in your organization
        </p>
        <button className="btn btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user or action..."
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

      {/* Logs */}
      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No audit logs yet
            </h3>
            <p className="text-slate-500">
              Actions will appear here once users start using the system
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div
                  key={log.logId}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <ActionIcon action={log.action} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {log.userEmail}
                        </span>
                        <span className="text-slate-500">
                          {getActionDescription(log.action)}
                        </span>
                        {log.resourceId && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">
                            {log.resourceType}: {log.resourceId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span>{log.ipAddress}</span>
                      </div>
                    </div>
                    <ActionBadge action={log.action} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, pagination.total)} of {pagination.total}
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

function ActionIcon({ action }: { action: AuditAction }) {
  const iconMap: Record<number, { icon: typeof LogIn; color: string; bg: string }> = {
    [AuditAction.LOGIN]: { icon: LogIn, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    [AuditAction.LOGOUT]: { icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-100' },
    [AuditAction.LOGIN_FAILED]: { icon: LogIn, color: 'text-red-600', bg: 'bg-red-50' },
    [AuditAction.CERTIFICATE_ISSUED]: { icon: FileKey, color: 'text-blue-600', bg: 'bg-blue-50' },
    [AuditAction.CERTIFICATE_RENEWED]: { icon: FileKey, color: 'text-blue-600', bg: 'bg-blue-50' },
    [AuditAction.CERTIFICATE_REVOKED]: { icon: FileKey, color: 'text-red-600', bg: 'bg-red-50' },
    [AuditAction.CA_CREATED]: { icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    [AuditAction.CA_UPDATED]: { icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    [AuditAction.USER_CREATED]: { icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    [AuditAction.USER_INVITED]: { icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    [AuditAction.API_KEY_CREATED]: { icon: Key, color: 'text-amber-600', bg: 'bg-amber-50' },
    [AuditAction.API_KEY_REVOKED]: { icon: Key, color: 'text-red-600', bg: 'bg-red-50' },
    [AuditAction.TWO_FACTOR_ENABLED]: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    [AuditAction.TWO_FACTOR_DISABLED]: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  const config = iconMap[action] || { icon: ScrollText, color: 'text-slate-600', bg: 'bg-slate-100' };
  const Icon = config.icon;

  return (
    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
    </div>
  );
}

function ActionBadge({ action }: { action: AuditAction }) {
  const isDestructive = [
    AuditAction.LOGIN_FAILED,
    AuditAction.CERTIFICATE_REVOKED,
    AuditAction.CERTIFICATE_DELETED,
    AuditAction.CA_DELETED,
    AuditAction.USER_DELETED,
    AuditAction.API_KEY_REVOKED,
  ].includes(action);

  const isCreation = [
    AuditAction.CERTIFICATE_ISSUED,
    AuditAction.CA_CREATED,
    AuditAction.USER_CREATED,
    AuditAction.USER_INVITED,
    AuditAction.API_KEY_CREATED,
  ].includes(action);

  if (isDestructive) {
    return <span className="badge badge-danger">{getActionLabel(action)}</span>;
  }
  if (isCreation) {
    return <span className="badge badge-success">{getActionLabel(action)}</span>;
  }
  return <span className="badge badge-neutral">{getActionLabel(action)}</span>;
}

function getActionLabel(action: AuditAction): string {
  const labels: Record<number, string> = {
    [AuditAction.LOGIN]: 'Login',
    [AuditAction.LOGOUT]: 'Logout',
    [AuditAction.LOGIN_FAILED]: 'Failed',
    [AuditAction.PASSWORD_CHANGED]: 'Updated',
    [AuditAction.TWO_FACTOR_ENABLED]: 'Enabled',
    [AuditAction.TWO_FACTOR_DISABLED]: 'Disabled',
    [AuditAction.CERTIFICATE_ISSUED]: 'Issued',
    [AuditAction.CERTIFICATE_RENEWED]: 'Renewed',
    [AuditAction.CERTIFICATE_REVOKED]: 'Revoked',
    [AuditAction.CERTIFICATE_DELETED]: 'Deleted',
    [AuditAction.CA_CREATED]: 'Created',
    [AuditAction.CA_UPDATED]: 'Updated',
    [AuditAction.CA_DELETED]: 'Deleted',
    [AuditAction.USER_CREATED]: 'Created',
    [AuditAction.USER_UPDATED]: 'Updated',
    [AuditAction.USER_DELETED]: 'Deleted',
    [AuditAction.USER_INVITED]: 'Invited',
    [AuditAction.API_KEY_CREATED]: 'Created',
    [AuditAction.API_KEY_REVOKED]: 'Revoked',
  };
  return labels[action] || 'Action';
}

function getActionDescription(action: AuditAction): string {
  const descriptions: Record<number, string> = {
    [AuditAction.LOGIN]: 'signed in',
    [AuditAction.LOGOUT]: 'signed out',
    [AuditAction.LOGIN_FAILED]: 'failed to sign in',
    [AuditAction.PASSWORD_CHANGED]: 'changed their password',
    [AuditAction.TWO_FACTOR_ENABLED]: 'enabled two-factor authentication',
    [AuditAction.TWO_FACTOR_DISABLED]: 'disabled two-factor authentication',
    [AuditAction.CERTIFICATE_ISSUED]: 'issued a certificate',
    [AuditAction.CERTIFICATE_RENEWED]: 'renewed a certificate',
    [AuditAction.CERTIFICATE_REVOKED]: 'revoked a certificate',
    [AuditAction.CERTIFICATE_DELETED]: 'deleted a certificate',
    [AuditAction.CA_CREATED]: 'created a CA',
    [AuditAction.CA_UPDATED]: 'updated a CA',
    [AuditAction.CA_DELETED]: 'deleted a CA',
    [AuditAction.USER_CREATED]: 'created a user',
    [AuditAction.USER_UPDATED]: 'updated a user',
    [AuditAction.USER_DELETED]: 'deleted a user',
    [AuditAction.USER_INVITED]: 'invited a user',
    [AuditAction.API_KEY_CREATED]: 'created an API key',
    [AuditAction.API_KEY_REVOKED]: 'revoked an API key',
  };
  return descriptions[action] || 'performed an action';
}
