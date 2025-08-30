import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/axios';
import toast from 'react-hot-toast';
import { FaTimes, FaImage, FaVideo, FaPoll, FaSmile, FaPaperPlane } from 'react-icons/fa';
import './CreatePost.css';

const CreatePost = ({ isOpen, onClose, onPostCreated, onRefreshData }) => {
  const { userProfile } = useAuth();
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  const postTypes = [
    { id: 'text', label: 'Text', icon: FaSmile },
    { id: 'photo', label: 'Photo', icon: FaImage },
    { id: 'video', label: 'Video', icon: FaVideo },
    { id: 'poll', label: 'Poll', icon: FaPoll }
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (postType === 'photo') {
        return file.type.startsWith('image/');
      } else if (postType === 'video') {
        return file.type.startsWith('video/');
      }
      return false;
    });

    if (validFiles.length !== files.length) {
      toast.error(`Some files were invalid for ${postType} posts`);
    }

    setMediaFiles(validFiles);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && postType === 'text') {
      toast.error('Please write something to post');
      return;
    }

    if (postType === 'photo' && mediaFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    if (postType === 'video' && mediaFiles.length === 0) {
      toast.error('Please select a video');
      return;
    }

    if (postType === 'poll') {
      const validOptions = pollOptions.filter(option => option.trim());
      if (validOptions.length < 2) {
        toast.error('Please provide at least 2 poll options');
        return;
      }
    }

    setLoading(true);

    try {
      let mediaUrls = [];
      
      // Upload media files if any
      if (mediaFiles.length > 0) {
        console.log('Uploading media files:', mediaFiles);
        // Media files will be uploaded directly with the post creation
        // No separate upload step needed
      }

      // Create FormData for post with media files
      const formData = new FormData();
      formData.append('type', postType);
      formData.append('content', content.trim());
      formData.append('visibility', visibility);
      
      if (postType === 'poll' && pollOptions.filter(opt => opt.trim()).length > 0) {
        formData.append('poll_options', JSON.stringify(pollOptions.filter(opt => opt.trim())));
      }
      
      // Add media files
      if (mediaFiles.length > 0) {
        mediaFiles.forEach(file => {
          formData.append('media', file);
        });
      }

      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Post creation response:', response.data);
      toast.success('Post created successfully! 🎉');
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setPollOptions(['', '']);
      setPostType('text');
      setVisibility('public');
      
      // Close modal and refresh posts with a small delay to ensure backend processing
      onClose();
      if (onPostCreated) {
        // Use the complete post data returned from the backend
        const newPost = response.data.post;
        console.log('Post data from backend:', newPost);
        
        if (!newPost) {
          console.error('No post data received from backend');
          toast.error('Post created but data not received. Please refresh to see your post.');
          return;
        }
        
        // Add any missing frontend-specific fields
        const enhancedPost = {
          ...newPost,
          is_liked: false,
          user: {
            username: newPost.username,
            profile_picture: newPost.profile_picture,
            college_name: newPost.college_name
          }
        };
        
        console.log('Enhanced post for frontend:', enhancedPost);
        
        // Update UI immediately with the complete post data
        onPostCreated(enhancedPost);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setContent('');
      setMediaFiles([]);
      setPollOptions(['', '']);
      setPostType('text');
      setVisibility('public');
      onClose();
    }
  };

  // Add/remove body class to hide bottom navigation
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('create-post-modal-open');
    } else {
      document.body.classList.remove('create-post-modal-open');
      
      // Add entrance animation class to bottom navigation
      const bottomNav = document.querySelector('.bottom-navigation');
      if (bottomNav) {
        bottomNav.classList.add('entering');
        // Remove the class after animation completes
        setTimeout(() => {
          bottomNav.classList.remove('entering');
        }, 800);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('create-post-modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="create-post-overlay"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="create-post-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h3>Create Post</h3>
            <button 
              className="close-btn"
              onClick={handleClose}
              disabled={loading}
            >
              <FaTimes />
            </button>
          </div>

          {/* Post Type Selector */}
          <div className="post-type-selector">
            {postTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`type-btn ${postType === type.id ? 'active' : ''}`}
                  onClick={() => setPostType(type.id)}
                  disabled={loading}
                >
                  <Icon />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="post-form">
            {/* Content Input */}
            <div className="content-input">
              <textarea
                placeholder={`What's happening at ${userProfile?.college_name}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>

            {/* Media Upload */}
            {postType === 'photo' && (
              <div className="media-upload">
                <label className="upload-label">
                  <FaImage />
                  <span>Select Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
                                 {mediaFiles.length > 0 && (
                   <div className="selected-files">
                     {mediaFiles.map((file, index) => (
                       <div key={index} className="file-preview">
                         {file.type.startsWith('image/') ? (
                           <img src={URL.createObjectURL(file)} alt="Preview" />
                         ) : (
                           <video controls>
                             <source src={URL.createObjectURL(file)} />
                           </video>
                         )}
                         <span>{file.name}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {postType === 'video' && (
              <div className="media-upload">
                <label className="upload-label">
                  <FaVideo />
                  <span>Select Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
                {mediaFiles.length > 0 && (
                  <div className="selected-files">
                    <div className="file-preview">
                      <video controls>
                        <source src={URL.createObjectURL(mediaFiles[0])} />
                      </video>
                      <span>{mediaFiles[0].name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Poll Options */}
            {postType === 'poll' && (
              <div className="poll-options">
                <h4>Poll Options</h4>
                {pollOptions.map((option, index) => (
                  <div key={index} className="poll-option">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      disabled={loading}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        className="remove-option-btn"
                        onClick={() => removePollOption(index)}
                        disabled={loading}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    className="add-option-btn"
                    onClick={addPollOption}
                    disabled={loading}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {/* Visibility Settings */}
            <div className="visibility-settings">
              <h4>Who can see this post?</h4>
              <div className="visibility-options">
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={loading}
                  />
                  <span className="visibility-label">
                    <span className="visibility-icon">🌍</span>
                    <div>
                      <strong>Public</strong>
                      <small>Everyone can see this post</small>
                    </div>
                  </span>
                </label>
                
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    value="college_only"
                    checked={visibility === 'college_only'}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={loading}
                  />
                  <span className="visibility-label">
                    <span className="visibility-icon">🏫</span>
                    <div>
                      <strong>College Only</strong>
                      <small>Only your college members can see</small>
                    </div>
                  </span>
                </label>
                
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={loading}
                  />
                  <span className="visibility-label">
                    <span className="visibility-icon">🔒</span>
                    <div>
                      <strong>Private</strong>
                      <small>Only you can see this post</small>
                    </div>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || (!content.trim() && postType === 'text')}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <FaPaperPlane />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePost;
