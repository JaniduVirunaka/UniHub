import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- NEW: MINI CAROUSEL COMPONENT ---
// This handles the Next/Prev buttons for each individual achievement card
const ImageCarousel = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div style={{ height: '200px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#9ca3af' }}>No Images Available</span>
      </div>
    );
  }

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div style={{ height: '220px', position: 'relative', backgroundColor: '#000' }}>
      <img 
        src={`http://localhost:5000${images[currentIndex]}`} 
        alt={`${title} - slide ${currentIndex + 1}`} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} 
        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found' }}
      />
      
      {/* Only show navigation buttons if there is more than 1 image! */}
      {images.length > 1 && (
        <>
          <button onClick={handlePrev} style={{
            position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', 
            width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem'
          }}>
            &larr;
          </button>
          
          <button onClick={handleNext} style={{
            position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', 
            width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem'
          }}>
            &rarr;
          </button>

          {/* Image Counter Badge */}
          <div style={{
            position: 'absolute', bottom: '10px', right: '10px',
            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', 
            borderRadius: '12px', fontSize: '0.8rem'
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
function AchievementShowcase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // UPGRADED: 'image' is now an array called 'images'
  const [formData, setFormData] = useState({ title: '', description: '', dateAwarded: '', images: [] });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  const isSupervisor = club?.supervisor === currentUser?.id;
  const isActualPresident = club?.president?._id === currentUser?.id;
  const isVP = club?.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;

  const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary'];
  const canManageAchievements = isPresident || club?.topBoard?.some(b => b.user?._id === currentUser?.id && allowedRoles.includes(b.role));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('userId', currentUser?.id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('dateAwarded', formData.dateAwarded);
    
    // UPGRADED: Loop through the array of files and append each one!
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(file => {
        data.append('images', file); // 'images' matches the Multer array name
      });
    }

    const config = { headers: { 'Content-Type': 'multipart/form-data' } };

    if (editingId) {
      axios.put(`http://localhost:5000/api/clubs/${id}/achievements/${editingId}`, data, config)
        .then(res => { alert(res.data.message); resetForm(); fetchClubData(); })
        .catch(err => alert(err.response?.data?.message || "Error updating achievement."));
    } else {
      axios.post(`http://localhost:5000/api/clubs/${id}/achievements`, data, config)
        .then(res => { alert(res.data.message); resetForm(); fetchClubData(); })
        .catch(err => alert(err.response?.data?.message || "Error uploading achievement."));
    }
  };

  const handleDelete = (achvId) => {
    if (!window.confirm("Are you sure you want to delete this achievement? The photos will be removed.")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/achievements/${achvId}`, { data: { requestorId: currentUser?.id } })
    .then(res => { alert(res.data.message); fetchClubData(); })
    .catch(err => alert("Error deleting achievement."));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', dateAwarded: '', images: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (achv) => {
    setFormData({ title: achv.title, description: achv.description, dateAwarded: achv.dateAwarded, images: [] });
    setEditingId(achv._id);
    setShowForm(true);
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Trophy Room...</div>;

  return (
    <div className="container">
      <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      <div className="card" style={{ borderTop: '4px solid #f59e0b', textAlign: 'center', backgroundColor: '#fffbeb', marginBottom: '30px' }}>
        <h1 style={{ color: '#d97706', margin: '0 0 10px 0' }}>🏆 Official Trophy Room</h1>
        <p style={{ fontSize: '1.1rem', color: '#92400e', margin: 0 }}>
          Celebrating the milestones, victories, and history of {club.name}.
        </p>
      </div>

      {canManageAchievements && !showForm && (
        <button className="btn" style={{ backgroundColor: '#f59e0b', marginBottom: '20px', fontWeight: 'bold' }} onClick={() => setShowForm(true)}>
          + Post New Achievement
        </button>
      )}

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
              <label>Upload Photos {editingId && "(Uploading new photos will replace the old ones)"}</label>
              <input 
                type="file" 
                className="form-control" 
                accept="image/*" 
                multiple // <-- THIS MAGIC KEYWORD ALLOWS MULTIPLE SELECTIONS
                onChange={(e) => setFormData({...formData, images: Array.from(e.target.files)})} 
                required={!editingId} 
              />
              <small style={{ color: '#6b7280' }}>Hold CTRL (or CMD) to select multiple photos at once.</small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="btn" style={{ backgroundColor: '#10b981', margin: 0 }}>{editingId ? 'Save Changes' : 'Publish Achievement'}</button>
              <button type="button" className="btn" style={{ backgroundColor: '#6b7280', margin: 0 }} onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {club.achievements?.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>No achievements posted yet. The trophy case is waiting!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          
          {[...club.achievements].reverse().map((achv) => {
            
            // BACKWARDS COMPATIBILITY FIX: 
            // If they have the new array, use it. If they have the old string from the first test, wrap it in an array!
            const renderImages = achv.imageUrls && achv.imageUrls.length > 0 
              ? achv.imageUrls 
              : (achv.imageUrl ? [achv.imageUrl] : []);

            return (
              <div key={achv._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* RENDER THE SLICK IMAGE CAROUSEL COMPONENT */}
                <ImageCarousel images={renderImages} title={achv.title} />

                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {achv.dateAwarded}
                  </span>
                  <h3 style={{ margin: '0 0 10px 0', color: '#111827' }}>{achv.title}</h3>
                  <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: '0 0 20px 0', flexGrow: 1 }}>{achv.description}</p>
                  
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
            );
          })}

        </div>
      )}
    </div>
  );
}

export default AchievementShowcase;