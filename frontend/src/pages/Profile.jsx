import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';

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

  if (!currentUser) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* Left Sidebar: User Info */}
      <div className="card" style={{ flex: '1 1 30%', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 15px auto' }}>
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ margin: '10px 0 5px 0' }}>{currentUser.name}</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{currentUser.email}</p>
        <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 12px', backgroundColor: '#e5e7eb', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
          Role: {currentUser.role}
        </span>

        {currentUser.studentId && (
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ID: {currentUser.studentId}
          </p>
        )}
        {currentUser.department && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0' }}>
            {currentUser.department}{currentUser.year ? ` · Year ${currentUser.year}` : ''}
          </p>
        )}

        <div style={{ marginTop: '20px' }}>
          <button className="btn" style={{ backgroundColor: '#ef4444', width: '100%' }} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="card" style={{ flex: '1 1 70%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Account Settings</h3>
          {!editing && (
            <button className="btn" onClick={() => setEditing(true)} style={{ padding: '6px 16px', fontSize: '0.9rem' }}>
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </label>
            <label>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Department</span>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </label>
            <label>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Year</span>
              <select
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="">—</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </label>
            <label>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Phone</span>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} className="btn" style={{ flex: 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn" style={{ flex: 1, backgroundColor: '#6b7280' }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Row label="Name"       value={currentUser.name} />
            <Row label="Email"      value={currentUser.email} />
            {currentUser.studentId  && <Row label="Student ID"  value={currentUser.studentId} />}
            {currentUser.department && <Row label="Department"  value={currentUser.department} />}
            {currentUser.year       && <Row label="Year"        value={`Year ${currentUser.year}`} />}
            {currentUser.phone      && <Row label="Phone"       value={currentUser.phone} />}
          </div>
        )}
      </div>

    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <span style={{ fontWeight: 600, minWidth: '100px', color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default Profile;
