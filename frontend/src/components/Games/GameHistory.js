import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaGamepad, FaCalendar, FaClock, FaMedal, FaHistory } from 'react-icons/fa';
import { getGameHistory } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './GameHistory.css';

const GameHistory = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, won, lost
  const { user } = useAuth();

  useEffect(() => {
    fetchGameHistory();
  }, []);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const response = await getGameHistory();
      if (response.success) {
        setGames(response.games);
      } else {
        setError('Failed to fetch game history');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch game history');
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameType) => {
    switch (gameType) {
      case 'ludo':
      case 'ludo_race':
        return '🎲';
      case 'tictactoe':
        return '⭕';
      case 'quiz':
        return '❓';
      case 'rps':
        return '✂️';
      case 'chess':
        return '♟️';
      case 'puzzle':
        return '🧩';
      default:
        return '🎮';
    }
  };

  const getGameTypeLabel = (gameType, gameSource) => {
    if (gameSource === 'ludo_race') return 'Ludo Race';
    if (gameSource === 'rps') return 'Rock Paper Scissors';
    
    switch (gameType) {
      case 'ludo':
        return 'Ludo';
      case 'tictactoe':
        return 'Tic Tac Toe';
      case 'quiz':
        return 'Quiz';
      case 'chess':
        return 'Chess';
      case 'puzzle':
        return 'Puzzle';
      default:
        return 'Game';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'won') return game.result === 'Won';
    if (filter === 'lost') return game.result === 'Lost';
    return true;
  });

  const stats = {
    total: games.length,
    won: games.filter(g => g.result === 'Won').length,
    lost: games.filter(g => g.result === 'Lost').length,
    winRate: games.length > 0 ? Math.round((games.filter(g => g.result === 'Won').length / games.length) * 100) : 0
  };

  if (loading) {
    return (
      <div className="game-history-container">
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          />
          <p>Loading your game history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-history-container">
        <div className="error-container">
          <FaHistory className="error-icon" />
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchGameHistory} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-history-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="history-header"
      >
        <div className="header-content">
          <FaHistory className="header-icon" />
          <div>
            <h1>Game History</h1>
            <p>Your gaming journey through time</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-container"
      >
        <div className="stat-card">
          <FaTrophy className="stat-icon won" />
          <div className="stat-content">
            <h3>{stats.won}</h3>
            <p>Wins</p>
          </div>
        </div>
        <div className="stat-card">
          <FaGamepad className="stat-icon total" />
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Games</p>
          </div>
        </div>
        <div className="stat-card">
          <FaMedal className="stat-icon rate" />
          <div className="stat-content">
            <h3>{stats.winRate}%</h3>
            <p>Win Rate</p>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="filter-tabs"
      >
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-tab ${filter === 'won' ? 'active' : ''}`}
          onClick={() => setFilter('won')}
        >
          Won ({stats.won})
        </button>
        <button
          className={`filter-tab ${filter === 'lost' ? 'active' : ''}`}
          onClick={() => setFilter('lost')}
        >
          Lost ({stats.lost})
        </button>
      </motion.div>

      {/* Games List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="games-list"
      >
        {filteredGames.length === 0 ? (
          <div className="empty-state">
            <FaHistory className="empty-icon" />
            <h3>No games found</h3>
            <p>Start playing games to see your history here!</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredGames.map((game, index) => (
              <motion.div
                key={`${game.game_source}-${game.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`game-card ${game.result.toLowerCase()}`}
              >
                <div className="game-header">
                  <div className="game-info">
                    <span className="game-icon">
                      {getGameIcon(game.game_type || game.game_source)}
                    </span>
                    <div>
                      <h4>{game.game_name || getGameTypeLabel(game.game_type, game.game_source)}</h4>
                      <p className="game-date">
                        <FaCalendar className="date-icon" />
                        {formatDate(game.game_date)}
                      </p>
                    </div>
                  </div>
                  <div className={`result-badge ${game.result.toLowerCase()}`}>
                    {game.result}
                  </div>
                </div>

                <div className="game-details">
                  {game.college1_name && game.college2_name && (
                    <div className="college-match">
                      <div className="college">
                        <img 
                          src={game.college1_logo || '/image/default-avatar.svg'} 
                          alt={game.college1_name}
                          className="college-logo"
                        />
                        <span>{game.college1_name}</span>
                      </div>
                      <span className="vs">vs</span>
                      <div className="college">
                        <img 
                          src={game.college2_logo || '/image/default-avatar.svg'} 
                          alt={game.college2_name}
                          className="college-logo"
                        />
                        <span>{game.college2_name}</span>
                      </div>
                    </div>
                  )}

                  <div className="game-meta">
                    <div className="meta-item">
                      <FaClock className="meta-icon" />
                      <span>{formatTime(game.game_date)}</span>
                    </div>
                    {game.points_at_stake && (
                      <div className="meta-item">
                        <FaTrophy className="meta-icon" />
                        <span>{game.points_at_stake} points</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default GameHistory;
