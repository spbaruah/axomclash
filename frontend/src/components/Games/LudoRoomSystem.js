import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaClock, FaArrowLeft } from 'react-icons/fa';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import LudoGameBoard from './LudoGameBoard';
import './LudoRoomSystem.css';

const LudoRoomSystem = ({ onBack, gameRoom: initialGameRoom, waitingPlayers, userProfile }) => {
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [countdown, setCountdown] = useState(5);
  const [gameRoom, setGameRoom] = useState(initialGameRoom);
  const { socket } = useSocket();

  useEffect(() => {
    if (gameRoom && gameRoom.status === 'starting') {
      startCountdown();
    }
  }, [gameRoom]);

  useEffect(() => {
    // Update local gameRoom state when prop changes
    if (initialGameRoom) {
      setGameRoom(initialGameRoom);
    } else {
      // Set a default gameRoom structure to prevent loading issues
      setGameRoom({
        id: 'temp-room',
        status: 'waiting',
        type: 'ludo',
        players: [],
        gameData: {
          gameState: 'waiting',
          currentTurn: 0,
          pieces: [],
          gameHistory: []
        }
      });
    }
  }, [initialGameRoom]);

  useEffect(() => {
    if (socket) {
      socket.on('gameStart', handleGameStart);
      socket.on('roomCreated', handleRoomCreated);
    }

    return () => {
      if (socket) {
        socket.off('gameStart');
        socket.off('roomCreated');
      }
    };
  }, [socket]);

  const startCountdown = () => {
    setRoomStatus('starting');
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Don't set status here - let the backend gameStart event handle it
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGameStart = (data) => {
    setRoomStatus('playing');
    // Update the gameRoom with the latest data
    if (data.room) {
      setGameRoom(data.room);
    }
    toast.success('🎮 Ludo game started! Good luck!');
  };

  const handleRoomCreated = (data) => {
    if (data.room) {
      setGameRoom(data.room);
    }
    setRoomStatus('starting');
    toast.success('Game room created! Starting in 5 seconds...');
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leave-ludo-queue', { userId: userProfile.id });
    }
    onBack();
  };

  const handleGameAction = (action, data) => {
    if (socket) {
      socket.emit('game-action', {
        gameId: gameRoom?.id,
        action,
        gameData: data
      });
    }
  };

  const renderWaitingScreen = () => (
    <div className="ludo-waiting-screen">
      <div className="waiting-header">
        <h2>🎲 Ludo Battle - Free for All</h2>
        <p>Every player for themselves - First to finish all pieces wins!</p>
      </div>

      <div className="queue-status">
        <div className="player-count">
          <FaUsers className="icon" />
          <span>{waitingPlayers.length}/4 Players</span>
        </div>
        <div className="waiting-message">
          {waitingPlayers.length < 4 ? (
            <p>Need {4 - waitingPlayers.length} more player{4 - waitingPlayers.length !== 1 ? 's' : ''} to start</p>
          ) : (
            <p>Room will be created automatically!</p>
          )}
        </div>
        {waitingPlayers.some(p => p.isBot) && (
          <div className="bot-info">
            🤖 Bots automatically added for testing - Room will start immediately!
          </div>
        )}
      </div>

      <div className="waiting-players">
        <h3>Players in Queue:</h3>
        <div className="players-grid">
          {waitingPlayers.map((player, index) => (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`player-card ${player.isBot ? 'bot-player' : ''}`}
            >
              <div className="player-avatar">
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <h4>
                  {player.username}
                  {player.isBot && <span className="bot-badge">🤖</span>}
                </h4>
                <p>{player.collegeName}</p>
              </div>
              <div className="join-time">
                {new Date(player.joinedAt).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 4 - waitingPlayers.length }).map((_, index) => (
            <motion.div
              key={`empty-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (waitingPlayers.length + index) * 0.1 }}
              className="player-card empty"
            >
              <div className="player-avatar empty">
                <FaUsers />
              </div>
              <div className="player-info">
                <h4>Waiting...</h4>
                <p>Join the queue!</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="queue-actions">
        <button className="leave-queue-btn" onClick={leaveQueue}>
          <FaArrowLeft /> Leave Queue
        </button>
      </div>
    </div>
  );

  const renderStartingScreen = () => (
    <div className="ludo-starting-screen">
      <div className="starting-header">
        <h2>🚀 Game Room Created!</h2>
        <p>Preparing to start Ludo Battle...</p>
      </div>

      <div className="countdown-section">
        <div className="countdown-timer">
          <FaClock className="icon" />
          <span className="countdown-number">{countdown}</span>
        </div>
        <p>Game starts in {countdown} second{countdown !== 1 ? 's' : ''}</p>
      </div>

      <div className="room-info">
        <h3>Room Details:</h3>
        <div className="room-details">
          <div className="detail-item">
            <span className="label">Room ID:</span>
            <span className="value">{gameRoom?.id || 'Generating...'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Game Type:</span>
            <span className="value">Ludo Battle</span>
          </div>
          <div className="detail-item">
            <span className="label">Players:</span>
            <span className="value">{waitingPlayers.length}/4</span>
          </div>
        </div>
      </div>

      <div className="team-preview">
        <h3>Player Formation:</h3>
        <div className="players-formation">
          {waitingPlayers.map((player, index) => (
            <div key={player.userId} className="individual-player">
              <div className="player-avatar individual" style={{ backgroundColor: player.color || '#FF6B6B' }}>
                {player.username.charAt(0)}
              </div>
              <div className="player-details">
                <span className="player-name">
                  {player.username}
                  {player.isBot && <span className="bot-badge">🤖</span>}
                </span>
                <span className="player-college">{player.collegeName}</span>
              </div>
              {index < waitingPlayers.length - 1 && <div className="vs-separator">VS</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGameScreen = () => {
    return (
      <LudoGameBoard
        gameRoom={gameRoom}
        currentPlayer={userProfile}
        onGameAction={handleGameAction}
      />
    );
  };

  return (
    <div className="ludo-room-system">
      <div className="room-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Back to Games
        </button>
        <h1>🎲 Ludo Battle</h1>
        <div className="room-status-badge">
          {roomStatus === 'waiting' && <span className="waiting">Waiting</span>}
          {roomStatus === 'starting' && <span className="starting">Starting</span>}
          {roomStatus === 'playing' && <span className="playing">Playing</span>}
        </div>
      </div>

      <div className="room-content">
        <AnimatePresence mode="wait">
          {roomStatus === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderWaitingScreen()}
            </motion.div>
          )}

          {roomStatus === 'starting' && (
            <motion.div
              key="starting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderStartingScreen()}
            </motion.div>
          )}

          {roomStatus === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderGameScreen()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LudoRoomSystem;
