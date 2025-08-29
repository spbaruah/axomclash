import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaComment, FaHeart, FaReply, FaTimes, FaUser, FaPaperPlane } from 'react-icons/fa';
import './PostComments.css';

const PostComments = ({ postId, isOpen, onClose, onCommentAdded }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId, fetchComments]);

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await axios.get(`/api/posts/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment.trim(),
        parent_id: null
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const newCommentData = response.data.comment;
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      toast.success('Comment added! 🎉');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTo) return;

    try {
      setLoading(true);
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: replyText.trim(),
        parent_id: replyTo.id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const newReplyData = response.data.comment;
      setComments(prev => [newReplyData, ...prev]);
      setReplyText('');
      setReplyTo(null);
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      toast.success('Reply added! 🎉');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await axios.post(`/api/comments/${commentId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes_count: comment.is_liked ? (comment.likes_count || 1) - 1 : (comment.likes_count || 0) + 1, 
              is_liked: !comment.is_liked 
            }
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return commentDate.toLocaleDateString();
  };

  const handleUserProfileClick = (userId) => {
    if (userId && userId !== userProfile?.id) {
      navigate(`/profile/${userId}`);
    }
  };

  const renderComment = (comment, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`comment-item ${isReply ? 'reply' : ''}`}
    >
      <div 
        className="comment-avatar clickable"
        onClick={() => handleUserProfileClick(comment.user_id)}
        style={{ cursor: 'pointer' }}
      >
        {comment.user?.profile_picture ? (
          <img src={comment.user.profile_picture} alt="Profile" />
        ) : (
          <FaUser />
        )}
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <span 
            className="comment-author clickable"
            onClick={() => handleUserProfileClick(comment.user_id)}
            style={{ cursor: 'pointer' }}
          >
            @{comment.user?.username || 'Anonymous'}
          </span>
          <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
        </div>
        
        <p className="comment-text">{comment.content}</p>
        
        <div className="comment-actions">
          <button 
            className={`action-btn ${comment.is_liked ? 'liked' : ''}`}
            onClick={() => handleLikeComment(comment.id)}
          >
            <FaHeart /> {comment.likes_count || 0}
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setReplyTo(comment)}
          >
            <FaReply /> Reply
          </button>
        </div>

        {/* Reply Form */}
        {replyTo?.id === comment.id && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="reply-form"
            onSubmit={handleSubmitReply}
          >
            <div className="reply-input-group">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${comment.user?.username || 'Anonymous'}...`}
                className="reply-input"
              />
              <button type="submit" className="reply-submit-btn" disabled={loading || !replyText.trim()}>
                <FaPaperPlane />
              </button>
            </div>
            <button 
              type="button" 
              className="cancel-reply-btn"
              onClick={() => {
                setReplyTo(null);
                setReplyText('');
              }}
            >
              Cancel
            </button>
          </motion.form>
        )}
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="comments-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="comments-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="comments-header">
            <h3>Comments</h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Comments List */}
          <div className="comments-list">
            {commentsLoading ? (
              <div className="comments-loading">
                <div className="loading-spinner"></div>
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                <FaComment />
                <p>No comments yet. Be the first to comment! 💬</p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>

          {/* Add Comment Form */}
          <form className="add-comment-form" onSubmit={handleSubmitComment}>
            <div className="comment-input-group">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="comment-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="comment-submit-btn" 
                disabled={loading || !newComment.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostComments;
