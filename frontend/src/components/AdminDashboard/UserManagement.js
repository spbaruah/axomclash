import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import adminApi from '../../services/adminAxios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for demo
      setUsers([
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          college_name: 'Cotton University',
          total_points: 1250,
          reputation_score: 85,
          is_online: true,
          created_at: '2024-01-15',
          status: 'active'
        },
        {
          id: 2,
          username: 'jane_smith',
          email: 'jane@example.com',
          college_name: 'Gauhati University',
          total_points: 890,
          reputation_score: 72,
          is_online: false,
          created_at: '2024-01-20',
          status: 'active'
        },
        {
          id: 3,
          username: 'mike_wilson',
          email: 'mike@example.com',
          college_name: 'Tezpur University',
          total_points: 2100,
          reputation_score: 95,
          is_online: true,
          created_at: '2024-01-10',
          status: 'suspended'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.college_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = (userId, action) => {
    // Handle user actions (suspend, activate, delete)
    console.log(`Action ${action} on user ${userId}`);
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>User Management</h2>
        <p>Manage all registered users and their accounts</p>
      </div>

      {/* Controls */}
      <div className="management-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="add-user-btn">
          <span>👥</span>
          Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>College</th>
              <th>Points</th>
              <th>Reputation</th>
              <th>Status</th>
              <th>Online</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="user-info">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="username">{user.username}</span>
                    <span className="email">{user.email}</span>
                  </div>
                </td>
                <td>{user.college_name}</td>
                <td>
                  <span className="points">{user.total_points.toLocaleString()}</span>
                </td>
                <td>
                  <span className={`reputation ${user.reputation_score >= 80 ? 'high' : user.reputation_score >= 60 ? 'medium' : 'low'}`}>
                    {user.reputation_score}
                  </span>
                </td>
                <td>
                  <span className={`status ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className={`online-status ${user.is_online ? 'online' : 'offline'}`}>
                    {user.is_online ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </td>
                <td>{user.created_at}</td>
                <td className="actions">
                  <button
                    className="action-btn view"
                    onClick={() => openUserModal(user)}
                  >
                    👁️
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleUserAction(user.id, 'edit')}
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn suspend"
                    onClick={() => handleUserAction(user.id, 'suspend')}
                  >
                    ⏸️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleUserAction(user.id, 'delete')}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={closeUserModal}>×</button>
            </div>
            <div className="modal-content">
              <div className="user-profile">
                <div className="profile-avatar">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h4>{selectedUser.username}</h4>
                  <p>{selectedUser.email}</p>
                  <p><strong>College:</strong> {selectedUser.college_name}</p>
                </div>
              </div>
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Points</span>
                  <span className="stat-value">{selectedUser.total_points.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Reputation Score</span>
                  <span className="stat-value">{selectedUser.reputation_score}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Status</span>
                  <span className={`stat-value status ${selectedUser.status}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Online Status</span>
                  <span className={`stat-value ${selectedUser.is_online ? 'online' : 'offline'}`}>
                    {selectedUser.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeUserModal}>Close</button>
              <button className="btn-primary">Edit User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
