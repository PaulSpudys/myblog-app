import React from 'react';
import AdminAddPost from '../components/AdminAddPost';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

function AdminPage() {
  const { currentUser } = useAuth();

  return (
    <div className="admin-page-container">
      <h1 className="admin-page-title">Blog Admin</h1>
      <p className="admin-welcome">Welcome, {currentUser.email}</p>
      <AdminAddPost />
    </div>
  );
}

export default AdminPage;