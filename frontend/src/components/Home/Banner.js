import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Banner.css';

const Banner = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!banners || banners.length === 0) {
    return (
      <div className="banner-container">
        <div className="banner-placeholder">
          <div className="placeholder-content">
            <div className="banner-logo">
              <img src="/image/logo.png" alt="CampusClash Logo" className="banner-logo-image" />
            </div>
            <h3>Welcome to CampusClash</h3>
            <p>Your college community platform</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="banner-container">
      <div className="banner-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="banner-slide"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={banners[currentIndex].image_url} 
              alt={banners[currentIndex].title || 'Banner'} 
              className="banner-image"
            />
            {banners[currentIndex].title && (
              <>
                {/* Toggle Button */}
                <button 
                  className="banner-toggle-btn"
                  onClick={() => setShowDetails(!showDetails)}
                  title={showDetails ? "Hide Details" : "Show Details"}
                >
                  {showDetails ? "×" : "ℹ"}
                </button>
                
                {/* Details Card */}
                {showDetails && (
                  <div className="banner-content-card">
                    <div className="banner-content">
                      <h3>{banners[currentIndex].title}</h3>
                      {banners[currentIndex].description && (
                        <p>{banners[currentIndex].description}</p>
                      )}
                      {banners[currentIndex].cta_text && (
                        <button className="banner-cta">
                          {banners[currentIndex].cta_text}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Banner;
