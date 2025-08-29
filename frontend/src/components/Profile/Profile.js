import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEdit, FaTrophy, FaUsers, FaCalendar, FaMapMarkerAlt, FaSignOutAlt, FaSave, FaTimes, FaCamera, FaHeart, FaComment, FaShare, FaBookmark, FaBan, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile, uploadCoverPhoto, deleteCoverPhoto, uploadProfilePicture, deleteProfilePicture, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const fileInputRef = React.useRef(null);
  const avatarInputRef = React.useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'saved', or 'blocked'
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);

  // Fetch user posts and saved posts
  useEffect(() => {
    console.log('Profile useEffect triggered, userProfile:', userProfile);
    console.log('User profile ID:', userProfile?.id);
    console.log('User profile username:', userProfile?.username);
    if (userProfile?.id) {
      console.log('User profile ID found, fetching posts and saved posts');
      fetchUserPosts();
      fetchSavedPosts();
      fetchBlockedUsers();
    } else {
      console.log('No user profile ID found');
    }
  }, [userProfile?.id, fetchUserPosts, fetchSavedPosts, fetchBlockedUsers]);

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      // Fetch user's own posts; include token so private posts are included for owner
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/posts/user/${userProfile.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setUserPosts(Array.isArray(data) ? data : (data.posts || []));
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      // For demo purposes, create some sample posts
      setUserPosts([
        {
          id: 1,
          content: "Just completed an amazing challenge! 🎯",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          likes_count: 15,
          comments_count: 3,
          shares_count: 1
        },
        {
          id: 2,
          content: "Great game session with friends today! 🎮",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          likes_count: 8,
          comments_count: 2,
          shares_count: 0
        },
        {
          id: 3,
          content: "Excited about the new features coming to CampusClash! 🚀",
          created_at: new Date(Date.now() - 259200000).toISOString(),
          likes_count: 22,
          comments_count: 5,
          shares_count: 2
        }
      ]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlockedUsers(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/users/blocked/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  const unblockUser = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/users/block/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  const fetchSavedPosts = async () => {
    try {
      setLoadingSavedPosts(true);
      const token = localStorage.getItem('authToken');
      console.log('Fetching saved posts with token:', token ? 'Token exists' : 'No token');
      
      // Decode the token to see the user ID
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', payload);
          console.log('User ID from token:', payload.userId);
        } catch (e) {
          console.log('Could not decode token:', e);
        }
      }
      
      const response = await fetch('/api/posts/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Saved posts response status:', response.status);
      console.log('Saved posts response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved posts data:', data);
        console.log('Saved posts array length:', data.savedPosts ? data.savedPosts.length : 'undefined');
        setSavedPosts(data.savedPosts || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch saved posts:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  const handleUnsavePost = async (postId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setSavedPosts(prev => prev.filter(post => post.id !== postId));
        toast.success('Post removed from saved posts');
      }
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Failed to remove post from saved posts');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEdit = () => {
    setEditData({
      username: userProfile.username || '',
      bio: userProfile.bio || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      // Build a sanitized payload: trim strings, omit empty strings, and only include valid numbers
      const payload = {};
      if (typeof editData.username === 'string') {
        const v = editData.username.trim();
        if (v) payload.username = v;
      }
      if (typeof editData.bio === 'string') {
        const v = editData.bio.trim();
        // Allow empty bio to clear? Keep consistent: send even empty to allow clearing
        payload.bio = v;
      }

      await updateProfile(payload);
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (!userProfile) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Removed year options as Year of Study is no longer used

  const handleCoverButtonClick = () => {
    setShowCoverMenu(prev => !prev);
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      await uploadCoverPhoto(file);
    } catch (err) {
      // handled in context
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowCoverMenu(false);
    }
  };

  const handleDeleteCover = async () => {
    try {
      setIsUploadingCover(true);
      await deleteCoverPhoto();
    } finally {
      setIsUploadingCover(false);
      setShowCoverMenu(false);
    }
  };

  return (
    <div className="profile-container">
      {/* Cover Photo Section */}
      <div className="profile-cover" style={{ backgroundImage: userProfile.cover_photo ? `url(${userProfile.cover_photo})` : undefined }}>
        <div className="cover-overlay"></div>
        
        {/* Back Arrow */}
        <div className="back-arrow" onClick={() => navigate('/')} title="Back to Home">
          <FaArrowLeft />
        </div>
        
        <div className="cover-action-fab" onClick={handleCoverButtonClick} title="Cover actions">
          <FaCamera />
        </div>
        {showCoverMenu && (
          <div className="cover-menu">
            <button className="cover-menu-item" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={isUploadingCover}>
              Upload cover photo
            </button>
            {userProfile.cover_photo && (
              <button className="cover-menu-item danger" onClick={handleDeleteCover} disabled={isUploadingCover}>
                Delete cover photo
              </button>
            )}
          </div>
        )}
        <div className="cover-content">
          <h1 className="cover-name">{userProfile.username}</h1>
          <p className="cover-subtitle">{userProfile.college_name}</p>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCoverChange} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Main Profile Section */}
      <div className="profile-main">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-header"
        >
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {userProfile.profile_picture ? (
                <img 
                  src={userProfile.profile_picture} 
                  alt={userProfile.username}
                  className="avatar-image"
                />
              ) : (
                <FaUser />
              )}
              <div className="avatar-upload" onClick={() => avatarInputRef.current && avatarInputRef.current.click()} title="Change profile photo">
                <FaCamera />
              </div>
            </div>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setIsUploadingAvatar(true);
                await uploadProfilePicture(file);
              } finally {
                setIsUploadingAvatar(false);
                if (avatarInputRef.current) avatarInputRef.current.value = '';
              }
            }} style={{ display: 'none' }} />
            <div className="profile-basic-info">
              <h2 className="profile-name">{userProfile.username}</h2>
              <p className="profile-college">{userProfile.college_name}</p>
            </div>
          </div>
          
          <div className="profile-actions-header">
            {isEditing ? (
              <div className="edit-actions">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="btn btn-primary"
                >
                  <FaSave />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="btn btn-secondary"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-actions-main">
                <button
                  onClick={handleEdit}
                  className="btn btn-primary"
                >
                  <FaEdit />
                  Edit Profile
                </button>
                {userProfile.profile_picture && (
                  <button
                    onClick={async () => {
                      setIsUploadingAvatar(true);
                      try { await deleteProfilePicture(); } finally { setIsUploadingAvatar(false); }
                    }}
                    className="btn btn-secondary"
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                >
                  <FaSignOutAlt />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile Content Grid */}
        <div className="profile-content">
          {/* Left Column */}
          <div className="profile-left-column">
            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="profile-section"
            >
              <h3 className="section-title">About</h3>
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                <div className="about-content">
                  {userProfile.bio && (
                    <div className="about-item">
                      <FaUser />
                      <span>{userProfile.bio}</span>
                    </div>
                  )}
                  <div className="about-item">
                    <FaMapMarkerAlt />
                    <span>{userProfile.city}, {userProfile.state}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="profile-section"
            >
              <h3 className="section-title">Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">
                    <FaTrophy />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{userProfile.total_points || 0}</div>
                    <div className="stat-label">Total Points</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <FaUsers />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">#{userProfile.college_rank || 'N/A'}</div>
                    <div className="stat-label">College Rank</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <FaCalendar />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="stat-label">Member Since</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Posts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="profile-section"
            >
              <div className="posts-tabs">
                <button 
                  className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  My Posts
                </button>
                <button 
                  className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                  <FaBookmark /> Saved Posts
                </button>
                <button 
                  className={`tab-button ${activeTab === 'blocked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('blocked')}
                >
                  <FaBan /> Blocked Users
                </button>
              </div>

              {activeTab === 'posts' && (
                <>
                  {loadingPosts ? (
                    <div className="posts-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading posts...</p>
                    </div>
                  ) : userPosts.length > 0 ? (
                    <div className="posts-list">
                      {userPosts.map((post) => (
                        <div key={post.id} className="post-item">
                          <div className="post-header">
                            <div className="post-author">
                              <div className="post-avatar">
                                {userProfile.profile_picture ? (
                                  <img src={userProfile.profile_picture} alt={userProfile.username} />
                                ) : (
                                  <FaUser />
                                )}
                              </div>
                              <div className="post-info">
                                <div className="post-author-name">{userProfile.username}</div>
                                <div className="post-college-name">{userProfile.college_name}</div>
                                <div className="post-time">{formatDate(post.created_at)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="post-content">
                            {post.content}
                            {post.media_urls && post.media_urls.length > 0 && (
                              <div className="post-media">
                                {post.media_urls.map((url, idx) => (
                                  /\.(mp4|webm|ogg)$/i.test(url)
                                    ? (
                                      <video key={idx} src={url} controls className="post-media-item" />
                                    ) : (
                                      <img key={idx} src={url} alt="Post media" className="post-media-item" />
                                    )
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="post-actions">
                            <div className="post-action">
                              <FaHeart />
                              <span>{post.likes_count}</span>
                            </div>
                            <div className="post-action">
                              <FaComment />
                              <span>{post.comments_count}</span>
                            </div>
                            <div className="post-action">
                              <FaShare />
                              <span>{post.shares_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-posts">
                      <p>No posts yet. Start sharing your thoughts!</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'saved' && (
                <>
                  {console.log('Rendering saved tab, savedPosts:', savedPosts, 'loadingSavedPosts:', loadingSavedPosts)}
                  {loadingSavedPosts ? (
                    <div className="posts-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading saved posts...</p>
                    </div>
                  ) : savedPosts.length > 0 ? (
                    <div className="posts-list">
                      {savedPosts.map((post) => (
                        <div key={post.id} className="post-item saved-post">
                          <div className="post-header">
                            <div className="post-author">
                              <div className="post-avatar">
                                {post.profile_picture ? (
                                  <img src={post.profile_picture} alt={post.username} />
                                ) : (
                                  <FaUser />
                                )}
                              </div>
                              <div className="post-info">
                                <div className="post-author-name">{post.username}</div>
                                <div className="post-college-name">{post.college_name}</div>
                                <div className="post-time">
                                  Saved on {formatDate(post.saved_at)}
                                </div>
                              </div>
                            </div>
                            <button 
                              className="unsave-button"
                              onClick={() => handleUnsavePost(post.id)}
                              title="Remove from saved posts"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <div className="post-content">
                            {post.content}
                            {post.media_urls && post.media_urls.length > 0 && (
                              <div className="post-media">
                                {post.media_urls.map((url, idx) => (
                                  /\.(mp4|webm|ogg)$/i.test(url)
                                    ? (
                                      <video key={idx} src={url} controls className="post-media-item" />
                                    ) : (
                                      <img key={idx} src={url} alt="Post media" className="post-media-item" />
                                    )
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="post-actions">
                            <div className="post-action">
                              <FaHeart />
                              <span>{post.likes_count}</span>
                            </div>
                            <div className="post-action">
                              <FaComment />
                              <span>{post.comments_count}</span>
                            </div>
                            <div className="post-action">
                              <FaShare />
                              <span>{post.shares_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-posts">
                      <p>No saved posts yet. Save posts you like to see them here!</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'blocked' && (
                <>
                  {loadingBlockedUsers ? (
                    <div className="posts-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading blocked users...</p>
                    </div>
                  ) : blockedUsers.length > 0 ? (
                    <div className="blocked-users-list">
                      {blockedUsers.map((user) => (
                        <div key={user.id} className="blocked-user-item">
                          <div className="blocked-user-info">
                            <div className="blocked-user-avatar">
                              {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.username} />
                              ) : (
                                <FaUser />
                              )}
                            </div>
                            <div className="blocked-user-details">
                              <div className="blocked-user-name">@{user.username}</div>
                              <div className="blocked-user-college">{user.college_name}</div>
                              <div className="blocked-user-date">Blocked on {new Date(user.blocked_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => unblockUser(user.id)}
                            className="unblock-btn"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-blocked-users">
                      <p>No blocked users. Your feed shows all posts from your community.</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="profile-right-column">
            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="profile-section"
            >
              <h3 className="section-title">Achievements</h3>
              <div className="achievements-grid">
                <div className="achievement-item">
                  <div className="achievement-icon">⭐</div>
                  <div className="achievement-content">
                    <div className="achievement-title">Reputation</div>
                    <div className="achievement-value">{userProfile.reputation_score || 0}</div>
                    {userProfile.reputation_score >= 100 && (
                      <div className="achievement-badge">🏆 Elite</div>
                    )}
                  </div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">🔥</div>
                  <div className="achievement-content">
                    <div className="achievement-title">Daily Streak</div>
                    <div className="achievement-value">{userProfile.daily_streak || 0} days</div>
                    {userProfile.daily_streak >= 7 && (
                      <div className="achievement-badge">On Fire</div>
                    )}
                  </div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">🥇</div>
                  <div className="achievement-content">
                    <div className="achievement-title">College Points</div>
                    <div className="achievement-value">{userProfile.college_points || userProfile.college_total_points || 0}</div>
                    {userProfile.college_points >= 500 && (
                      <div className="achievement-badge">Champion</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="profile-section"
            >
              <h3 className="section-title">Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">📝</div>
                  <div className="activity-content">
                    <div className="activity-title">Posts Created</div>
                    <div className="activity-value">{userProfile.stats?.total_posts || userPosts.length}</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🎮</div>
                  <div className="activity-content">
                    <div className="activity-title">Games Played</div>
                    <div className="activity-value">{userProfile.stats?.total_games || 0}</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🏆</div>
                  <div className="activity-content">
                    <div className="activity-title">Challenges Completed</div>
                    <div className="activity-value">{userProfile.stats?.challenges_completed || 0}</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">⭐</div>
                  <div className="activity-content">
                    <div className="activity-title">Last Active</div>
                    <div className="activity-value">
                      {userProfile.last_login ? new Date(userProfile.last_login).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
