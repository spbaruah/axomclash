import React, { useState, useEffect } from 'react';
import './CollegeManagement.css';
import adminApi from '../../services/adminAxios';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await adminApi.get('/api/admin/colleges');
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      // Mock data for demo
      setColleges([
        {
          id: 1,
          name: 'Cotton University',
          city: 'Guwahati',
          state: 'Assam',
          member_count: 450,
          total_points: 125000,
          rank: 1
        },
        {
          id: 2,
          name: 'Gauhati University',
          city: 'Guwahati',
          state: 'Assam',
          member_count: 380,
          total_points: 98000,
          rank: 2
        },
        {
          id: 3,
          name: 'Tezpur University',
          city: 'Tezpur',
          state: 'Assam',
          member_count: 320,
          total_points: 85000,
          rank: 3
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="college-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading colleges...</p>
      </div>
    );
  }

  return (
    <div className="college-management">
      <div className="management-header">
        <h2>College Management</h2>
        <p>Manage all registered colleges and their rankings</p>
      </div>

      <div className="management-controls">
        <button className="add-college-btn">
          <span>🏫</span>
          Add New College
        </button>
      </div>

      <div className="colleges-grid">
        {colleges.map((college) => (
          <div key={college.id} className="college-card">
            <div className="college-header">
              <h3>{college.name}</h3>
              <span className="rank-badge">#{college.rank}</span>
            </div>
            <div className="college-info">
              <p><strong>Location:</strong> {college.city}, {college.state}</p>
              <p><strong>Members:</strong> {college.member_count}</p>
              <p><strong>Total Points:</strong> {college.total_points.toLocaleString()}</p>
            </div>
            <div className="college-actions">
              <button className="action-btn edit">✏️ Edit</button>
              <button className="action-btn view">👁️ View</button>
              <button className="action-btn delete">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollegeManagement;
