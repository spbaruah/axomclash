import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, 
  FaUser, 
  FaGamepad, 
  FaComments, 
  FaTrophy, 
  FaSignOutAlt,
  FaFire,
  FaCog,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import './Navigation.css';

const Navigation = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      // Check if user is admin
      const isAdminUser = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
      
      if (isAdminUser) {
        // Admin logout - clear admin data and redirect
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('isAdmin');
        // Also clear any user data that might have been set
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Redirect to home page
        window.location.href = '/';
      } else {
        // Regular user logout
        await signOut();
      }
      // Close mobile menu after logout
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if user is admin
  const isAdminUser = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
  
  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
    { path: '/games', icon: FaGamepad, label: 'Games' },
    { path: '/chat', icon: FaComments, label: 'Chat' },
    { path: '/challenges', icon: FaFire, label: 'Challenges' },
    { path: '/leaderboard', icon: FaTrophy, label: 'Leaderboard' },
    // Only show Admin link if user is actually an admin
    ...(isAdminUser ? [{ path: '/admin', icon: FaCog, label: 'Admin' }] : [])
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="navigation"
      >
        <div className="nav-container">
          <div className="nav-brand">
            <img src="/image/logo.png" alt="CampusClash Logo" className="brand-logo" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="nav-links desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="nav-actions">
            <button
              onClick={handleLogout}
              className="logout-nav-btn"
              title="Sign Out"
            >
              <FaSignOutAlt />
              <span className="logout-label">Logout</span>
            </button>
            
            {/* Mobile Hamburger Button */}
            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Menu</span>
              <button
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close mobile menu"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mobile-menu-items">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-menu-item ${isActive ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <Icon />
                    <span className="mobile-menu-label">{item.label}</span>
                  </Link>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="mobile-menu-logout"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
