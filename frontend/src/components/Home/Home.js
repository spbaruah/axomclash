import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaTrophy, FaFire, FaUsers, FaStar, FaBell, FaSearch, FaUser, FaComments, FaComment, FaShare, FaSignOutAlt, FaPlus, FaCrown, FaHeart, FaThumbsUp, FaLaugh, FaEllipsisV } from 'react-icons/fa';
import CreatePost from './CreatePost';
import PostComments from './PostComments';
import Banner from './Banner';
import ReportPostModal from '../common/ReportPostModal';
import './Home.css';

const Home = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCollegeRank, setUserCollegeRank] = useState(null);
  const [pointsToNext, setPointsToNext] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [sharingToChat, setSharingToChat] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState(null);

  // Function to format time since post creation
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

  // Removed unused handleLogout function

  const handleUserProfileClick = (userId) => {
    if (userId && userId !== userProfile?.id) {
      navigate(`/profile/${userId}`);
    }
  };

  // Block user function
  const blockUser = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`/api/users/block/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBlockedUsers(prev => new Set([...prev, userId]));
      // Remove posts from blocked user
      setPosts(prevPosts => prevPosts.filter(post => post.user_id !== userId));
      toast.success('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.error || 'Failed to block user');
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchHomeData();
    }
  }, [userProfile]);

  // Check for query parameter to open create post modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openCreatePost') === 'true') {
      setShowCreatePost(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  // Handle clicking outside reactions dropdown and post menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.reactions-container') && 
          !event.target.closest('.post-menu-container')) {
        setPosts(prevPosts => 
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

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [collegesRes, postsRes, bannersRes] = await Promise.all([
        axios.get('/api/colleges/rankings'),
        axios.get('/api/posts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        axios.get('/api/banners')
      ]);
      
      console.log('Posts fetched:', postsRes.data.posts); // Debug log
      
      const postsWithReactions = postsRes.data.posts.map(post => ({
        ...post,
        user: {
          username: post.username,
          profile_picture: post.profile_picture,
          college_name: post.college_name
        },
        love_count: post.love_count || 0,
        laugh_count: post.laugh_count || 0,
        fire_count: post.fire_count || 0,
        clap_count: post.clap_count || 0,
        wow_count: post.wow_count || 0,
        sad_count: post.sad_count || 0,
        angry_count: post.angry_count || 0,
        user_reaction: post.user_reaction || null
      }));
      
      console.log('Posts with reactions:', postsWithReactions); // Debug log
      
      // Process college rankings
      const rankings = collegesRes.data.colleges || [];
      setCollegeRankings(rankings);



      // Process posts (respect visibility settings)
      const allPosts = postsWithReactions;
      const filteredPosts = allPosts
        .filter(post => {
          // Show public posts to everyone
          if (post.visibility === 'public') return true;
          
          // Show college_only posts only to users from the same college
          if (post.visibility === 'college_only' && post.college_id === userProfile.college_id) return true;
          
          // Show private posts only to the post owner
          if (post.visibility === 'private' && post.user_id === userProfile.id) return true;
          
          return false;
        })
        .map(post => ({
          ...post,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          is_liked: !!post.user_reaction // Convert user_reaction to is_liked for backward compatibility
        }));
      
      console.log('Filtered posts after visibility filtering:', filteredPosts); // Debug log
      setPosts(filteredPosts);

      // Process banners
      const activeBanners = bannersRes.data.banners || [];
      setBanners(activeBanners);
      
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleQuickAction = (action) => {
    switch (action) {
      case 'join-game':
        window.location.href = '/games';
        break;
      case 'college-chat':
        window.location.href = '/chat';
        break;
      case 'challenges':
        window.location.href = '/challenges';
        break;
      case 'leaderboard':
        window.location.href = '/leaderboard';
        break;
      default:
        break;
    }
  };

  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  const handlePostCreated = (newPost) => {
    console.log('New post received:', newPost);
    // Add the new post to the beginning of the posts array immediately
    if (newPost) {
      setPosts(prevPosts => {
        const updatedPosts = [newPost, ...prevPosts];
        console.log('Updated posts array:', updatedPosts);
        return updatedPosts;
      });
    } else {
      // Fallback: refresh posts if no new post data provided
      console.log('No new post data, refreshing from backend');
      fetchHomeData();
    }
  };

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
    fetchHomeData();
  };

  const handleSharePost = (post) => {
    setSelectedPostForShare(post);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedPostForShare(null);
  };

  const copyPostLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied to clipboard! 📋');
      } else {
        // Fallback for older browsers or non-secure contexts
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
      
      // Truncate post content if it's too long for chat
      const maxContentLength = 200; // Limit content length for chat
      const truncatedContent = postContent.length > maxContentLength 
        ? postContent.substring(0, maxContentLength) + '...'
        : postContent;
      
      // Create a formatted message for the chat
      let chatMessage = `📱 Shared Post from @${postAuthor}:\n\n${truncatedContent}`;
      
      // Add media indicator if post has media
      if (hasMedia) {
        const mediaCount = selectedPostForShare.media_urls.length;
        const mediaType = mediaCount === 1 ? 'media' : 'media files';
        chatMessage += `\n\n📎 Post includes ${mediaCount} ${mediaType}`;
      }
      
      chatMessage += `\n\n🔗 View full post: ${postUrl}`;
      
      // Send the message to the college chat
      const response = await axios.post(`/api/chat/college/${userProfile.college_id}/text`, {
        content: chatMessage
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.status === 201) {
        toast.success('Post shared to chat! 💬');
        // Close the share modal
        handleCloseShareModal();
        // Optionally redirect to chat
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

  const handlePostReaction = async (postId, reactionType) => {
    try {
      console.log('Adding reaction:', { postId, reactionType }); // Debug log
      
      const response = await axios.post(`/api/posts/${postId}/react`, { reaction_type: reactionType }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Reaction response:', response.data); // Debug log
      
      // Update local state based on the response
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const { action } = response.data;
            const updatedPost = { ...post };
            
            console.log('Updating post:', { postId, action, oldReaction: post.user_reaction, newReaction: reactionType }); // Debug log
            
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
            
            console.log('Updated post:', updatedPost); // Debug log
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
    setPosts(prevPosts => 
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
        window.location.href = `/profile/${postId}`;
        break;
      case 'save-post':
        try {
          const response = await axios.post(`/api/posts/${postId}/save`, {}, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
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
        const postToReport = posts.find(p => p.id === postId);
        if (postToReport) {
          setSelectedPostForReport(postToReport);
          setShowReportModal(true);
        }
        break;
      case 'block-user':
        const post = posts.find(p => p.id === postId);
        if (post) {
          await blockUser(post.user_id);
        }
        break;
      default:
        break;
    }
    setShowPostMenu(null);
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

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading your college dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchHomeData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Unified Background Section */}
      <div className="unified-background-section">
        {/* Top Navigation Header */}
        <div className="top-nav-header">
          <div className="app-logo">
            <img src="/image/logo.png" alt="CampusClash Logo" className="app-logo-image" />
          </div>
          <div className="top-nav-buttons">
            <button 
              className="nav-btn chat-btn"
              onClick={() => window.location.href = '/chat'}
            >
              <FaComments /> <span className="btn-text">Chat</span>
            </button>
            <button 
              className="nav-btn profile-btn"
              onClick={() => window.location.href = '/profile'}
            >
              <FaUser /> <span className="btn-text">Profile</span>
            </button>
          </div>
        </div>

        {/* Banner Section */}
        <Banner banners={banners} />
      </div>

      {/* Feed Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="feed-section"
      >
        <div className="feed-container">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="post-card"
              >
                <div className="post-header">
                  {/* Left Side - 2-column layout */}
                  <div className="user-info">
                    {/* Column 1: Profile picture */}
                    <div 
                      className="user-avatar clickable"
                      onClick={() => handleUserProfileClick(post.user_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {post.user?.profile_picture ? (
                        <img src={post.user.profile_picture} alt="Profile" />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    
                    {/* Column 2: User name and college name */}
                    <div className="user-details">
                      <h4 
                        className="clickable"
                        onClick={() => handleUserProfileClick(post.user_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        @{post.user?.username || 'Anonymous'}
                      </h4>
                      {post.user?.college_name && (
                        <div className="post-college">
                          {post.user.college_name}
                          <span className="post-time">• {formatTimeAgo(post.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side - 3-dot menu */}
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
                      {console.log(`Rendering media for post ${post.id}:`, post.media_urls)}
                      {post.media_urls.map((url, i) => {
                        // Additional safety check for valid URLs
                        if (typeof url === 'string' && url.trim()) {
                          console.log(`Rendering image ${i}:`, url);
                          return <img key={i} src={url} alt="Post media" onClick={() => handlePhotoClick(url)} onError={(e) => {
                            console.error(`Failed to load image:`, url, e);
                            e.target.style.display = 'none';
                          }} onLoad={() => {
                            console.log(`Successfully loaded image:`, url);
                          }} />;
                        }
                        return null;
                      }).filter(Boolean)}
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
                        setPosts(prevPosts => 
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
              </motion.div>
            ))
          ) : (
            <div className="no-posts">
              <p>No posts yet. Be the first to share something! 🚀</p>
              <button className="create-first-post-btn" onClick={handleCreatePost}>
                <FaPlus /> Create First Post
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
        onRefreshData={fetchHomeData}
      />

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

export default Home;