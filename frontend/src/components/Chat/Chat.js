import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import './Chat.css';

const Chat = () => {
  const { user, getAuthToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [activeChat, setActiveChat] = useState('college'); // For future individual chats
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // New state for message editing and deletion
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  
  // New state for reactions
  const [showReactionBar, setShowReactionBar] = useState(null);
  const [longPressTimeout, setLongPressTimeout] = useState(null);
  
  // New state for reply functionality
  const [replyingTo, setReplyingTo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Available reactions
  const reactions = [
    { emoji: '👍', type: 'like', label: 'Like' },
    { emoji: '❤️', type: 'love', label: 'Love' },
    { emoji: '😂', type: 'laugh', label: 'Laugh' },
    { emoji: '😮', type: 'wow', label: 'Wow' },
    { emoji: '😢', type: 'sad', label: 'Sad' },
    { emoji: '🙏', type: 'angry', label: 'Angry' }
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close header menu and emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderMenu && !event.target.closest('.header-menu-container')) {
        setShowHeaderMenu(false);
      }
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container') && !event.target.closest('.emoji-btn')) {
        setShowEmojiPicker(false);
      }
      if (showMediaOptions && !event.target.closest('.media-options') && !event.target.closest('.media-btn')) {
        setShowMediaOptions(false);
      }
      if (showMessageMenu && !event.target.closest('.message-actions')) {
        setShowMessageMenu(null);
      }
      if (showReactionBar && !event.target.closest('.reaction-bar') && !event.target.closest('.message')) {
        setShowReactionBar(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeaderMenu, showEmojiPicker, showMediaOptions, showMessageMenu, showReactionBar]);

  // Fetch messages when component mounts or college changes
  useEffect(() => {
    if (user?.college_id) {
      fetchMessages();
      fetchOnlineUsers();
      // Mark user as online when chat loads
      updateOnlineStatus(true);
    }
  }, [user?.college_id]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Mark user as offline when chat unmounts
      if (user?.college_id) {
        updateOnlineStatus(false);
      }
      // Clear any pending long press timeout
      if (longPressTimeout) {
        clearTimeout(longPressTimeout);
      }
    };
  }, [user?.college_id, longPressTimeout]);

  // Keep online status fresh while user is active
  useEffect(() => {
    if (user?.college_id) {
      const interval = setInterval(() => {
        updateOnlineStatus(true);
      }, 30000); // Update every 30 seconds

      return () => {
        clearInterval(interval);
        updateOnlineStatus(false);
      };
    }
  }, [user?.college_id]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`/api/chat/college/${user.college_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user.college_id, getAuthToken]);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      setOnlineUsersLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`/api/chat/college/${user.college_id}/online-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOnlineUsers(response.data.onlineUsers || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      // Don't show error toast for this as it's not critical
    } finally {
      setOnlineUsersLoading(false);
    }
  }, [user.college_id, getAuthToken]);

  // Update user online status
  const updateOnlineStatus = useCallback(async (isOnline) => {
    try {
      const token = getAuthToken();
      await axios.post('/api/chat/user/online-status', 
        { isOnline }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }, [getAuthToken]);

  // Send text message or update existing message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // If we're editing a message, update it instead of sending new one
    if (editingMessage) {
      await handleEditMessage();
      return;
    }

    try {
      setSending(true);
      const token = getAuthToken();
      const response = await axios.post(`/api/chat/college/${user.college_id}/text`, 
        { 
          content: newMessage.trim(),
          replyToId: replyingTo?.id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new message to the list
      setMessages(prev => [...prev, response.data.chatMessage]);
      setNewMessage('');
      
      // Clear reply state
      setReplyingTo(null);
      
      // Stop typing indicator
      stopTyping();
      
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing start to server
    // This would typically be done via Socket.IO
    setTypingUsers(prev => [...new Set([...prev, user.username])]);
  }, [user.username]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(prev => prev.filter(username => username !== user.username));
    }, 1000);
  }, [user.username]);

  // Removed unused startTypingListener function

  // Clear all chat messages
  const clearChat = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.delete(`/api/chat/college/${user.college_id}/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear messages from state
      setMessages([]);
      setShowHeaderMenu(false);
      
      toast.success(`Chat cleared successfully! ${response.data.deletedMessages} messages removed.`);
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setShowMediaOptions(false);
      
      const formData = new FormData();
      formData.append('media', file);
      formData.append('messageType', 'photo');
      if (newMessage.trim()) {
        formData.append('caption', newMessage.trim());
      }
      if (replyingTo?.id) {
        formData.append('replyToId', replyingTo.id);
      }

      const token = getAuthToken();
      const response = await axios.post(`/api/chat/college/${user.college_id}/media`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      // Add new message to the list
      setMessages(prev => [...prev, response.data.chatMessage]);
      setNewMessage('');
      
      // Clear reply state
      setReplyingTo(null);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Photo sent!');
    } catch (error) {
      console.error('Error sending photo:', error);
      toast.error('Failed to send photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle media options toggle
  const toggleMediaOptions = () => {
    setShowMediaOptions(!showMediaOptions);
    setShowEmojiPicker(false);
  };



  // Check if message can be edited (within 10 minutes)
  const canEditMessage = (message) => {
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    return diffInMinutes <= 10;
  };

  // Handle message edit
  const handleEditMessage = async () => {
    if (!newMessage.trim() || !editingMessage) return;

    try {
      setSending(true);
      const token = getAuthToken();
      await axios.put(`/api/chat/message/${editingMessage.id}`, 
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update message in state
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: newMessage.trim(), isEdited: true }
          : msg
      ));
      
      setEditingMessage(null);
      setNewMessage('');
      setShowMessageMenu(null);
      
      toast.success('Message updated successfully!');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    } finally {
      setSending(false);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      const token = getAuthToken();
      await axios.delete(`/api/chat/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove message from state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowMessageMenu(null);
      
      toast.success('Message deleted successfully!');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setShowMessageMenu(null);
    // Focus on the input
    document.querySelector('.message-input')?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Scroll to replied message
  const scrollToRepliedMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      messageElement.classList.add('highlighted');
      setTimeout(() => {
        messageElement.classList.remove('highlighted');
      }, 2000);
    }
  };

  // Start editing a message
  const startEditingMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    setShowMessageMenu(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
    setShowMessageMenu(null);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape' && editingMessage) {
      cancelEditing();
    } else {
      startTyping();
    }
  };

  // Handle reaction toggling
  const handleReaction = async (messageId, reactionType) => {
    try {
      const token = getAuthToken();
      const message = messages.find(m => m.id === messageId);
      
      if (!message) return;
      
      // Check if user already has this reaction
      const hasReaction = message.user_reactions && message.user_reactions[reactionType];
      
      if (hasReaction) {
        // Remove reaction
        await axios.delete(`/api/chat/message/${messageId}/reaction`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { reaction: reactionType }
        });
        
        // Update local state
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const updatedReactions = { ...msg.reactions };
            if (updatedReactions[reactionType]) {
              updatedReactions[reactionType] = Math.max(0, updatedReactions[reactionType] - 1);
            }
            
            const updatedUserReactions = { ...msg.user_reactions };
            delete updatedUserReactions[reactionType];
            
            return {
              ...msg,
              reactions: updatedReactions,
              user_reactions: updatedUserReactions
            };
          }
          return msg;
        }));
      } else {
        // Add reaction
        await axios.post(`/api/chat/message/${messageId}/reaction`, 
          { reaction: reactionType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update local state - handle the case where user might have had a different reaction
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const updatedReactions = { ...msg.reactions };
            const updatedUserReactions = { ...msg.user_reactions };
            
            // Remove any existing reaction from user_reactions
            Object.keys(updatedUserReactions).forEach(existingReaction => {
              if (updatedReactions[existingReaction]) {
                updatedReactions[existingReaction] = Math.max(0, updatedReactions[existingReaction] - 1);
              }
            });
            
            // Clear all user reactions and add the new one
            const newUserReactions = { [reactionType]: true };
            
            // Add the new reaction
            updatedReactions[reactionType] = (updatedReactions[reactionType] || 0) + 1;
            
            return {
              ...msg,
              reactions: updatedReactions,
              user_reactions: newUserReactions
            };
          }
          return msg;
        }));
      }
      
      // Close reaction bar
      setShowReactionBar(null);
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
      
      // Refresh messages to get the correct state from server
      if (user?.college_id) {
        fetchMessages();
      }
    }
  };

  // Handle mouse enter for desktop reaction bar
  const handleMessageMouseEnter = (messageId) => {
    // Clear any existing timeout to prevent flickering
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
    setShowReactionBar(messageId);
  };



  // Handle touch start for mobile long press
  const handleTouchStart = (messageId) => {
    const timeout = setTimeout(() => {
      setShowReactionBar(messageId);
    }, 500); // 500ms for long press
    setLongPressTimeout(timeout);
  };

  // Handle touch end for mobile
  const handleTouchEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  // Handle touch move to cancel long press
  const handleTouchMove = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  // Render reaction bar
  const renderReactionBar = (messageId) => {
    if (showReactionBar !== messageId) return null;
    
    return (
      <div 
        className="reaction-bar" 
        role="toolbar" 
        aria-label="Message reactions"
        onMouseEnter={() => setShowReactionBar(messageId)}
        onMouseLeave={() => {
          // Hide the reaction bar when mouse leaves it
          setShowReactionBar(null);
        }}
      >
        {reactions.map((reaction) => (
          <button
            key={reaction.type}
            className="reaction-btn"
            onClick={() => handleReaction(messageId, reaction.type)}
            title={reaction.label}
            aria-label={`React with ${reaction.label}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReaction(messageId, reaction.type);
              }
            }}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
    );
  };

  // Render reaction counts
  const renderReactionCounts = (message) => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;
    
    const reactionCounts = [];
    reactions.forEach(reaction => {
      const count = message.reactions[reaction.type] || 0;
      if (count > 0) {
        const hasUserReaction = message.user_reactions?.[reaction.type];
        reactionCounts.push(
          <span 
            key={reaction.type} 
            className={`reaction-count ${hasUserReaction ? 'user-reacted' : ''}`}
            title={`${reaction.label}: ${count}${hasUserReaction ? ' (click to remove)' : ''}`}
            onClick={() => handleReaction(message.id, reaction.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReaction(message.id, reaction.type);
              }
            }}
          >
            {reaction.emoji} {count}
          </span>
        );
      }
    });
    
    if (reactionCounts.length === 0) return null;
    
    return (
      <div className="reaction-counts">
        {reactionCounts}
      </div>
    );
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to convert text with URLs to clickable links
  const makeLinksClickable = (text) => {
    if (!text) return text;
    
    // Enhanced URL regex pattern to match various URL formats including localhost
    const urlRegex = /(https?:\/\/[^\s\n]+)|(www\.[^\s\n]+\.[^\s\n]+)|(localhost:[0-9]+\/[^\s\n]+)/g;
    
    // Split text by URLs and create clickable links
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Ensure URL has proper protocol
        let url = part;
        if (part.startsWith('www.')) {
          url = 'https://' + part;
        } else if (part.startsWith('localhost:')) {
          url = 'http://' + part;
        }
        
        // Check if this is a shared post link
        const isSharedPostLink = text.includes('🔗 View full post:') && (part.includes('/post/') || part.includes('localhost'));
        
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`message-link ${isSharedPostLink ? 'shared-post-link' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              // Open in new tab
              window.open(url, '_blank');
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.message_type) {
      case 'photo':
        return (
          <div className="message-media">
            <img 
              src={message.media_url} 
              alt="Photo" 
              className="message-photo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="message-photo-error" style={{ display: 'none' }}>
              <p>Failed to load image</p>
            </div>
            {message.content && (
              <p className="message-caption">{makeLinksClickable(message.content)}</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="message-media">
            <video 
              controls 
              className="message-video"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            >
              <source src={message.media_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="message-video-error" style={{ display: 'none' }}>
              <p>Failed to load video</p>
            </div>
            {message.content && (
              <p className="message-caption">{makeLinksClickable(message.content)}</p>
            )}
          </div>
        );
      default:
        return <p className="message-text">{makeLinksClickable(message.content)}</p>;
    }
  };

  if (!user?.college_id) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <h3>No College Assigned</h3>
          <p>Please complete your profile and select a college to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Left Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <img 
              src={user.profile_picture || '/image/default-avatar.svg'} 
              alt={user.username}
              className="profile-avatar"
              onError={(e) => {
                e.target.src = '/image/default-avatar.svg';
              }}
            />
            <div className="profile-info">
              <h3>
                {user.username}
                {user.student_status === 'Alumni' && (
                  <span className="alumni-badge" title="Alumni">
                    🎓
                  </span>
                )}
              </h3>
              <span className="online-status">Online</span>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="chat-rooms">
            <div className="room-item active">
              <div className="room-avatar">
                <span className="room-icon">🏫</span>
              </div>
                             <div className="room-info">
                 <h4>
                   {user?.college_name ? `${user.college_name} Chat` : 'College Chat'}
                   {user?.student_status === 'Alumni' && (
                     <span className="alumni-badge" title="Alumni">
                       🎓
                     </span>
                   )}
                 </h4>
                 <p>{onlineUsersLoading ? 'Loading...' : `${onlineUsers.length} online`}</p>
               </div>
            </div>
          </div>

          <div className="online-users">
            <h4>Online Now</h4>
            {onlineUsersLoading ? (
              <div className="loading-users">
                <div className="spinner"></div>
                <p>Loading online users...</p>
              </div>
            ) : onlineUsers.length === 0 ? (
              <p>No users online currently.</p>
            ) : (
              onlineUsers.slice(0, 5).map((onlineUser) => (
                <div key={onlineUser.id} className="online-user-item">
                  <div className="online-user-avatar">
                    <img 
                      src={onlineUser.profile_picture || '/image/default-avatar.svg'} 
                      alt={onlineUser.username}
                      onError={(e) => {
                        e.target.src = '/image/default-avatar.svg';
                      }}
                    />
                    <span className="online-indicator"></span>
                  </div>
                  <span className="online-user-name">
                    {onlineUser.username}
                    {onlineUser.student_status === 'Alumni' && (
                      <span className="alumni-badge" title="Alumni">
                        🎓
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              <span className="chat-icon">🏫</span>
            </div>
                         <div>
               <h2>
                 {user?.college_name ? `${user.college_name} Chat` : 'College Chat'}
                 {user?.student_status === 'Alumni' && (
                   <span className="alumni-badge" title="Alumni">
                     🎓
                   </span>
                 )}
               </h2>
               <p>{onlineUsers.length} people online</p>
             </div>
          </div>
          <div className="chat-header-actions">
            <button className="header-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
            <div className="header-menu-container">
              <button 
                className="header-btn"
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              {showHeaderMenu && (
                <div className="header-menu">
                  <button 
                    className="menu-item clear-chat"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
                        clearChat();
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="messages-container" ref={chatContainerRef}>
          {loading ? (
            <div className="loading-messages">
              <div className="spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending a message!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                data-message-id={message.id}
                className={`message ${message.user_id === user.id ? 'own-message' : 'other-message'}`}
                onMouseEnter={() => handleMessageMouseEnter(message.id)}
                onMouseLeave={() => {
                  // Only hide if we're not hovering over the reaction bar
                  setTimeout(() => {
                    if (showReactionBar === message.id) {
                      const isHoveringReactionBar = document.querySelector('.reaction-bar:hover');
                      if (!isHoveringReactionBar) {
                        setShowReactionBar(null);
                      }
                    }
                  }, 100);
                }}
                onTouchStart={() => handleTouchStart(message.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
              >
                {message.user_id !== user.id && (
                  <div className="message-avatar">
                    <img 
                      src={message.profile_picture || '/image/default-avatar.svg'} 
                      alt={message.username}
                      onError={(e) => {
                        e.target.src = '/image/default-avatar.svg';
                      }}
                    />
                  </div>
                )}
                <div className="message-content">
                  {message.user_id !== user.id && (
                    <div className="message-header">
                      <span className="message-username">
                        {message.username}
                        {message.student_status === 'Alumni' && (
                          <span className="alumni-badge" title="Alumni">
                            🎓
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Reply preview */}
                  {message.reply_to_id && message.reply_username && (
                    <div className="message-reply-preview" onClick={() => scrollToRepliedMessage(message.reply_to_id)}>
                      <div className="reply-indicator">
                        <span>↩️ {message.reply_username}</span>
                      </div>
                      <div className="reply-content">
                        {message.reply_message_type === 'photo' ? (
                          <div className="reply-media">
                            <img src={message.reply_media_url} alt="Photo" />
                            {message.reply_content && <span>{message.reply_content}</span>}
                          </div>
                        ) : message.reply_message_type === 'video' ? (
                          <div className="reply-media">
                            <span>🎥 Video</span>
                            {message.reply_content && <span>{message.reply_content}</span>}
                          </div>
                        ) : (
                          <span>{message.reply_content}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <>
                    {renderMessageContent(message)}
                    {message.isEdited && (
                      <span className="message-edited-indicator">(edited)</span>
                    )}
                  </>
                  
                                      <div className="message-footer">
                      <div className="message-time">{formatTime(message.created_at)}</div>
                      
                      <div className="message-footer-right">
                        {/* Reaction counts */}
                        {renderReactionCounts(message)}
                        
                        {/* Reply button for all messages */}
                        <button 
                          className="message-reply-btn"
                          onClick={() => handleReplyToMessage(message)}
                          title="Reply to message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                          </svg>
                        </button>
                        
                        {/* Message actions for own messages */}
                        {message.user_id === user.id && (
                        <div className="message-actions">
                          <button 
                            className="message-action-btn"
                            onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                          </button>
                          
                          {showMessageMenu === message.id && (
                            <div className="message-menu">
                              <button 
                                className="menu-item"
                                onClick={() => handleReplyToMessage(message)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                                </svg>
                                Reply
                              </button>
                              {canEditMessage(message) && message.message_type === 'text' && (
                                <button 
                                  className="menu-item"
                                  onClick={() => startEditingMessage(message)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                  </svg>
                                  Edit
                                </button>
                              )}
                              {!canEditMessage(message) && message.message_type === 'text' && (
                                <div className="menu-item disabled">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                  </svg>
                                  Edit (expired)
                                </div>
                              )}
                              <button 
                                className="menu-item delete"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this message?')) {
                                    handleDeleteMessage(message.id);
                                  }
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reaction bar */}
                  {renderReactionBar(message.id)}
                </div>
              </div>
            ))
          )}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">{typingUsers.join(', ')} is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="message-input-container">
          <div className="message-input-wrapper">
            <button 
              className="input-btn emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
            <button 
              className="input-btn media-btn"
              onClick={toggleMediaOptions}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={400}
                  searchPlaceholder="Search emoji..."
                />
              </div>
            )}
                         <div className="message-input-area">
               {editingMessage && (
                 <div className="editing-indicator">
                   <span>Editing message...</span>
                   <button 
                     onClick={cancelEditing}
                     className="cancel-edit-btn"
                   >
                     ✕
                   </button>
                 </div>
               )}
               {replyingTo && (
                 <div className="reply-preview">
                   <div className="reply-indicator">
                     <span>↩️ Replying to {replyingTo.username}</span>
                     <button 
                       onClick={cancelReply}
                       className="cancel-reply-btn"
                     >
                       ✕
                     </button>
                   </div>
                   <div className="reply-content">
                     {replyingTo.message_type === 'photo' ? (
                       <div className="reply-media">
                         <img src={replyingTo.media_url} alt="Photo" />
                         {replyingTo.content && <span>{replyingTo.content}</span>}
                       </div>
                     ) : replyingTo.message_type === 'video' ? (
                       <div className="reply-media">
                         <span>🎥 Video</span>
                         {replyingTo.content && <span>{replyingTo.content}</span>}
                       </div>
                     ) : (
                       <span>{replyingTo.content}</span>
                     )}
                   </div>
                 </div>
               )}
               <textarea
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 onKeyPress={handleKeyPress}
                 placeholder={editingMessage ? "Edit your message..." : "Aa"}
                 className="message-input"
                 rows="1"
                 disabled={sending || uploadingPhoto}
               />
             </div>
             <button
               onClick={sendMessage}
               disabled={(!newMessage.trim() && !uploadingPhoto) || sending || uploadingPhoto}
               className="send-button"
             >
               {sending || uploadingPhoto ? (
                 <div className="sending-spinner"></div>
               ) : editingMessage ? (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                 </svg>
               ) : (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                 </svg>
               )}
             </button>
          </div>
          
          {/* Media Options */}
          {showMediaOptions && (
            <div className="media-options">
              <button 
                className="media-option"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Photo</span>
              </button>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
