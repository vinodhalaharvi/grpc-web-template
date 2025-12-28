import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUpdateUser } from '../../hooks/useApi';
import { Camera, Save } from 'lucide-react';

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const updateMutation = useUpdateUser();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await updateMutation.mutateAsync({
      userId: user.userId,
      ...formData,
    });
    await refreshUser();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <p className="text-slate-500 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Avatar Section */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Avatar</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-2xl font-semibold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50">
              <Camera className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div>
            <button className="btn btn-secondary text-sm">Upload Photo</button>
            <p className="text-xs text-slate-500 mt-2">JPG, PNG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <h3 className="text-lg font-medium text-slate-900">Personal Information</h3>

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
          <p className="text-xs text-slate-500 mt-1">
            This is your login email and where notifications are sent
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn btn-primary"
          >
            {updateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preferences */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Preferences</h3>

        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-medium text-slate-900">Email Notifications</p>
            <p className="text-sm text-slate-500">
              Receive emails about certificate expiration
            </p>
          </div>
          <Toggle defaultChecked />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="font-medium text-slate-900">Weekly Reports</p>
            <p className="text-sm text-slate-500">
              Get weekly summary of certificate status
            </p>
          </div>
          <Toggle />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-slate-900">Marketing Emails</p>
            <p className="text-sm text-slate-500">
              Receive product updates and news
            </p>
          </div>
          <Toggle />
        </div>
      </div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-brand-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
