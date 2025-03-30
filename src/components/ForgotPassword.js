import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '/Users/psmedia/Desktop/blog/myblog-app/src/pages/LoginPage.css'; // Using your existing LoginPage styling

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      
      await resetPassword(email);
      
      setMessage('Check your email inbox for instructions to reset your password');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2 className="login-title">Reset Password</h2>
        
        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-success">{message}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-submit-button" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="login-options">
          <Link to="/login" className="login-link">Back to Login</Link>
          <Link to="/register" className="login-link">Create an Account</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;