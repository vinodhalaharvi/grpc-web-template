import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSessions, useRevokeSession, useRevokeAllOtherSessions } from '../../hooks/useApi';
import {
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Trash2,
  Key,
  AlertTriangle,
} from 'lucide-react';

export default function SecuritySettings() {
  const { user } = useAuth();
  const { data: sessionsData } = useSessions();
  const revokeMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllOtherSessions();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const sessions = sessionsData?.sessions || [];

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session?')) return;
    await revokeMutation.mutateAsync(sessionId);
  };

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to end all other sessions?')) return;
    await revokeAllMutation.mutateAsync();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Security</h2>
        <p className="text-slate-500 mt-1">
          Manage your account security and active sessions
        </p>
      </div>

      {/* Password */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900">Password</h3>
            <p className="text-slate-500 text-sm mt-1">
              Last changed 30 days ago
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn btn-secondary"
          >
            <Key className="w-4 h-4" />
            Change Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                user?.twoFactorEnabled
                  ? 'bg-emerald-50'
                  : 'bg-amber-50'
              }`}
            >
              <Shield
                className={`w-6 h-6 ${
                  user?.twoFactorEnabled
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                Two-Factor Authentication
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {user?.twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>
          <button
            className={`btn ${
              user?.twoFactorEnabled ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            {user?.twoFactorEnabled ? 'Manage' : 'Enable'}
          </button>
        </div>

        {!user?.twoFactorEnabled && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Two-factor authentication is not enabled
              </p>
              <p className="text-sm text-amber-700 mt-1">
                We strongly recommend enabling 2FA to protect your account from
                unauthorized access.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="card">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900">Active Sessions</h3>
            <p className="text-slate-500 text-sm mt-1">
              Manage devices where you're logged in
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              className="btn btn-secondary text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              End All Other Sessions
            </button>
          )}
        </div>

        <ul className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <li key={session.sessionId} className="p-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <DeviceIcon deviceType={session.deviceType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {session.browser} on {session.os}
                  </p>
                  {session.current && (
                    <span className="badge badge-success">Current</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {session.ipAddress}
                  </span>
                  <span>{session.location}</span>
                  <span>
                    Last active:{' '}
                    {new Date(session.lastActiveAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => handleRevokeSession(session.sessionId)}
                  disabled={revokeMutation.isPending}
                  className="btn btn-ghost text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  const Icon = deviceType === 'mobile' ? Smartphone : Monitor;
  return (
    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-slate-600" />
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        </div>

        <form className="p-6 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
