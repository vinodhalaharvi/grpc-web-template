import { useState } from 'react';
import { useAPIKeys, useCreateAPIKey, useRevokeAPIKey } from '../../hooks/useApi';
import { APIKeyStatus } from '../../types';
import {
  Plus,
  Key,
  Copy,
  Trash2,
  Check,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function APIKeysSettings() {
  const { data, isLoading } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const revokeMutation = useRevokeAPIKey();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const apiKeys = data?.apiKeys || [];

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    await revokeMutation.mutateAsync(keyId);
  };

  const handleCreate = async (name: string, scopes: string[]) => {
    const result = await createMutation.mutateAsync({ name, scopes });
    setNewKeySecret(result.secret);
    setCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
        <p className="text-slate-500 mt-1">
          Manage API keys for programmatic access to PureCerts
        </p>
      </div>

      {/* New Key Secret Display */}
      {newKeySecret && (
        <div className="card p-6 border-2 border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800">API Key Created</h3>
              <p className="text-sm text-emerald-700 mt-1 mb-4">
                Copy your API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-white rounded-lg font-mono text-sm border border-emerald-200 break-all">
                  {newKeySecret}
                </code>
                <CopyButton text={newKeySecret} />
              </div>
              <button
                onClick={() => setNewKeySecret(null)}
                className="btn btn-secondary mt-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* Keys List */}
      <div className="card">
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No API Keys
            </h3>
            <p className="text-slate-500 mb-6">
              Create an API key to access PureCerts programmatically
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn btn-primary inline-flex"
            >
              <Plus className="w-4 h-4" />
              Create API Key
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {apiKeys.map((key) => (
              <li key={key.keyId} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{key.name}</p>
                    <StatusBadge status={key.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <code className="font-mono">{key.keyPrefix}...****</code>
                    <span>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    {key.lastUsedAt && (
                      <span>
                        Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {key.scopes.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {key.status === APIKeyStatus.ACTIVE && (
                  <button
                    onClick={() => handleRevoke(key.keyId)}
                    disabled={revokeMutation.isPending}
                    className="btn btn-ghost text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <CreateKeyModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: APIKeyStatus }) {
  const config = {
    [APIKeyStatus.ACTIVE]: { label: 'Active', className: 'badge-success' },
    [APIKeyStatus.REVOKED]: { label: 'Revoked', className: 'badge-danger' },
    [APIKeyStatus.EXPIRED]: { label: 'Expired', className: 'badge-warning' },
    [APIKeyStatus.UNSPECIFIED]: { label: 'Unknown', className: 'badge-neutral' },
  };
  const { label, className } = config[status] || config[APIKeyStatus.UNSPECIFIED];
  return <span className={`badge ${className}`}>{label}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="btn btn-secondary py-2">
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CreateKeyModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (name: string, scopes: string[]) => Promise<void>;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['certificates:read']);

  const availableScopes = [
    { value: 'certificates:read', label: 'Read Certificates' },
    { value: 'certificates:write', label: 'Manage Certificates' },
    { value: 'cas:read', label: 'Read CAs' },
    { value: 'cas:write', label: 'Manage CAs' },
    { value: 'users:read', label: 'Read Users' },
    { value: 'users:write', label: 'Manage Users' },
  ];

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate(name, scopes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Create API Key</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="My API Key"
              required
            />
          </div>

          <div>
            <label className="label">Permissions</label>
            <div className="space-y-2">
              {availableScopes.map((scope) => (
                <label
                  key={scope.value}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              The API key secret will only be shown once after creation. Store it securely.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              className="btn btn-primary flex-1"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Key'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
