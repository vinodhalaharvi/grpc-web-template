import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  useSessions,
  useRevokeSession,
  useAPIKeys,
  useCreateAPIKey,
  useRevokeAPIKey,
  useTenant,
  useUpdateTenant,
  useSubscription,
  useUsage,
} from '../hooks/useApi';
import {
  User,
  Shield,
  Key,
  Monitor,
  CreditCard,
  Building,
  Copy,
  Check,
  Trash2,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';

const tabs = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Security', href: '/settings/security', icon: Shield },
  { name: 'API Keys', href: '/settings/api-keys', icon: Key },
  { name: 'Sessions', href: '/settings/sessions', icon: Monitor },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Organization', href: '/settings/organization', icon: Building },
];

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={({ isActive }) =>
                `flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route index element={<Navigate to="/settings/profile" replace />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="api-keys" element={<APIKeysSettings />} />
        <Route path="sessions" element={<SessionsSettings />} />
        <Route path="billing" element={<BillingSettings />} />
        <Route path="organization" element={<OrganizationSettings />} />
      </Routes>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-2xl font-semibold">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div>
            <button className="btn btn-secondary text-sm">Change Photo</button>
            <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 2MB</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="input"
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
          />
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account security settings
        </p>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h3 className="font-medium text-slate-900 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" />
          </div>
          <button className="btn btn-primary">Update Password</button>
        </div>
      </div>

      {/* 2FA */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-slate-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <span
            className={`badge ${
              user?.twoFactorEnabled ? 'badge-success' : 'badge-neutral'
            }`}
          >
            {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <button className="btn btn-secondary mt-4">
          {user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
        </button>
      </div>
    </div>
  );
}

function APIKeysSettings() {
  const { data, isLoading } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const revokeMutation = useRevokeAPIKey();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKeys = data?.apiKeys || [];

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (name: string, scopes: string[]) => {
    const result = await createMutation.mutateAsync({ name, scopes });
    setNewKey(result.secret);
    setShowCreate(false);
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    await revokeMutation.mutateAsync(keyId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage API keys for programmatic access
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Save your API key now</p>
              <p className="text-sm text-amber-700 mt-1">
                This is the only time you'll see this key. Copy it and store it
                securely.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 p-2 bg-white rounded border border-amber-300 text-sm font-mono">
                  {newKey}
                </code>
                <button
                  onClick={() => handleCopy(newKey)}
                  className="btn btn-secondary py-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewKey(null)} className="p-1 hover:bg-amber-100 rounded">
              <X className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No API keys created yet</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th>Last Used</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.map((key) => (
                <tr key={key.keyId}>
                  <td className="font-medium text-slate-900">{key.name}</td>
                  <td>
                    <code className="text-sm text-slate-500">{key.keyPrefix}...</code>
                  </td>
                  <td className="text-slate-500">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-slate-500">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleRevoke(key.keyId)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateAPIKeyModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateAPIKeyModal({
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
    { value: 'certificates:write', label: 'Write Certificates' },
    { value: 'cas:read', label: 'Read CAs' },
    { value: 'cas:write', label: 'Write CAs' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Create API Key</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(name, scopes);
          }}
          className="p-6 space-y-4"
        >
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
            <label className="label">Scopes</label>
            <div className="space-y-2">
              {availableScopes.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setScopes([...scopes, scope.value]);
                      } else {
                        setScopes(scopes.filter((s) => s !== scope.value));
                      }
                    }}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
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

function SessionsSettings() {
  const { data, isLoading } = useSessions();
  const revokeMutation = useRevokeSession();

  const sessions = data?.sessions || [];

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    await revokeMutation.mutateAsync(sessionId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Sessions</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your active sessions across devices
        </p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No active sessions</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <div key={session.sessionId} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {session.browser} on {session.os}
                    </span>
                    {session.current && (
                      <span className="badge badge-success">Current</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {session.location} • {session.ipAddress}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Last active: {new Date(session.lastActiveAt).toLocaleString()}
                  </p>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleRevoke(session.sessionId)}
                    className="btn btn-ghost text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BillingSettings() {
  const { data: subscription } = useSubscription();
  const { data: usage } = useUsage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Billing</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-slate-900">Current Plan</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {subscription?.planName || 'Free'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {subscription?.status === 1 && 'Trial ends '}
              {subscription?.currentPeriodEnd &&
                new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <button className="btn btn-primary">Upgrade Plan</button>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-4">Usage</h3>
          <div className="space-y-4">
            <UsageBar
              label="Certificates"
              current={usage.certificatesCount}
              limit={usage.certificatesLimit}
            />
            <UsageBar
              label="Certificate Authorities"
              current={usage.casCount}
              limit={usage.casLimit}
            />
            <UsageBar
              label="Users"
              current={usage.usersCount}
              limit={usage.usersLimit}
            />
            <UsageBar
              label="API Keys"
              current={usage.apiKeysCount}
              limit={usage.apiKeysLimit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
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
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function OrganizationSettings() {
  const { data: tenant } = useTenant();
  const updateMutation = useUpdateTenant();

  const [name, setName] = useState(tenant?.name || '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Organization</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your organization settings
        </p>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <label className="label">Organization Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input max-w-md"
          />
        </div>

        <div>
          <label className="label">Default Certificate Settings</label>
          <div className="grid sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="text-xs text-slate-500">Validity Period</label>
              <select className="input mt-1">
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Expiry Warning</label>
              <select className="input mt-1">
                <option value={7}>7 days before</option>
                <option value={14}>14 days before</option>
                <option value={30}>30 days before</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between max-w-md">
          <div>
            <p className="font-medium text-slate-900">Auto Renewal</p>
            <p className="text-sm text-slate-500">
              Automatically renew certificates before expiry
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
