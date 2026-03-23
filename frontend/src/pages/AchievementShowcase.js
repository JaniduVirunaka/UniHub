import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function AchievementShowcase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  // State for the Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', dateAwarded: '', image: null });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  // --- ACCESS CONTROL ---
  const isSupervisor = club?.supervisor === currentUser?.id;
  const isActualPresident = club?.president?._id === currentUser?.id;
  const isVP = club?.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;

  // Exco (Pres, VP, Sec) can manage. 
  const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary'];
  const canManageAchievements = isPresident || club?.topBoard?.some(b => b.user?._id === currentUser?.id && allowedRoles.includes(b.role));

  // --- ACTIONS ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // We MUST use FormData to send files to the backend!
    const data = new FormData();
    data.append('userId', currentUser?.id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('dateAwarded', formData.dateAwarded);
    
    // Only append the image if they actually attached one
    if (formData.image) {
      data.append('image', formData.image);
    }

    const config = { headers: { 'Content-Type': 'multipart/form-data' } };

    if (editingId) {
      // EDIT ROUTE
      axios.put(`http://localhost:5000/api/clubs/${id}/achievements/${editingId}`, data, config)
        .then(res => {
          alert(res.data.message);
          resetForm();
          fetchClubData();
        })
        .catch(err => alert(err.response?.data?.message || "Error updating achievement."));
    } else {
      // CREATE ROUTE
      axios.post(`http://localhost:5000/api/clubs/${id}/achievements`, data, config)
        .then(res => {
          alert(res.data.message);
          resetForm();
          fetchClubData();
        })
        .catch(err => alert(err.response?.data?.message || "Error uploading achievement."));
    }
  };

  const handleDelete = (achvId) => {
    if (!window.confirm("Are you sure you want to delete this achievement? The photo will be removed.")) return;
    
    axios.delete(`http://localhost:5000/api/clubs/${id}/achievements/${achvId}`, {
      data: { requestorId: currentUser?.id }
    })
    .then(res => {
      alert(res.data.message);
      fetchClubData();
    })
    .catch(err => alert("Error deleting achievement."));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', dateAwarded: '', image: null });
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (achv) => {
    setFormData({ title: achv.title, description: achv.description, dateAwarded: achv.dateAwarded, image: null });
    setEditingId(achv._id);
    setShowForm(true);
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Trophy Room...</div>;

  return (
    <div className="container">
      <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid #f59e0b', textAlign: 'center', backgroundColor: '#fffbeb', marginBottom: '30px' }}>
        <h1 style={{ color: '#d97706', margin: '0 0 10px 0' }}>🏆 Official Trophy Room</h1>
        <p style={{ fontSize: '1.1rem', color: '#92400e', margin: 0 }}>
          Celebrating the milestones, victories, and history of {club.name}.
        </p>
      </div>

      {/* ADD NEW BUTTON (Exco Only) */}
      {canManageAchievements && !showForm && (
        <button className="btn" style={{ backgroundColor: '#f59e0b', marginBottom: '20px', fontWeight: 'bold' }} onClick={() => setShowForm(true)}>
          + Post New Achievement
        </button>
      )}

      {/* UPLOAD/EDIT FORM */}
      {showForm && (
        <div className="card" style={{ border: '1px solid #fcd34d', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Achievement' : 'Upload New Achievement'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Achievement Title</label>
              <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Best Tech Club 2025" />
            </div>
            
            <div className="form-group">
              <label>Date / Event</label>
              <input type="text" className="form-control" value={formData.dateAwarded} onChange={(e) => setFormData({...formData, dateAwarded: e.target.value})} required placeholder="e.g., March 15, 2026" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows="3" placeholder="Briefly describe what this was for..." />
            </div>

            <div className="form-group">
              <label>Upload Photo {editingId && "(Leave blank to keep current photo)"}</label>
              {/* FILE INPUT BLOCK */}
              <input 
                type="file" 
                className="form-control" 
                accept="image/*" 
                onChange={(e) => setFormData({...formData, image: e.target.files[0]})} 
                required={!editingId} // Only required if it's a new post!
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="btn" style={{ backgroundColor: '#10b981', margin: 0 }}>{editingId ? 'Save Changes' : 'Publish Achievement'}</button>
              <button type="button" className="btn" style={{ backgroundColor: '#6b7280', margin: 0 }} onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* GALLERY GRID */}
      {club.achievements?.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>No achievements posted yet. The trophy case is waiting!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          
          {/* Reverse map so the newest ones are at the top! */}
          {[...club.achievements].reverse().map((achv) => (
            <div key={achv._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* IMAGE HEADER - Renders from the backend /uploads folder */}
              <div style={{ height: '200px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <img 
                  src={`http://localhost:5000${achv.imageUrl}`} 
                  alt={achv.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found' }} // Fallback if image fails
                />
              </div>

              {/* CONTENT BODY */}
              <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {achv.dateAwarded}
                </span>
                <h3 style={{ margin: '0 0 10px 0', color: '#111827' }}>{achv.title}</h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: '0 0 20px 0', flexGrow: 1 }}>{achv.description}</p>
                
                {/* MANAGEMENT CONTROLS */}
                {(canManageAchievements || isSupervisor) && (
                  <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                    <button className="btn" style={{ flex: 1, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '6px', margin: 0 }} onClick={() => openEditForm(achv)}>
                      ✏️ Edit
                    </button>
                    <button className="btn" style={{ flex: 1, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px', margin: 0 }} onClick={() => handleDelete(achv._id)}>
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}

export default AchievementShowcase;