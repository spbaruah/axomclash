import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaCrown, FaMedal, FaUser, FaSearch, FaArrowUp, FaArrowDown, FaMinus, FaStar, FaUsers, FaChartLine, FaSpinner, FaBell } from 'react-icons/fa';
import BottomNavigation from '../common/BottomNavigation';
import { getCollegeRankings, getUserRankings } from '../../services/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('college');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [collegeRankings, setCollegeRankings] = useState([]);
  const [studentRankings, setStudentRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [previousPoints, setPreviousPoints] = useState({});
  const [nextRefresh, setNextRefresh] = useState(30);

  // Fetch college rankings
  const fetchCollegeRankings = async () => {
    try {
      setLoading(true);
      const response = await getCollegeRankings();
      const colleges = response.colleges.map((college, index) => ({
        id: college.id,
        name: college.name,
        points: college.total_points || 0,
        rank: index + 1,
        students: college.member_count || 0,
        logo: college.logo_url,
        change: 0, // TODO: Implement change tracking
        growth: 0, // TODO: Implement growth tracking
        challenges: 0, // TODO: Implement challenge tracking
        winRate: 0 // TODO: Implement win rate tracking
      }));
      // Store previous points for comparison
      const newPreviousPoints = {};
      colleges.forEach(college => {
        const previous = collegeRankings.find(c => c.id === college.id)?.points || 0;
        newPreviousPoints[college.id] = previous;
        
        // Show notification for significant changes
        if (Math.abs(college.total_points - previous) >= 10) {
          showRankingNotification(college, college.total_points - previous);
        }
      });
      setPreviousPoints(newPreviousPoints);
      
      setCollegeRankings(colleges);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching college rankings:', err);
      setError('Failed to fetch college rankings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student rankings
  const fetchStudentRankings = async () => {
    try {
      setLoading(true);
      const response = await getUserRankings();
      const students = response.leaderboard.map((student, index) => ({
        id: student.id,
        name: student.full_name || student.username,
        college: student.college_name || 'Unknown College',
        points: student.total_points || 0,
        rank: index + 1,
        avatar: student.profile_picture,
        change: 0, // TODO: Implement change tracking
        level: getLevelFromPoints(student.total_points || 0),
        badges: Math.floor((student.total_points || 0) / 100), // Calculate badges based on points
        streak: student.daily_streak || 0
      }));
      // Store previous points for comparison
      const newPreviousPoints = {};
      students.forEach(student => {
        const previous = studentRankings.find(s => s.id === student.id)?.points || 0;
        newPreviousPoints[student.id] = previous;
        
        // Show notification for significant changes
        if (Math.abs(student.total_points - previous) >= 10) {
          showRankingNotification(student, student.total_points - previous);
        }
      });
      setPreviousPoints(newPreviousPoints);
      
      setStudentRankings(students);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching student rankings:', err);
      setError('Failed to fetch student rankings');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine level based on points
  const getLevelFromPoints = (points) => {
    if (points >= 1000) return 'Master';
    if (points >= 750) return 'Expert';
    if (points >= 500) return 'Advanced';
    if (points >= 250) return 'Intermediate';
    return 'Beginner';
  };

  const getPointChange = (currentPoints, itemId) => {
    const previous = previousPoints[itemId] || 0;
    const change = currentPoints - previous;
    if (change === 0) return null;
    return change > 0 ? `+${change}` : `${change}`;
  };

  const showRankingNotification = (item, change) => {
    if (Math.abs(change) >= 10) { // Only show notifications for significant changes
      const message = change > 0 
        ? `🎉 ${item.name} gained ${change} points!`
        : `📉 ${item.name} lost ${Math.abs(change)} points`;
      
      // Create a custom notification
      const notification = document.createElement('div');
      notification.className = `ranking-notification ${change > 0 ? 'positive' : 'negative'}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">${change > 0 ? '🎉' : '📉'}</span>
          <span class="notification-text">${message}</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  };

  // Fetch data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'college') {
      fetchCollegeRankings();
    } else {
      fetchStudentRankings();
    }
  }, [activeTab]);

  // Refresh data every 30 seconds to keep it dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'college') {
        fetchCollegeRankings();
      } else {
        fetchStudentRankings();
      }
      setNextRefresh(30);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Countdown timer for next refresh
  useEffect(() => {
    const countdown = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const getRankingsByTab = () => {
    return activeTab === 'college' ? collegeRankings : studentRankings;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaCrown className="rank-icon gold" />;
    if (rank === 2) return <FaMedal className="rank-icon silver" />;
    if (rank === 3) return <FaMedal className="rank-icon bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  const getChangeIndicator = (change) => {
    if (change > 0) return <span className="change-up"><FaArrowUp /> +{change}</span>;
    if (change < 0) return <span className="change-down"><FaArrowDown /> {change}</span>;
    return <span className="change-neutral"><FaMinus /></span>;
  };

  const getLevelBadge = (level) => {
    const colors = {
      'Master': '#f59e0b',
      'Expert': '#10b981',
      'Advanced': '#3b82f6',
      'Intermediate': '#8b5cf6',
      'Beginner': '#6b7280'
    };
    
    return (
      <span 
        className="level-badge"
        style={{ backgroundColor: colors[level] }}
      >
        {level}
      </span>
    );
  };

  const getGrowthIndicator = (growth) => {
    if (growth > 0) {
      return (
        <div className="growth-indicator positive">
          <FaArrowUp />
          <span>+{growth}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="growth-indicator negative">
          <FaArrowDown />
          <span>{growth}%</span>
        </div>
      );
    }
    return (
      <div className="growth-indicator neutral">
        <FaMinus />
        <span>0%</span>
      </div>
    );
  };

  const sortRankings = (rankings) => {
    return [...rankings].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'change':
          aValue = a.change;
          bValue = b.change;
          break;
        default:
          aValue = a.rank;
          bValue = b.rank;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredRankings = sortRankings(
    getRankingsByTab().filter(item => {
      if (activeTab === 'college') {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               item.college.toLowerCase().includes(searchTerm.toLowerCase());
      }
    })
  );

  const getMaxPoints = () => {
    return Math.max(...getRankingsByTab().map(item => item.points));
  };

  const getProgressPercentage = (points) => {
    return (points / getMaxPoints()) * 100;
  };

  return (
    <div className="leaderboard-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="leaderboard-header"
      >
        <h1>🏆 Leaderboard</h1>
        <p>Discover the champions and track your progress</p>
        {loading && (
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span>Live updating...</span>
          </div>
        )}
        <button 
          className={`refresh-btn ${loading ? 'loading' : ''}`}
          onClick={() => {
            if (activeTab === 'college') {
              fetchCollegeRankings();
            } else {
              fetchStudentRankings();
            }
          }}
          disabled={loading}
        >
          <FaSpinner className={loading ? 'spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>

      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="leaderboard-tabs"
      >
        <button
          className={`tab-btn ${activeTab === 'college' ? 'active' : ''}`}
          onClick={() => setActiveTab('college')}
        >
          <FaTrophy /> College Rankings
        </button>
        <button
          className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
          onClick={() => setActiveTab('student')}
        >
          <FaUser /> Student Rankings
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="leaderboard-controls"
      >
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'college' ? 'colleges' : 'students'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="rank">Sort by Rank</option>
            <option value="points">Sort by Points</option>
            <option value="name">Sort by Name</option>
            <option value="change">Sort by Change</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="leaderboard-content"
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="loading-state"
          >
            <FaSpinner className="loading-spinner" />
            <p>Loading {activeTab === 'college' ? 'Colleges' : 'Students'}...</p>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="error-state"
          >
            <h3>Error: {error}</h3>
            <p>Failed to fetch {activeTab === 'college' ? 'college' : 'student'} data.</p>
            <button onClick={() => {
              if (activeTab === 'college') {
                fetchCollegeRankings();
              } else {
                fetchStudentRankings();
              }
            }}>Retry</button>
          </motion.div>
        )}
        {!loading && !error && filteredRankings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="no-results"
          >
            <FaSearch className="no-results-icon" />
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
          </motion.div>
        )}
        {!loading && !error && filteredRankings.length > 0 && (
          <div className="rankings-list">
            <AnimatePresence>
              {filteredRankings.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`ranking-item ${index < 3 ? 'top-three' : ''}`}
                >
                  <div className="rank-info">
                    <div className="rank-display">
                      {getRankIcon(item.rank)}
                    </div>
                    
                    <div className="item-avatar">
                      {activeTab === 'college' ? (
                        item.logo ? (
                          <img src={item.logo} alt={`${item.name} logo`} />
                        ) : (
                          <div className="avatar-placeholder">
                            <FaTrophy />
                          </div>
                        )
                      ) : (
                        item.avatar ? (
                          <img src={item.avatar} alt={`${item.name} avatar`} />
                        ) : (
                          <div className="avatar-placeholder">
                            <FaUser />
                          </div>
                        )
                      )}
                    </div>

                    <div className="item-details">
                      <h3>{item.name}</h3>
                      {activeTab === 'student' && (
                        <div className="student-info">
                          <p className="college-name">{item.college}</p>
                          <div className="student-stats">
                            {getLevelBadge(item.level)}
                            <span className="badge-count">
                              <FaStar /> {item.badges}
                            </span>
                            <span className="streak-count">
                              <FaChartLine /> {item.streak}
                            </span>
                          </div>
                        </div>
                      )}
                      {activeTab === 'college' && (
                        <div className="college-info">
                          <p className="student-count">
                            <FaUsers /> {item.students} students
                          </p>
                          <div className="college-stats">
                            <span className="challenge-count">
                              <FaTrophy /> {item.challenges} challenges
                            </span>
                            <span className="win-rate">
                              <FaChartLine /> {item.winRate}% win rate
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rank-stats">
                    <div className="points">
                      <span className="points-label">Points</span>
                      <div className="points-display">
                        <motion.span 
                          className="points-value"
                          key={item.points}
                          initial={{ scale: 1.1, color: '#667eea' }}
                          animate={{ scale: 1, color: '#0f172a' }}
                          transition={{ duration: 0.3 }}
                        >
                          {item.points.toLocaleString()}
                        </motion.span>
                        {getPointChange(item.points, item.id) && (
                          <motion.span 
                            className={`point-change ${getPointChange(item.points, item.id).startsWith('+') ? 'positive' : 'negative'}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            {getPointChange(item.points, item.id)}
                          </motion.span>
                        )}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getProgressPercentage(item.points)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="rank-change">
                      <span className="change-label">Change</span>
                      {getChangeIndicator(item.change)}
                    </div>

                    {activeTab === 'college' && (
                      <div className="growth-stats">
                        {getGrowthIndicator(item.growth)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="leaderboard-summary"
      >
        <div className="summary-card">
          <h3>📊 Leaderboard Statistics</h3>
          <div className="summary-stats">
            <div className="stat">
              <FaUsers className="stat-icon" />
              <span className="stat-label">Total {activeTab === 'college' ? 'Colleges' : 'Students'}</span>
              <span className="stat-value">{getRankingsByTab().length}</span>
            </div>
            <div className="stat">
              <FaTrophy className="stat-icon" />
              <span className="stat-label">Top Score</span>
              <span className="stat-value">
                {Math.max(...getRankingsByTab().map(item => item.points)).toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <FaChartLine className="stat-icon" />
              <span className="stat-label">Average Score</span>
              <span className="stat-value">
                {Math.round(getRankingsByTab().reduce((sum, item) => sum + item.points, 0) / getRankingsByTab().length).toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <FaStar className="stat-icon" />
              <span className="stat-label">Active {activeTab === 'college' ? 'Colleges' : 'Students'}</span>
              <span className="stat-value">
                {getRankingsByTab().filter(item => item.change !== 0).length}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      <BottomNavigation />
    </div>
  );
};

export default Leaderboard;
