import React, { useState, useEffect } from 'react';
import './DashboardStats.css';
import { API_URL } from '../../services/api';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalColleges: 0,
    totalPosts: 0,
    totalGames: 0,

    activeUsers: 0,
    totalPoints: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set mock data for demo
      setStats({
        totalUsers: 1250,
        totalColleges: 15,
        totalPosts: 3420,
        totalGames: 156,

        activeUsers: 89,
        totalPoints: 125000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Set mock data for demo
      setRecentActivity([
        { id: 1, type: 'user_registration', message: 'New user registered: john_doe', time: '2 minutes ago' },
        { id: 2, type: 'post_created', message: 'New post created by user: jane_smith', time: '5 minutes ago' },
        { id: 3, type: 'game_completed', message: 'Game completed: Ludo match between Cotton University and Gauhati University', time: '10 minutes ago' },
        { id: 4, type: 'challenge_completed', message: 'Challenge completed: Daily Login by 45 users', time: '15 minutes ago' },
        { id: 5, type: 'college_points', message: 'Cotton University gained 150 points', time: '20 minutes ago' }
      ]);
    }
  };

  if (isLoading) {
    return (
      <div className="stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      <div className="stats-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time statistics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="stat-change positive">+12% this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <h3>{stats.totalColleges}</h3>
            <p>Colleges</p>
            <span className="stat-change positive">+2 this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalPosts.toLocaleString()}</h3>
            <p>Total Posts</p>
            <span className="stat-change positive">+8% today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <h3>{stats.totalGames}</h3>
            <p>Games Played</p>
            <span className="stat-change positive">+15 this week</span>
          </div>
        </div>



        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
            <span className="stat-change positive">+5% today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.totalPoints.toLocaleString()}</h3>
            <p>Total Points</p>
            <span className="stat-change positive">+2,500 today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>89%</h3>
            <p>User Engagement</p>
            <span className="stat-change positive">+3% this week</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'user_registration' && '👤'}
                {activity.type === 'post_created' && '📝'}
                {activity.type === 'game_completed' && '🎮'}

                {activity.type === 'college_points' && '🏆'}
              </div>
              <div className="activity-content">
                <p>{activity.message}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <span>👥</span>
            Add New User
          </button>
          <button className="action-btn">
            <span>🏫</span>
            Add College
          </button>

          <button className="action-btn">
            <span>📢</span>
            Send Announcement
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
