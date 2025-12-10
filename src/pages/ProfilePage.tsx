import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, getMe, updateMe } from '../api/userClient';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [allergies, setAllergies] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setError(null);
        const me = await getMe();

        if (!isMounted) return;

        updateUser(me);
        setFullName(me.full_name ?? '');
        setDietaryPreferences(me.dietary_preferences ?? '');
        setAllergies(me.allergies ?? '');
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [updateUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateMe({
        full_name: fullName.trim() || undefined,
        dietary_preferences: dietaryPreferences.trim() || undefined,
        allergies: allergies.trim() || undefined,
      });
      updateUser(updated);
      setSuccess('Profile updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }

    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setSuccess('Password updated');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          className="px-3 py-1 text-sm border rounded"
          onClick={() => {
            navigate('/login', { replace: true });
          }}
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Profile</p>
          <h1 className="text-3xl font-bold text-gray-900">Account & Settings</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Logout
        </button>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account info</h2>
            <p className="text-gray-600 text-sm">Your sign-in details and status.</p>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="font-medium text-gray-900">{user?.username || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-gray-900">{user?.is_active ? 'Active' : 'Deactivated'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Verification</span>
              <span className="font-medium text-gray-900">{user?.is_verified ? 'Verified' : 'Unverified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile details</h2>
            <p className="text-gray-600 text-sm">Update your personal info.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dietary">
                Dietary preferences
              </label>
              <input
                id="dietary"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="E.g., vegetarian, keto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="allergies">
                Allergies
              </label>
              <input
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="E.g., peanuts, dairy"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFullName(user?.full_name ?? '');
                  setDietaryPreferences(user?.dietary_preferences ?? '');
                  setAllergies(user?.allergies ?? '');
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          <p className="text-gray-600 text-sm">Update your password.</p>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleChangePassword}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="oldPassword">
              Current password
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmNewPassword">
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="md:col-span-3 flex gap-3">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {passwordSaving ? 'Updating...' : 'Change password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

