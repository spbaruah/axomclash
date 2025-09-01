import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaPlay, FaClock, FaStar, FaTimes, FaHandRock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import api from '../../services/axios';

import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import BottomNavigation from '../common/BottomNavigation';
import './Games.css';

const Games = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameRoom, setGameRoom] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [loading, setLoading] = useState(false);

  const [waitingPlayers, setWaitingPlayers] = useState([]);
  
  const { userProfile } = useAuth();
  const { socket } = useSocket();

  // Game configurations
  const gameTypes = [
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      description: 'Quick 3x3 grid battle - 2 players',
      icon: FaTimes,
      players: 2,
      duration: '5-10 min',
      difficulty: 'Easy',
      reward: 50,
      color: '#4ECDC4',
      autoCreate: false
    },
    {
      id: 'rockpaperscissors',
      name: 'Rock Paper Scissors',
      description: 'Classic RPS battle - 2 players, multiple game modes',
      icon: FaHandRock,
      players: 2,
      duration: '3-5 min',
      difficulty: 'Easy',
      reward: 75,
      color: '#9C27B0',
      autoCreate: false
    },


  ];

  const upcomingGames = [
    {
      id: 'ludo',
      name: '🏁 Ludo Race',
      description: '4-player race to finish - Get all 4 pieces home first to win!',
      icon: '🎲',
      color: '#FF6B6B',
      players: '4',
      duration: '10-15 min',
      difficulty: 'Easy',
      status: 'Coming Soon'
    },
    {
      id: 'quiz',
      name: '🧠 Quiz Challenge',
      description: 'Knowledge battle - 2-4 players',
      icon: '🧠',
      color: '#45B7D1',
      players: '2-4',
      duration: '10-15 min',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'emoji-battle',
      name: 'Emoji Battle',
      description: 'Each player picks an emoji "fighter" (🔥💧🌱⚡ etc.), with unique strengths/weaknesses. Fire beats Plant, Plant beats Water, etc.',
      icon: '😎⚡',
      color: '#FF9F43',
      players: '2',
      duration: '2-3 min',
      difficulty: 'Easy',
      status: 'Coming Soon'
    },
    {
      id: 'tap-speed-duel',
      name: 'Tap Speed Duel',
      description: 'Both players tap as fast as they can in 5 seconds, the one with the higher count wins.',
      icon: '⏱',
      color: '#5F27CD',
      players: '2',
      duration: '5-10 sec',
      difficulty: 'Easy',
      status: 'Coming Soon'
    },
    {
      id: 'gesture-match',
      name: 'Gesture Match',
      description: 'Instead of just Rock-Paper-Scissors, add more gestures (Spock 🖖, Lizard 🦎, etc.), or even camera-based hand recognition.',
      icon: '✋✊✌',
      color: '#00D2D3',
      players: '2',
      duration: '1-2 min',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'color-dash',
      name: 'Color Dash',
      description: 'A random color name shows up, but in a different text color (like "RED" written in blue). You must tap the correct color fast.',
      icon: '🎨',
      color: '#FF6B6B',
      players: '2',
      duration: '30-60 sec',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'memory-flip',
      name: 'Memory Flip Challenge',
      description: 'Cards flash for a second, then hide. You must recall and tap their order.',
      icon: '🃏',
      color: '#26DE81',
      players: '2',
      duration: '2-3 min',
      difficulty: 'Hard',
      status: 'Coming Soon'
    },
    {
      id: 'quick-draw',
      name: 'Quick Draw Duel',
      description: 'Two players wait for "FIRE!" signal. Whoever taps first after the signal wins (but tapping early = disqualified).',
      icon: '🤠🔫',
      color: '#FC427B',
      players: '2',
      duration: '10-30 sec',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'shape-builder',
      name: 'Shape Builder',
      description: 'Random shapes drop (like mini Tetris pieces), players compete to place them faster or form a pattern.',
      icon: '🔺⚪',
      color: '#A55EEA',
      players: '2',
      duration: '3-5 min',
      difficulty: 'Hard',
      status: 'Coming Soon'
    },
    {
      id: 'guess-sound',
      name: 'Guess the Sound',
      description: 'Short sound plays (clap, animal, beep), and players must guess it quickly.',
      icon: '🎶',
      color: '#FD79A8',
      players: '2',
      duration: '1-2 min',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'chain-reaction',
      name: 'Chain Reaction',
      description: 'Tap a ball and watch it explode into smaller ones; timing matters to catch more.',
      icon: '💥',
      color: '#FDCB6E',
      players: '2',
      duration: '2-3 min',
      difficulty: 'Medium',
      status: 'Coming Soon'
    },
    {
      id: 'truth-dare',
      name: 'Truth or Dare Wheel',
      description: 'A spinner game where players get quick fun dares or questions.',
      icon: '🎡',
      color: '#6C5CE7',
      players: '2-4',
      duration: '5-10 min',
      difficulty: 'Easy',
      status: 'Coming Soon'
    }
  ];

  useEffect(() => {
    fetchGames();
    if (socket) {
      socket.on('gameUpdate', handleGameUpdate);
      socket.on('gameStart', handleGameStart);
      socket.on('gameEnd', handleGameEnd);
      socket.on('playerJoined', handlePlayerJoined);
      socket.on('roomCreated', handleRoomCreated);
      socket.on('waitingForPlayers', handleWaitingForPlayers);

    }

    return () => {
      if (socket) {
        socket.off('gameUpdate');
        socket.off('gameStart');
        socket.off('gameEnd');
        socket.off('playerJoined');
        socket.off('roomCreated');
        socket.off('waitingForPlayers');

      }
    };
  }, [socket]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/games/active');
      setAvailableGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const handleGameUpdate = (data) => {
    toast.success('Game updated!');
  };

  const handleGameStart = (data) => {
    toast.success('Game started!');
  };

  const handleGameEnd = (data) => {
    toast.success('Game ended!');
    fetchGames(); // Refresh games list
  };

  const handlePlayerJoined = (data) => {
    setWaitingPlayers(prev => [...prev, data.player]);
    toast.success(`${data.player.username} joined the game!`);
  };

  const handleRoomCreated = (data) => {
    setGameRoom(data.room);
    setWaitingPlayers([]);
    toast.success('Game room created! Starting in 5 seconds...');
  };

  const handleWaitingForPlayers = (data) => {
    setWaitingPlayers(data.players);
    toast(`Waiting for ${4 - data.players.length} more players...`);
  };





  // Create game for non-auto games
  const createGame = async (gameType) => {
    try {
      setLoading(true);
      await api.post('/api/games', {
        name: `${gameType.name} - ${userProfile.college_name}`,
        type: gameType.id,
        college2_id: null, // Will be set when opponent joins
        max_players: gameType.players,
        points_at_stake: gameType.reward
      });
      
      toast.success('Game created! Waiting for opponents...');
      fetchGames();
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId) => {
    try {
      setLoading(true);
      await api.post(`/api/games/${gameId}/join`);
      
      toast.success('Joined game successfully!');
      fetchGames();
      // Join socket room
      if (socket) {
        socket.emit('join-game', gameId);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const startGame = (gameType) => {
    // For manual games, show the game board
    // TicTacToe will show mode selection first
    setSelectedGame(gameType);
    setGameRoom(null);
  };

  const renderGameBoard = () => {
    if (!selectedGame) return null;

    switch (selectedGame.id) {
      case 'tictactoe':
        return <TicTacToe gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
      case 'rockpaperscissors':
        return <RockPaperScissors gameType={selectedGame} onBack={() => setSelectedGame(null)} />;


      default:
        return null;
    }
  };

  if (selectedGame) {
    return renderGameBoard();
  }

  return (
    <div 
      className="games-container"
      style={{
        minHeight: '100vh',
        padding: '24px',
        paddingTop: '94px',
        background: '#ffffff'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="games-header"
      >
        <h1>🎮 College Battle Games</h1>
        <p>Challenge other colleges in exciting multiplayer games!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="games-tabs"
      >
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Games
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="games-content"
      >
        {activeTab === 'available' && (
          <div className="games-grid">
            {gameTypes.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="game-card"
                style={{ borderColor: game.color }}
              >
                <div className="game-icon" style={{ color: game.color }}>
                  <game.icon size={40} />
                </div>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <div className="game-stats">
                  <span><FaUsers /> {game.players} players</span>
                  <span><FaClock /> {game.duration}</span>
                  <span><FaStar /> {game.difficulty}</span>
                </div>
                <div className="game-reward">
                  <span>Reward: {game.reward} points</span>
                </div>
                <div className="game-actions">
                  <button 
                    className="play-btn primary"
                    onClick={() => startGame(game)}
                  >
                    <FaPlay /> Play
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="games-grid">
            {upcomingGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="game-card upcoming"
                style={{ borderColor: game.color }}
              >
                <div className="game-icon upcoming-icon" style={{ color: game.color }}>
                  <span className="emoji-icon">{game.icon}</span>
                </div>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <div className="game-stats">
                  <span><FaUsers /> {game.players} players</span>
                  <span><FaClock /> {game.duration}</span>
                  <span><FaStar /> {game.difficulty}</span>
                </div>
                <div className="game-status">
                  <span className="coming-soon-badge">{game.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <BottomNavigation />
    </div>
  );
};

export default Games;
