import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGlobe, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const LanguageSelection = ({ onLanguageSelect, selectedLanguage }) => {
  const [selected, setSelected] = useState(selectedLanguage);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      description: 'International language for global communication'
    },
    {
      code: 'as',
      name: 'Assamese',
      nativeName: 'অসমীয়া',
      description: 'Official language of Assam, rich in culture and heritage'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      description: 'National language of India, widely spoken across the country'
    }
  ];

  const handleLanguageSelect = (languageCode) => {
    setSelected(languageCode);
  };

  const handleContinue = () => {
    if (selected) {
      onLanguageSelect(selected);
    }
  };

  return (
    <div className="language-selection">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="language-header"
      >
        <FaGlobe className="header-icon" />
        <h2>Choose Your Language</h2>
        <p>Select your preferred language for the best experience</p>
      </motion.div>

      <div className="language-options">
        {languages.map((language, index) => (
          <motion.div
            key={language.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`language-option ${selected === language.code ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect(language.code)}
          >
            <div className="language-info">
              <h3>{language.name}</h3>
              <div className="native-name">{language.nativeName}</div>
              <p>{language.description}</p>
            </div>
            {selected === language.code && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="selection-indicator"
              >
                ✓
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="nav-buttons"
      >
        <button
          onClick={() => window.history.back()}
          className="nav-btn secondary"
        >
          <FaArrowLeft />
          Back
        </button>
        
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="nav-btn primary"
        >
          Continue
          <FaArrowRight />
        </button>
      </motion.div>
    </div>
  );
};

export default LanguageSelection;
