import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Hash, BookOpen, Phone, Calendar, LogOut, Pencil, X, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';
import api from '../config/api';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/FormInput';

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 px-4 py-3 dark:bg-white/5">
      <Icon size={16} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
      <span className="min-w-[110px] text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user: currentUser, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:       currentUser?.name       || '',
    department: currentUser?.department || '',
    year:       currentUser?.year       || '',
    phone:      currentUser?.phone      || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!currentUser) return <Navigate to="/login" replace />;

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await authService.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = currentUser.name.charAt(0).toUpperCase();
  const uploadsBase = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : '';
  const avatarUrl = currentUser.profilePicture ? `${uploadsBase}/uploads/profiles/${currentUser.profilePicture}` : null;

  return (
    <PageWrapper title="My Profile">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* ── Sidebar ── */}
          <Card variant="glass" padding="lg" className="flex flex-col items-center gap-4 text-center">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white shadow-lg shadow-indigo-500/30">
                    {initials}
                  </div>
                )}
              </div>

              <input id="profilePicInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedFile(f);
                setPreview(URL.createObjectURL(f));
                setUploadError('');
              }} />

              {editing && (
                <label htmlFor="profilePicInput" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 cursor-pointer">
                  <Camera size={14} /> Change picture
                </label>
              )}

              {preview && (
                <div className="mt-2 flex w-full items-center gap-2">
                  <img src={preview} alt="preview" className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex gap-2">
                    <button type="button" className="rounded-2xl bg-indigo-600 px-3 py-1 text-white" onClick={async () => {
                      setUploading(true);
                      setUploadError('');
                      try {
                        const fd = new FormData();
                        fd.append('profilePicture', selectedFile);
                        const res = await authService.uploadProfilePicture(fd);
                        updateUser(res.data.user);
                        setSelectedFile(null);
                        setPreview(null);
                      } catch (err) {
                        setUploadError(err?.response?.data?.message || 'Upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }}>{uploading ? 'Uploading...' : 'Upload'}</button>
                    <button type="button" className="rounded-2xl bg-white/10 px-3 py-1" onClick={() => { setPreview(null); setSelectedFile(null); }}>{'Cancel'}</button>
                  </div>
                </div>
              )}

              {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            </div>

            <span className="rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
              {currentUser.role}
            </span>

            {currentUser.studentId && (
              <p className="text-xs text-slate-400">ID: {currentUser.studentId}</p>
            )}

            <Button
              variant="danger"
              size="sm"
              className="mt-2 w-full"
              leftIcon={<LogOut size={15} />}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Card>

          {/* ── Main content ── */}
          <Card variant="glass" padding="lg">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-white/10">
              <h3 className="font-bold text-slate-900 dark:text-white">Account Settings</h3>
              {!editing && (
                <Button size="sm" variant="secondary" leftIcon={<Pencil size={14} />} onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
                {error}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <FormInput label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <FormInput label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Year</label>
                  <select
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                  >
                    <option value="">—</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <div className="flex gap-3">
                  <Button type="submit" isLoading={saving} leftIcon={<Save size={15} />} className="flex-1">
                    Save Changes
                  </Button>
                  <Button type="button" variant="secondary" leftIcon={<X size={15} />} onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <ProfileRow icon={User}    label="Name"       value={currentUser.name} />
                <ProfileRow icon={Mail}    label="Email"      value={currentUser.email} />
                {currentUser.studentId  && <ProfileRow icon={Hash}     label="Student ID"  value={currentUser.studentId} />}
                {currentUser.department && <ProfileRow icon={BookOpen} label="Department"  value={currentUser.department} />}
                {currentUser.year       && <ProfileRow icon={Calendar} label="Year"        value={`Year ${currentUser.year}`} />}
                {currentUser.phone      && <ProfileRow icon={Phone}    label="Phone"       value={currentUser.phone} />}
              </div>
            )}
          </Card>

        </div>
      </div>
    </PageWrapper>
  );
}

export default Profile;
