import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/Navbar'; // Import ThemeProvider
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HisBlog from './pages/HisBlog';
import HerBlog from './pages/HerBlog';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import BlogPostPage from './pages/BlogPostPage';
import TagsPage from './pages/TagsPage';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Profile from './components/Profile';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/his-blog" element={<HisBlog />} />
                <Route path="/her-blog" element={<HerBlog />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/post/:postId" element={<BlogPostPage />} />
                <Route path="/tags/:tag" element={<TagsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute requireAdmin={false}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;