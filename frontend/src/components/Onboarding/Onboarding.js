import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

// Components
import WelcomeScreen from './WelcomeScreen';
import LanguageSelection from './LanguageSelection';
import CollegeSelection from './CollegeSelection';
import ProfileSetup from './ProfileSetup';
import StarterChallenge from './StarterChallenge';

// Styles
import './Onboarding.css';

const Onboarding = () => {
  const { registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    language: 'en',
    college: null,
    profile: {},
    password: ''
  });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Fetch colleges on component mount (only once)
  const fetchColleges = useCallback(async () => {
    if (collegesLoading) return; // Prevent multiple simultaneous calls
    
    setCollegesLoading(true);
    setCollegesError(false);
    
    try {
      const response = await axios.get('/api/colleges');
      setColleges(response.data.colleges || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setCollegesError(true);
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error('Failed to load colleges. Please refresh the page.');
      }
    } finally {
      setCollegesLoading(false);
    }
  }, [collegesLoading]);

  useEffect(() => {
    if (colleges.length === 0 && !collegesLoading && !collegesError) {
      fetchColleges();
    }
  }, [colleges.length, collegesLoading, collegesError, fetchColleges]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleLanguageSelect = (language) => {
    setOnboardingData(prev => ({ ...prev, language }));
    handleNext();
  };

  const handleCollegeSelect = (college) => {
    setOnboardingData(prev => ({ ...prev, college }));
    handleNext();
  };

  const handleProfileSubmit = (profileData) => {
    setOnboardingData(prev => ({ ...prev, profile: profileData }));
    handleNext();
  };

  const handlePasswordSubmit = (password) => {
    setOnboardingData(prev => ({ ...prev, password }));
    handleNext();
  };

  const handleStarterChallenge = async () => {
    setLoading(true);
    try {
      const userData = {
        username: onboardingData.profile.username,
        email: onboardingData.profile.email,
        password: onboardingData.password,
        college_id: onboardingData.college.id,
        student_status: onboardingData.profile.studentStatus,
        bio: onboardingData.profile.bio
      };

      await registerUser(userData);
      toast.success('Welcome to CampusClash! 🎉');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      component: WelcomeScreen,
      props: { 
        onNext: handleNext,
        onLoginModeChange: setIsLoginMode
      }
    },
    {
      component: LanguageSelection,
      props: { onLanguageSelect: handleLanguageSelect, selectedLanguage: onboardingData.language }
    },
    {
      component: CollegeSelection,
      props: { 
        onCollegeSelect: handleCollegeSelect, 
        colleges: colleges,
        onBack: handleBack
      }
    },
    {
      component: ProfileSetup,
      props: { 
        onSubmit: handleProfileSubmit, 
        onBack: handleBack
      }
    },
    {
      component: PasswordSetup,
      props: { 
        onSubmit: handlePasswordSubmit, 
        onBack: handleBack
      }
    },
    {
      component: StarterChallenge,
      props: { 
        onComplete: handleStarterChallenge,
        onBack: handleBack,
        loading: loading
      }
    }
  ];

  const CurrentStepComponent = steps[currentStep].component;
  const currentStepProps = steps[currentStep].props;

  return (
    <div className={`onboarding-container ${isLoginMode ? 'login-mode' : ''}`}>
      <div className="onboarding-background">
        <div className="gradient-overlay"></div>
      </div>
      
      <div className="onboarding-content">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`step-dot ${index <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="step-container"
          >
            <CurrentStepComponent {...currentStepProps} />
          </motion.div>
        </AnimatePresence>
        
        {/* Colleges Loading State */}
        {collegesLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="colleges-loading"
          >
            <p>Loading colleges...</p>
            <div className="loading-spinner"></div>
          </motion.div>
        )}
        
        {/* Colleges Loading Error Retry */}
        {collegesError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="colleges-error-retry"
          >
            <p>Failed to load colleges data</p>
            <button 
              onClick={fetchColleges}
              className="retry-btn"
              disabled={collegesLoading}
            >
              {collegesLoading ? 'Loading...' : 'Retry'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Password Setup Component
const PasswordSetup = ({ onSubmit, onBack }) => {
  const { FaLock } = require('react-icons/fa');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    onSubmit(password);
  };

  return (
    <div className="password-setup">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="setup-header"
      >
        <h2>Create Your Password</h2>
        <p>Choose a strong password to secure your account</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="profile-form"
      >
        <div className="form-group">
          <label htmlFor="password">
            <FaLock />
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={error ? 'error' : ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            <FaLock />
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className={error ? 'error' : ''}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="nav-buttons"
      >
        <button
          onClick={onBack}
          className="nav-btn secondary"
        >
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          className="nav-btn primary"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
