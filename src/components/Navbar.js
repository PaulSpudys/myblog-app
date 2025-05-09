import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

// Create a ThemeContext for managing light/dark mode
const ThemeContext = React.createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          P & S Media Blog
        </Link>
        
        {/* Mobile Menu Button */}
        <button 
          className={`menu-toggle ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        {/* Navigation Links */}
        <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <li className="nav-item">
            {/* <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              Home
            </Link> */}
          </li>
          <li className="nav-item">
            <Link to="/his-blog" className="nav-link" onClick={() => setMenuOpen(false)}>
              His Blog
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/her-blog" className="nav-link" onClick={() => setMenuOpen(false)}>
              Her Blog
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </li>
          {isAdmin && (
            <li className="nav-item">
              <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            </li>
          )}
        </ul>
        
        {/* User Menu and Theme Toggle */}
        <div className="user-menu">
          {/* Theme Toggle Switch */}
          <div className="theme-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                aria-label="Toggle light/dark mode"
              />
              <span className="slider"></span>
            </label>
          </div>

          {currentUser ? (
            <div className="user-dropdown">
              <button 
                className="user-button" 
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User menu"
              >
                {currentUser.email.split('@')[0]}
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button onClick={handleLogout} className="dropdown-item">
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;