import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaMapMarkerAlt, FaTrophy, FaUsers, FaArrowLeft, FaArrowRight, FaGraduationCap } from 'react-icons/fa';

const CollegeSelection = ({ onCollegeSelect, colleges, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Debug: Log the colleges prop
  console.log('CollegeSelection received colleges:', colleges);
  console.log('Colleges length:', colleges?.length);
  if (colleges && colleges.length > 0) {
    console.log('First college:', colleges[0]);
    console.log('First college name:', colleges[0]?.name);
  }

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredColleges([]);
      setHasSearched(false);
    } else {
      setHasSearched(true);
      const filtered = colleges.filter(college =>
        college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Filtered colleges:', filtered);
      console.log('College names:', filtered.map(c => c.name));
      setFilteredColleges(filtered);
    }
  }, [searchTerm, colleges]);

  const handleCollegeSelect = (college) => {
    setSelectedCollege(college);
    setSearchTerm(college.name);
  };

  const handleContinue = () => {
    if (selectedCollege) {
      onCollegeSelect(selectedCollege);
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear selection when search changes
    if (selectedCollege && !value.toLowerCase().includes(selectedCollege.name.toLowerCase())) {
      setSelectedCollege(null);
    }
  };

  return (
    <div className="college-selection">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="college-header"
      >
        <h2>Select Your College</h2>
        <p>Search for your college to join the community and start earning points</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="college-search"
      >
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Start typing to search for your college (e.g., 'Gauhati', 'Delhi', 'Mumbai')..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
      </motion.div>

      {/* Search Instructions */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="search-instructions"
        >
          <div className="instructions-content">
            <FaSearch className="instructions-icon" />
            <div className="instructions-text">
              <h3>Search for your college</h3>
              <p>Type the name of your college, city, or state to find it quickly</p>
              <div className="search-examples">
                <span className="example">Try: "Gauhati"</span>
                <span className="example">Try: "Delhi University"</span>
                <span className="example">Try: "Mumbai"</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* College List */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="college-list"
        >
          {filteredColleges.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No colleges found</h3>
              <p>No colleges found matching "{searchTerm}"</p>
              <div className="no-results-suggestions">
                <p>Try:</p>
                <ul>
                  <li>Check the spelling of your search term</li>
                  <li>Try searching by city or state instead</li>
                  <li>Use a shorter search term</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className="results-count">
                Found {filteredColleges.length} college{filteredColleges.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
              {filteredColleges.map((college, index) => {
                console.log('Rendering college:', college);
                return (
                  <motion.div
                    key={college.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className={`college-item ${selectedCollege?.id === college.id ? 'selected' : ''}`}
                    onClick={() => handleCollegeSelect(college)}
                  >
                    <div className="college-details">
                      <div className="college-name">
                        {college.name || 'No Name Available'}
                        {!college.name && <span style={{color: 'red'}}> (DEBUG: name is missing)</span>}
                      </div>
                      <div className="college-location">
                        <FaMapMarkerAlt />
                        <span>{college.city}, {college.state}</span>
                      </div>
                    </div>

                    {selectedCollege?.id === college.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="selection-indicator"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="nav-buttons"
      >
        <button
          onClick={handleBackClick}
          className="nav-btn secondary"
        >
          <FaArrowLeft />
          Back
        </button>
        
        <button
          onClick={handleContinue}
          disabled={!selectedCollege}
          className="nav-btn primary"
        >
          Continue
          <FaArrowRight />
        </button>
      </motion.div>


    </div>
  );
};

export default CollegeSelection;
