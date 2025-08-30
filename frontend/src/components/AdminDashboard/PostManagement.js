import React, { useState, useEffect } from 'react';
import './PostManagement.css';
import api from '../../services/axios';

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Mock data for demo
      setPosts([
        {
          id: 1,
          user: 'john_doe',
          college: 'Cotton University',
          type: 'photo',
          content: 'Amazing sunset at campus!',
          likes: 45,
          comments: 12,
          created_at: '2024-01-20'
        },
        {
          id: 2,
          user: 'jane_smith',
          college: 'Gauhati University',
          type: 'text',
          content: 'Great day at the library studying for finals!',
          likes: 23,
          comments: 8,
          created_at: '2024-01-19'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="post-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="post-management">
      <div className="management-header">
        <h2>Post Management</h2>
        <p>Monitor and manage user posts across all colleges</p>
      </div>

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
            <div className="post-header">
              <span className="post-type">{post.type}</span>
              <span className="post-date">{post.created_at}</span>
            </div>
            <div className="post-content">
              <p><strong>User:</strong> {post.user}</p>
              <p><strong>College:</strong> {post.college}</p>
              <p><strong>Content:</strong> {post.content}</p>
            </div>
            <div className="post-stats">
              <span>❤️ {post.likes}</span>
              <span>💬 {post.comments}</span>
            </div>
            <div className="post-actions">
              <button className="action-btn view">👁️ View</button>
              <button className="action-btn edit">✏️ Edit</button>
              <button className="action-btn delete">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostManagement;
