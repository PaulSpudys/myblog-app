import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Create the auth context
const AuthContext = createContext();

// Create a provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Admin emails - preserve your existing admin emails
  const adminEmails = ['pauliusss_s@yahoo.com', 'simonasiniauskaite@gmail.com'];
  
  // Check if the current user is an admin
  const isAdmin = currentUser && adminEmails.includes(currentUser.email);

  // Sign in function - preserved from your original code
  const login = async (email, password) => {
    try {
      setError('');
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  // Sign out function - preserved from your original code
  const logout = async () => {
    try {
      setError('');
      return await signOut(auth);
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  // Register new user function - new addition
  const register = async (email, password, displayName) => {
    try {
      setError('');
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with their display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      return userCredential.user;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  // Reset password function - new addition
  const resetPassword = async (email) => {
    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  // Helper function to format error messages - new addition
  function getErrorMessage(error) {
    // Format user-friendly error messages
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/weak-password':
        return 'The password is too weak. Please use a stronger password.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check the email or register.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      default:
        return error.message || 'An unknown error occurred. Please try again.';
    }
  }

  // Set up the auth state listener - preserved from your original code
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, []);

  // Context value - expanded with new functions
  const value = {
    currentUser,
    login,
    logout,
    isAdmin,
    register,
    resetPassword,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context - preserved from your original code
export function useAuth() {
  return useContext(AuthContext);
}