import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ReportPostModal.css';

const ReportPostModal = ({ isOpen, onClose, postId, postContent }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam', icon: '🚫' },
    { value: 'inappropriate', label: 'Inappropriate Content', icon: '⚠️' },
    { value: 'harassment', label: 'Harassment', icon: '😡' },
    { value: 'violence', label: 'Violence', icon: '⚔️' },
    { value: 'fake_news', label: 'Fake News', icon: '📰' },
    { value: 'other', label: 'Other', icon: '❓' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`/api/posts/${postId}/report`, {
        reason,
        description: description.trim() || null
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.status === 200) {
        toast.success('Post reported successfully');
        onClose();
        // Reset form
        setReason('');
        setDescription('');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to report post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setReason('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Post</h3>
          <button className="close-btn" onClick={handleClose} disabled={loading}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="post-preview">
            <h4>Post Content:</h4>
            <p>{postContent}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reason">Reason for reporting *</label>
              <div className="reason-options">
                {reportReasons.map((option) => (
                  <label key={option.value} className="reason-option">
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={loading}
                    />
                    <span className="reason-icon">{option.icon}</span>
                    <span className="reason-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Additional details (optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide more details about why you're reporting this post..."
                rows="4"
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!reason || loading}
              >
                {loading ? 'Reporting...' : 'Report Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportPostModal;
