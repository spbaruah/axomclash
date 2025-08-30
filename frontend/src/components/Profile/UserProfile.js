import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaTrophy, FaUsers, FaCalendar, FaMapMarkerAlt, FaBuilding, FaArrowLeft, FaHeart, FaComment, FaShare, FaEllipsisV } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/axios';
import toast from 'react-hot-toast';
import PostComments from '../Home/PostComments';
import ReportPostModal from '../common/ReportPostModal';
import './Profile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New state variables for post interactions
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [sharingToChat, setSharingToChat] = useState(false);

  // New state variables for photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      checkBlockStatus();
    }
  }, [userId]);

  // Check block status between current user and profile user
  const checkBlockStatus = async () => {
    if (!userProfile?.id || !userId) return;
    
    try {
      const [blockCheckRes, blockedByCheckRes] = await Promise.all([
        api.get(`/api/users/blocked/check/${userId}`),
        api.get(`/api/users/blocked/by/${userId}`)
      ]);
      
      setIsBlocked(blockCheckRes.data.isBlocked);
      setIsBlockedBy(blockedByCheckRes.data.isBlockedBy);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  // Block user function
  const blockUser = async () => {
    try {
      await api.post(`/api/users/block/${userId}`);
      
      setIsBlocked(true);
      toast.success('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.error || 'Failed to block user');
    }
  };

  // Unblock user function
  const unblockUser = async () => {
    try {
      await api.delete(`/api/users/block/${userId}`);
      
      setIsBlocked(false);
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  // Handle clicking outside reactions dropdown and post menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.reactions-container') && 
          !event.target.closest('.post-menu-container')) {
        setUserPosts(prevPosts => 
          prevPosts.map(post => ({
            ...post,
            showReactions: false
          }))
        );
        setShowPostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/posts/user/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        const posts = Array.isArray(data) ? data : data.posts || [];
        
        // Process posts to include reaction data
        const postsWithReactions = posts.map(post => ({
          ...post,
          user: {
            username: user?.username || 'Anonymous',
            profile_picture: user?.profile_picture,
            college_name: user?.college_name
          },
          love_count: post.love_count || 0,
          laugh_count: post.laugh_count || 0,
          fire_count: post.fire_count || 0,
          clap_count: post.clap_count || 0,
          wow_count: post.wow_count || 0,
          sad_count: post.sad_count || 0,
          angry_count: post.angry_count || 0,
          user_reaction: post.user_reaction || null,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0
        }));
        
        setUserPosts(postsWithReactions);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInMs = now - postDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) return 'Just now';
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return `${diffInDays}D`;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Post interaction functions
  const handleShowComments = (postId) => {
    setSelectedPostId(postId);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

  const handleCommentAdded = () => {
    // Refresh the posts to update comment counts
    fetchUserPosts();
  };

  // Photo modal functions
  const handlePhotoClick = (photoUrl) => {
    setSelectedPhoto(photoUrl);
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
  };

  const handleSharePost = (post) => {
    setSelectedPostForShare(post);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedPostForShare(null);
  };

  const handlePostReaction = async (postId, reactionType) => {
    try {
      const response = await api.post(`/api/posts/${postId}/react`, { reaction_type: reactionType });
      
      // Update local state based on the response
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const { action } = response.data;
            const updatedPost = { ...post };
            
            if (action === 'added') {
              // New reaction added
              updatedPost.user_reaction = reactionType;
              updatedPost.likes_count = (post.likes_count || 0) + 1;
              updatedPost[`${reactionType}_count`] = (post[`${reactionType}_count`] || 0) + 1;
            } else if (action === 'removed') {
              // Reaction removed
              updatedPost.user_reaction = null;
              updatedPost.likes_count = Math.max((post.likes_count || 0) - 1, 0);
              updatedPost[`${reactionType}_count`] = Math.max((post[`${reactionType}_count`] || 0) - 1, 0);
            } else if (action === 'updated') {
              // Reaction changed from one type to another
              const oldReaction = post.user_reaction;
              if (oldReaction && oldReaction !== reactionType) {
                updatedPost[`${oldReaction}_count`] = Math.max((post[`${oldReaction}_count`] || 0) - 1, 0);
              }
              updatedPost.user_reaction = reactionType;
              updatedPost[`${reactionType}_count`] = (post[`${reactionType}_count`] || 0) + 1;
            }
            
            return updatedPost;
          }
          return post;
        })
      );
      
      // Show appropriate toast message
      if (response.data.action === 'added') {
        toast.success('Reaction added! 🎉');
      } else if (response.data.action === 'removed') {
        toast.success('Reaction removed!');
      } else if (response.data.action === 'updated') {
        toast.success('Reaction updated! ✨');
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const handleShowReactions = (postId) => {
    setUserPosts(prevPosts => 
      prevPosts.map(post => ({
        ...post,
        showReactions: post.id === postId ? !post.showReactions : false
      }))
    );
  };

  const togglePostMenu = (postId) => {
    setShowPostMenu(showPostMenu === postId ? null : postId);
  };

  const handlePostMenuAction = async (postId, action) => {
    switch (action) {
      case 'view-profile':
        window.location.href = `/profile/${userId}`;
        break;
              case 'save-post':
          try {
            const response = await api.post(`/api/posts/${postId}/save`);
            if (response.status === 200) {
              toast.success('Post saved successfully!');
            }
          } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error === 'Post already saved') {
              toast.error('Post is already saved!');
            } else {
              toast.error('Failed to save post. Please try again.');
            }
          }
          break;
      case 'report-post':
        const postToReport = userPosts.find(p => p.id === postId);
        if (postToReport) {
          setSelectedPostForReport(postToReport);
          setShowReportModal(true);
        }
        break;
      case 'block-user':
        await blockUser();
        break;
      default:
        break;
    }
    setShowPostMenu(null);
  };

  // Share functionality
  const copyPostLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied to clipboard! 📋');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast.success('Post link copied to clipboard! 📋');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast.error('Failed to copy link');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareOnSocialMedia = (platform) => {
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const postText = selectedPostForShare.content?.substring(0, 100) || 'Check out this post!';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(postText + ' ' + postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    toast.success(`Sharing on ${platform}! 🚀`);
  };

  const shareViaEmail = () => {
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const subject = 'Check out this post from CampusClash!';
    const body = `I found this interesting post and wanted to share it with you:\n\n${selectedPostForShare.content?.substring(0, 200) || 'Check out this post!'}\n\nView the full post here: ${postUrl}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    toast.success('Email client opened! 📧');
  };

  const shareToChat = async () => {
    try {
      setSharingToChat(true);
      const postContent = selectedPostForShare.content;
      const postAuthor = selectedPostForShare.user?.username || 'Anonymous';
      const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
      const hasMedia = selectedPostForShare.media_urls && selectedPostForShare.media_urls.length > 0;
      
      const maxContentLength = 200;
      const truncatedContent = postContent.length > maxContentLength 
        ? postContent.substring(0, maxContentLength) + '...'
        : postContent;
      
      let chatMessage = `📱 Shared Post from @${postAuthor}:\n\n${truncatedContent}`;
      
      if (hasMedia) {
        const mediaCount = selectedPostForShare.media_urls.length;
        const mediaType = mediaCount === 1 ? 'media' : 'media files';
        chatMessage += `\n\n📎 Post includes ${mediaCount} ${mediaType}`;
      }
      
      chatMessage += `\n\n🔗 View full post: ${postUrl}`;
      
      const response = await api.post(`/api/chat/college/${userProfile.college_id}/text`, {
        content: chatMessage
      });
      
      if (response.status === 201) {
        toast.success('Post shared to chat! 💬');
        handleCloseShareModal();
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);
      }
    } catch (error) {
      console.error('Error sharing to chat:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again to share posts to chat.');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to share to this chat.');
      } else {
        toast.error('Failed to share to chat. Please try again.');
      }
    } finally {
      setSharingToChat(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Profile Not Found</h3>
        <p>{error || 'This user profile could not be loaded.'}</p>
        <button onClick={handleBack} className="retry-btn">
          Go Back
        </button>
      </div>
    );
  }

  // Don't show this component if it's the current user's profile
  if (userProfile?.id === parseInt(userId)) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="profile-container">
      {/* Cover Photo Section */}
      <div className="user-profile-cover">
        {user.cover_photo ? (
          <img src={user.cover_photo} alt="Cover" className="user-cover-photo" />
        ) : (
          <div className="user-default-cover">
            <FaBuilding />
          </div>
        )}
        
        {/* Back Button Overlay */}
        <div className="cover-back-button">
          <button onClick={handleBack} className="back-button">
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* Profile Info Section - Overlapping Cover */}
      <div className="user-profile-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="user-profile-header"
        >
          {/* Profile Picture - Large and Overlapping */}
          <div className="user-profile-picture-container">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} className="user-profile-picture" />
            ) : (
              <div className="user-default-avatar">
                <FaUser />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="user-profile-details">
            <h2 className="user-username">@{user.username}</h2>
            {user.full_name && <p className="user-full-name">{user.full_name}</p>}
            {user.bio && <p className="user-bio">{user.bio}</p>}

            {/* College Info */}
            {user.college_name && (
              <div className="user-college-info">
                <FaBuilding />
                <span>{user.college_name}</span>
              </div>
            )}

            {/* Student Status */}
            {user.student_status && (
              <div className="user-status-info">
                <FaCalendar />
                <span>{user.student_status}</span>
              </div>
            )}

            {/* Join Date */}
            <div className="user-join-date">
              <FaCalendar />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>

            {/* Block/Unblock Button */}
            {!isBlockedBy && (
              <div className="user-profile-actions">
                {isBlocked ? (
                  <button 
                    onClick={unblockUser}
                    className="btn btn-secondary"
                    style={{ marginTop: '10px' }}
                  >
                    Unblock User
                  </button>
                ) : (
                  <button 
                    onClick={blockUser}
                    className="btn btn-danger"
                    style={{ marginTop: '10px' }}
                  >
                    Block User
                  </button>
                )}
              </div>
            )}

            {/* Show message if blocked by user */}
            {isBlockedBy && (
              <div className="blocked-message" style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                This user has blocked you
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="profile-section"
        >
          <h3 className="section-title">Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <FaTrophy />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user.total_points || 0}</div>
                <div className="stat-label">Total Points</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user.reputation_score || 0}</div>
                <div className="stat-label">Reputation</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <FaHeart />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user.daily_streak || 0}</div>
                <div className="stat-label">Daily Streak</div>
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
          <h3 className="section-title">Posts</h3>
          {userPosts.length > 0 ? (
            <div className="posts-list">
              {userPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-header">
                    <div className="post-author">
                      <div className="post-avatar">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt={user.username} />
                        ) : (
                          <FaUser />
                        )}
                      </div>
                      <div className="post-info">
                        <div className="post-author-name">{user.username}</div>
                        <div className="post-college-name">{user.college_name}</div>
                        <div className="post-time">{formatTimeAgo(post.created_at)}</div>
                      </div>
                    </div>
                    
                    {/* Post Menu */}
                    <div className="post-header-right">
                      <div className="post-menu-container">
                        <button 
                          className="post-menu-btn"
                          onClick={() => togglePostMenu(post.id)}
                          aria-label="Post options"
                        >
                          <FaEllipsisV />
                        </button>
                        {showPostMenu === post.id && (
                          <div className="post-menu-dropdown">
                            <button onClick={() => handlePostMenuAction(post.id, 'view-profile')}>
                              View Profile
                            </button>
                            <button onClick={() => handlePostMenuAction(post.id, 'save-post')}>
                              Save Post
                            </button>
                            <button onClick={() => handlePostMenuAction(post.id, 'report-post')}>
                              Report Post
                            </button>
                            <button onClick={() => handlePostMenuAction(post.id, 'block-user')}>
                              Block User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="post-content">
                    <p>{post.content}</p>
                    {post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
                      <div className="post-media">
                        {post.media_urls.map((url, i) => (
                          <img key={i} src={url} alt="Post media" onClick={() => handlePhotoClick(url)} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Facebook-style Stats Bar */}
                  <div className="post-stats">
                    <div className="reactions-summary">
                      {post.likes_count > 0 && (
                        <>
                          <div className="reaction-icons">
                            {post.love_count > 0 && <span className="reaction-icon love">❤️</span>}
                            {post.laugh_count > 0 && <span className="reaction-icon laugh">😂</span>}
                            {post.fire_count > 0 && <span className="reaction-icon fire">🔥</span>}
                            {post.clap_count > 0 && <span className="reaction-icon clap">👏</span>}
                          </div>
                          <span className="reaction-count">{post.likes_count}</span>
                        </>
                      )}
                    </div>
                    {post.comments_count > 0 && (
                      <div className="comments-summary">
                        <span>{post.comments_count} comments</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Facebook-style Action Buttons */}
                  <div className="post-actions facebook-style">
                    <button 
                      className={`action-btn like-btn ${post.user_reaction ? 'active' : ''}`}
                      onClick={() => handleShowReactions(post.id)}
                      onMouseEnter={() => {
                        // Show reactions on hover for desktop
                        if (window.innerWidth > 768) {
                          setUserPosts(prevPosts => 
                            prevPosts.map(p => ({
                              ...p,
                              showReactions: p.id === post.id
                            }))
                          );
                        }
                      }}
                    >
                      {post.user_reaction === 'love' && '❤️ Loved'}
                      {post.user_reaction === 'laugh' && '😂 Haha'}
                      {post.user_reaction === 'fire' && '🔥 Fire'}
                      {post.user_reaction === 'clap' && '👏 Clap'}
                      {post.user_reaction === 'wow' && '😮 Wow'}
                      {post.user_reaction === 'sad' && '😢 Sad'}
                      {post.user_reaction === 'angry' && '😡 Angry'}
                      {!post.user_reaction && '👍 Like'}
                    </button>
                    
                    <button 
                      className="action-btn comment-btn"
                      onClick={() => handleShowComments(post.id)}
                    >
                      <FaComment /> Comment
                    </button>
                    
                    <button 
                      className="action-btn share-btn"
                      onClick={() => handleSharePost(post)}
                    >
                      <FaShare /> Share
                    </button>
                  </div>
                  
                  {/* Facebook-style Reactions Popup */}
                  <div className={`reactions-popup ${post.showReactions ? 'show' : ''}`}>
                    <div className="reaction-options">
                      <button 
                        className="reaction-option love"
                        onClick={() => handlePostReaction(post.id, 'love')}
                        title="Love"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        ❤️
                        <span className="reaction-tooltip">Love</span>
                      </button>
                      <button 
                        className="reaction-option laugh"
                        onClick={() => handlePostReaction(post.id, 'laugh')}
                        title="Haha"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        😂
                        <span className="reaction-tooltip">Haha</span>
                      </button>
                      <button 
                        className="reaction-option wow"
                        onClick={() => handlePostReaction(post.id, 'wow')}
                        title="Wow"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        😮
                        <span className="reaction-tooltip">Wow</span>
                      </button>
                      <button 
                        className="reaction-option sad"
                        onClick={() => handlePostReaction(post.id, 'sad')}
                        title="Sad"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        😢
                        <span className="reaction-tooltip">Sad</span>
                      </button>
                      <button 
                        className="reaction-option angry"
                        onClick={() => handlePostReaction(post.id, 'angry')}
                        title="Angry"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        😡
                        <span className="reaction-tooltip">Angry</span>
                      </button>
                      <button 
                        className="reaction-option fire"
                        onClick={() => handlePostReaction(post.id, 'fire')}
                        title="Fire"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        🔥
                        <span className="reaction-tooltip">Fire</span>
                      </button>
                      <button 
                        className="reaction-option clap"
                        onClick={() => handlePostReaction(post.id, 'clap')}
                        title="Clap"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.3) translateY(-5px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        👏
                        <span className="reaction-tooltip">Clap</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-posts">
              <p>No posts yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Comments Modal */}
      <PostComments
        postId={selectedPostId}
        isOpen={showComments}
        onClose={handleCloseComments}
        onCommentAdded={handleCommentAdded}
      />

      {/* Share Modal */}
      {showShareModal && selectedPostForShare && (
        <div className="share-modal-overlay" onClick={handleCloseShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Post</h3>
              <button className="close-btn" onClick={handleCloseShareModal}>
                ×
              </button>
            </div>
            
            <div className="share-modal-content">
              <div className="share-options">
                <button 
                  className="share-option copy-link"
                  onClick={copyPostLink}
                >
                  <span className="share-icon">📋</span>
                  <span>Copy Link</span>
                </button>
                
                <button 
                  className="share-option social-share"
                  onClick={() => shareOnSocialMedia('twitter')}
                >
                  <span className="share-icon">🐦</span>
                  <span>Twitter</span>
                </button>
                
                <button 
                  className="share-option social-share"
                  onClick={() => shareOnSocialMedia('facebook')}
                >
                  <span className="share-icon">📘</span>
                  <span>Facebook</span>
                </button>
                
                <button 
                  className="share-option social-share"
                  onClick={() => shareOnSocialMedia('whatsapp')}
                >
                  <span className="share-icon">💬</span>
                  <span>WhatsApp</span>
                </button>
                
                <button 
                  className="share-option social-share"
                  onClick={() => shareOnSocialMedia('telegram')}
                >
                  <span className="share-icon">📱</span>
                  <span>Telegram</span>
                </button>
                
                <button 
                  className="share-option email-share"
                  onClick={shareViaEmail}
                >
                  <span className="share-icon">📧</span>
                  <span>Email</span>
                </button>

                <button 
                  className="share-option share-to-chat"
                  onClick={shareToChat}
                  disabled={sharingToChat}
                >
                  <span className="share-icon">💬</span>
                  <span>{sharingToChat ? 'Sharing...' : 'Share to Chat'}</span>
                </button>
              </div>
              
              <div className="share-preview">
                <h4>Post Preview:</h4>
                <div className="preview-content">
                  <p>{selectedPostForShare.content?.substring(0, 150)}...</p>
                  <small>Shared by @{selectedPostForShare.user?.username || 'Anonymous'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="photo-modal-overlay" onClick={handleClosePhotoModal}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Enlarged" className="enlarged-photo" />
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {showReportModal && selectedPostForReport && (
        <ReportPostModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedPostForReport(null);
          }}
          postId={selectedPostForReport.id}
          postContent={selectedPostForReport.content}
        />
      )}
    </div>
  );
};

export default UserProfile;
