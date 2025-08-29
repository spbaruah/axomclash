import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';
import DashboardStats from './DashboardStats';
import UserManagement from './UserManagement';
import CollegeManagement from './CollegeManagement';
import PostManagement from './PostManagement';
import ReportsManagement from './ReportsManagement';

import GameManagement from './GameManagement';
import BannerManagement from './BannerManagement';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();

  useEffect(() => {
    // Check if user is admin using the hook
    if (!isAdmin()) {
      console.log('AdminDashboard useEffect - user is not admin, redirecting to login');
      // Add a small delay to ensure state is properly updated
      setTimeout(() => {
        navigate('/login');
      }, 100);
      return;
    }

    // Get admin data from localStorage
    const userData = JSON.parse(localStorage.getItem('adminData') || '{}');
    console.log('AdminDashboard useEffect - setting admin data and loading false');
    setAdminData(userData);
    setIsLoading(false);
  }, [isAdmin, navigate]);

  // Add a second useEffect to handle admin data updates
  useEffect(() => {
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      try {
        const parsedData = JSON.parse(adminData);
        setAdminData(parsedData);
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Use the signOut function from AuthContext to properly clear all auth data
    signOut();
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'users':
        return <UserManagement />;
      case 'colleges':
        return <CollegeManagement />;
      case 'posts':
        return <PostManagement />;
      case 'reports':
        return <ReportsManagement />;

      case 'games':
        return <GameManagement />;
      case 'banners':
        return <BannerManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardStats />;
    }
  };

  if (isLoading || !adminData) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <img src="/image/logo.png" alt="CampusClash Logo" className="admin-logo-image" />
          </div>
          <span className="admin-role">{adminData?.role || 'Admin'}</span>
        </div>
        <div className="admin-header-right">
          <div className="admin-info">
            <span className="admin-email">{adminData?.email}</span>
            <span className="admin-username">{adminData?.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`nav-tab ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          🏫 Colleges
        </button>
        <button
          className={`nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts
        </button>
        <button
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚨 Reports
        </button>

        <button
          className={`nav-tab ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          🎮 Games
        </button>
        <button
          className={`nav-tab ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          🖼️ Banners
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
