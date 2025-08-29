import React from 'react';
import { motion } from 'framer-motion';
import { FaFire, FaClock, FaStar } from 'react-icons/fa';
import './Challenges.css';

const Challenges = () => {
  return (
    <div className="challenges-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="challenges-header"
      >
        <h1>Challenges</h1>
        <p>Complete challenges to earn points and climb the leaderboard</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="coming-soon-container"
      >
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <FaFire />
          </div>
          <h2>Coming Soon!</h2>
          <p>We're working hard to bring you amazing challenges. Stay tuned for exciting daily, weekly, and monthly tasks that will help you earn points and compete with other students!</p>
          
          <div className="challenge-types-preview">
            <div className="challenge-type">
              <FaFire className="type-icon daily" />
              <span>Daily Challenges</span>
            </div>
            <div className="challenge-type">
              <FaClock className="type-icon weekly" />
              <span>Weekly Challenges</span>
            </div>
            <div className="challenge-type">
              <FaStar className="type-icon monthly" />
              <span>Monthly Challenges</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Challenges;
