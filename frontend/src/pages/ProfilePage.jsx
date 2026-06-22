import { useState, useEffect } from 'react';
import { api } from '../api';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import { ProfileSkeleton } from '../components/ui/Skeleton';

export default function ProfilePage({ user, onUpdate, showToast }) {
  const [initLoading, setInitLoading] = useState(true);
  const [name, setName] = useState(user.name);
  const [dept, setDept] = useState(user.dept || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setInitLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) return showToast('Name is required', 'error');
    setLoadingProfile(true);
    try {
      const updated = await api.updateMe({ name, dept });
      onUpdate(updated);
      showToast('Profile updated');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) return showToast('Enter current password', 'error');
    if (newPassword.length < 6) return showToast('New password min 6 characters', 'error');
    if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
    setLoadingPass(true);
    try {
      await api.updateMe({ currentPassword, newPassword });
      showToast('Password changed');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  if (initLoading) return <ProfileSkeleton />;

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all';

  return (
    <div className="p-4 md:p-7 page-enter max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Profile</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-4 flex items-center gap-4">
        <Avatar initials={user.avatar} size={52} />
        <div>
          <div className="text-sm font-semibold text-navy-900">{user.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 capitalize">{user.role === 'ADMIN' ? 'Administrator' : 'User'}</div>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-navy-900 mb-4">Personal Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Department</label>
            <input value={dept} onChange={e => setDept(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
            <input value={user.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={loadingProfile}
          className="mt-4 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors">
          {loadingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-900 mb-4">Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button onClick={handleChangePassword} disabled={loadingPass}
          className="mt-4 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors">
          {loadingPass ? 'Updating…' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
