import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaUsers, FaArrowLeft, FaRocket } from 'react-icons/fa';

const StarterChallenge = ({ onComplete, onBack, loading }) => {
  return (
    <div className="starter-challenge">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="challenge-header"
      >
        <h2>Your First Challenge!</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="challenge-card"
      >
        
        <div className="challenge-logo">
          <img src="/image/logo2.png" alt="CampusClash Logo" className="challenge-logo-image" />
        </div>
        
        <h3 className="challenge-title">Welcome to CampusClash!</h3>
        
        <div className="challenge-description">
          <p>🎉 Congratulations! You're about to join the most exciting college community platform.</p>
          <p>Complete this onboarding to unlock:</p>
        </div>

        <div className="challenge-benefits">
          <div className="benefit-item">
            <FaTrophy className="benefit-icon" />
            <div className="benefit-content">
              <h4>+50 Points</h4>
              <p>For you and your college</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <FaUsers className="benefit-icon" />
            <div className="benefit-content">
              <h4>College Chat Access</h4>
              <p>Join your college's official chatroom</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <FaStar className="benefit-icon" />
            <div className="benefit-content">
              <h4>Daily Streak</h4>
              <p>Start earning bonus points daily</p>
            </div>
          </div>
        </div>

        <div className="challenge-reward">
          <div className="reward-amount">+50 Points</div>
          <div className="reward-description">Welcome Bonus</div>
        </div>
      </motion.div>



      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="nav-buttons"
      >
        <button
          onClick={onBack}
          disabled={loading}
          className="nav-btn secondary"
        >
          <FaArrowLeft />
          Back
        </button>
        
        <button
          onClick={onComplete}
          disabled={loading}
          className="nav-btn primary"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Setting up...
            </>
          ) : (
            <>
              <FaRocket />
              Start Your Journey!
            </>
          )}
        </button>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-overlay"
        >
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h3>Setting up your profile...</h3>
            <p>This will only take a moment</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StarterChallenge;
