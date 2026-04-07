import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div 
            className="text-2xl font-bold cursor-pointer hover:text-blue-200 transition" 
            onClick={() => navigate('/')}
          >
            UniHub {isAdmin && <span className="text-sm text-yellow-300 ml-2">[Admin]</span>}
          </div>
          <div className="flex gap-6 items-center">
            <button onClick={() => navigate('/')} className="hover:text-blue-200 transition">
              {user ? (isAdmin ? 'Dashboard' : 'Home') : 'Home'}
            </button>

            {user ? (
              <>
                {!isAdmin && (
                  <>
                    <button onClick={() => navigate('/my-events')} className="hover:text-blue-200 transition">
                      My Events
                    </button>
                    <button onClick={() => navigate('/cart')} className="hover:text-blue-200 transition">
                      Cart
                    </button>
                  </>
                )}
                <button onClick={() => navigate('/profile')} className="hover:text-blue-200 transition">
                  Profile
                </button>
                <div className="flex items-center gap-4 border-l border-blue-400 pl-4">
                  <span className="text-sm">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded transition font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded transition font-semibold"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2024 UniHub - University Event & Club Management System</p>
      </div>
    </footer>
  );
};
