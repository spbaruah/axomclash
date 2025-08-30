import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Onboarding from './components/Onboarding/Onboarding';
import Home from './components/Home/Home';
import Profile from './components/Profile/Profile';
import UserProfile from './components/Profile/UserProfile';
import Games from './components/Games/Games';
import Chat from './components/Chat/Chat';
import Challenges from './components/Challenges/Challenges';
import Leaderboard from './components/Leaderboard/Leaderboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import CreatePostRedirect from './components/Home/CreatePostRedirect';
import LoadingSpinner from './components/common/LoadingSpinner';

import BottomNavigation from './components/common/BottomNavigation';

// Styles
import './styles/App.css';
import './styles/globals.css';

// React Router future flags to suppress deprecation warnings
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Check user status once
  const userStatus = user;
  if (!userStatus) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Admin authentication is already checked at AppContent level
  // This is just a fallback for direct navigation
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');
  
  if (!adminToken || !adminData) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }
  
  // If admin is logged in, show admin routes
  if (isAdmin()) {
    console.log('AppContent: Admin authenticated, rendering admin routes');
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }
  
  // Check user status for regular users
  const userStatus = user;
  if (!userStatus) {
    return (
      <Routes>
        <Route path="/login" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Regular user routing
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/games" element={<Games />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/create-post" element={<CreatePostRedirect />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Show BottomNavigation on all pages except admin */}
      <BottomNavigation />
    </SocketProvider>
  );
};

// App Component
const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router {...router}>
          <div className="App">
            <AppContent />
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerClassName=""
              containerStyle={{}}
              toastOptions={{
                className: '',
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#34C759',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#FF3B30',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
