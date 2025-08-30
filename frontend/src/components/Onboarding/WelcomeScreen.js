import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const WelcomeScreen = ({ onNext, onLoginModeChange }) => {
  const { loginUser, isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const hasCheckedAdminRef = useRef(false);

  // Check if user is admin and redirect - only once after auth is loaded
  useEffect(() => {
    if (!authLoading && !hasCheckedAdminRef.current) {
      const adminStatus = isAdmin();
      if (adminStatus) {
        navigate('/admin');
      }
      hasCheckedAdminRef.current = true;
    }
  }, [authLoading]); // Only depend on authLoading

  // Notify parent component about login mode changes
  useEffect(() => {
    if (onLoginModeChange) {
      onLoginModeChange(showLogin);
    }
  }, [showLogin, onLoginModeChange]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await loginUser(loginData.email, loginData.password);
      
      // Check if it's an admin login
      if (response.isAdmin) {
        navigate('/admin');
      }
      // For regular users, they will be redirected by AuthContext
    } catch (error) {
      // Error is already handled by loginUser function
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  if (showLogin) {
    return (
      <div className="welcome-screen login-mode">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="welcome-header"
        >
          <h1>Welcome Back!</h1>
          <p>Sign in to continue your journey</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleLogin}
          className="login-form"
        >
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={loginData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={loginData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="welcome-btn primary"
            disabled={loading}
          >
            {loading ? 'Signing In...' : (
              <>
                <FaSignInAlt />
                Sign In
              </>
            )}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="welcome-footer"
        >
          <p>Don't have an account?</p>
          <button
            onClick={() => setShowLogin(false)}
            className="welcome-btn secondary"
          >
            Create Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="welcome-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="welcome-header"
      >
        <div className="welcome-logo">
          <img src="/image/logo2.png" alt="CampusClash Logo" className="welcome-logo-image" />
        </div>
        <h1>Welcome to CampusClash</h1>
        <p>Join the ultimate college vs college gaming experience</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="welcome-features"
      >
        <div className="feature">
          <div className="feature-icon">🎮</div>
          <h3>Compete & Win</h3>
          <p>Challenge other colleges in exciting games and competitions</p>
        </div>
        
        <div className="feature">
          <div className="feature-icon">🏆</div>
          <h3>Earn Points</h3>
          <p>Build your reputation and climb the leaderboards</p>
        </div>
        
        <div className="feature">
          <div className="feature-icon">👥</div>
          <h3>Connect</h3>
          <p>Meet students from across different colleges</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="welcome-actions"
      >
        <button
          onClick={onNext}
          className="welcome-btn primary"
        >
          <FaRocket />
          Start Your Journey!
        </button>
        
        <button
          onClick={() => setShowLogin(true)}
          className="welcome-btn secondary"
        >
          <FaSignInAlt />
          I Already Have an Account
        </button>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
