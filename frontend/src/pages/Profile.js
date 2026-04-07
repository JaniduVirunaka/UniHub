import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';

function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    department: user?.department || '',
    year: user?.year || '',
    phone: user?.phone || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await authService.updateProfile(formData);
      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      alert('Error updating profile');
    }
  };

  if (!user) {
    return <h2>Please login first</h2>;
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      {isEditing ? (
        <>
          <input name="name" value={formData.name} onChange={handleChange} />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <button onClick={() => setIsEditing(true)}>Edit Profile</button>
      )}
    </div>
  );
}

export default Profile;