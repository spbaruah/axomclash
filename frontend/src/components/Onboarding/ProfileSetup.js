import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaGraduationCap, FaEdit, FaArrowLeft, FaArrowRight, FaEnvelope } from 'react-icons/fa';

const ProfileSetup = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    studentStatus: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});

  const studentStatusOptions = [
    'Currently Studying',
    'Alumni'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and spaces';
    } else if (/\s{2,}/.test(formData.username)) {
      newErrors.username = 'Username cannot have consecutive spaces';
    } else if (formData.username.startsWith(' ') || formData.username.endsWith(' ')) {
      newErrors.username = 'Username cannot start or end with a space';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.studentStatus) {
      newErrors.studentStatus = 'Please select your student status';
    }

    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  return (
    <div className="profile-setup">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="setup-header"
      >
        <h2>Set Up Your Profile</h2>
        <p>Tell us about yourself</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="profile-form">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="form-group"
        >
          <label htmlFor="username">
            <FaUser />
            Username
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="Choose a unique username (spaces allowed)"
            className={errors.username ? 'error' : ''}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="form-group"
        >
          <label htmlFor="email">
            <FaEnvelope />
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="form-group"
        >
          <label htmlFor="studentStatus">
            <FaGraduationCap />
            Are you currently studying or an alumni?
          </label>
          <select
            id="studentStatus"
            value={formData.studentStatus}
            onChange={(e) => handleInputChange('studentStatus', e.target.value)}
            className={errors.studentStatus ? 'error' : ''}
          >
            <option value="">Select your status</option>
            {studentStatusOptions.map((status, index) => (
              <option key={index} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.studentStatus && <span className="error-message">{errors.studentStatus}</span>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="form-group"
        >
          <label htmlFor="bio">
            <FaEdit />
            Bio (Optional)
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us about yourself..."
            rows="3"
            maxLength="200"
            className={errors.bio ? 'error' : ''}
          />
          <div className="char-count">
            {formData.bio.length}/200
          </div>
          {errors.bio && <span className="error-message">{errors.bio}</span>}
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="nav-buttons"
        >
          <button
            type="button"
            onClick={handleBackClick}
            className="nav-btn secondary"
          >
            <FaArrowLeft />
            Back
          </button>
          
          <button
            type="submit"
            className="nav-btn primary"
          >
            Continue
            <FaArrowRight />
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default ProfileSetup;
