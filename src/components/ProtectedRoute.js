import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAdmin }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  // If admin access is required, check if user is admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If any auth is required, check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;