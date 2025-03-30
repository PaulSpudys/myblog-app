import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/LoginPage.css';// Using your existing LoginPage styling

function Profile() {
  const { currentUser, logout, isAdmin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setError('');
      setLoading(true);
      
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2 className="login-title">Your Profile</h2>
        
        {error && <div className="login-error">{error}</div>}
        
        <div className="profile-info">
          <div className="profile-field">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{currentUser.email}</span>
          </div>
          
          <div className="profile-field">
            <span className="profile-label">Display Name:</span>
            <span className="profile-value">{currentUser.displayName || 'Not set'}</span>
          </div>
          
          <div className="profile-field">
            <span className="profile-label">Account Type:</span>
            <span className="profile-value">{isAdmin ? 'Administrator' : 'User'}</span>
          </div>
        </div>
        
        <div className="profile-actions">
          {isAdmin && (
            <Link to="/admin" className="admin-button">
              Admin Dashboard
            </Link>
          )}
          
          <button 
            onClick={handleLogout} 
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? 'Logging Out...' : 'Log Out'}
          </button>
        </div>
        
        <div className="login-options">
          <Link to="/" className="login-link">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;