import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGamepad, FaUsers, FaPlay, FaClock, FaStar, FaDice, FaBrain, FaSpinner, FaTimes, FaHandRock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import api from '../../services/axios';
import LudoRaceGame from './LudoRaceGame';
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
  const [joiningGame, setJoiningGame] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  
  const { userProfile } = useAuth();
  const { socket } = useSocket();

  // Game configurations
  const gameTypes = [
    {
      id: 'ludo',
      name: '🏁 Ludo Race',
      description: '4-player race to finish - Get all 4 pieces home first to win!',
      icon: FaDice,
      players: 4,
      duration: '10-15 min',
      difficulty: 'Easy',
      reward: 150,
      color: '#FF6B6B',
      autoCreate: true
    },
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
    {
      id: 'quiz',
      name: 'Quiz Challenge',
      description: 'Knowledge battle - 2-4 players',
      icon: FaBrain,
      players: '2-4',
      duration: '10-15 min',
      difficulty: 'Medium',
      reward: 100,
      color: '#45B7D1',
      autoCreate: false
    },

  ];

  const upcomingGames = [
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
      socket.on('ludoRaceUpdate', handleLudoRaceUpdate);
      socket.on('ludoRacePlayerJoined', handleLudoRacePlayerJoined);
    }

    return () => {
      if (socket) {
        socket.off('gameUpdate');
        socket.off('gameStart');
        socket.off('gameEnd');
        socket.off('playerJoined');
        socket.off('roomCreated');
        socket.off('waitingForPlayers');
        socket.off('ludoRaceUpdate');
        socket.off('ludoRacePlayerJoined');
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

  // Ludo Race specific handlers
  const handleLudoRaceUpdate = (data) => {
    if (data.room) {
      setGameRoom(data.room);
      toast.success('Game room updated!');
    }
  };

  const handleLudoRacePlayerJoined = (data) => {
    if (data.room) {
      setGameRoom(data.room);
      toast.success(`${data.player.username} joined the race!`);
      
      // Check if we have enough players to start
      if (data.room.players.length >= 2) {
        toast.success('Ready to start! Click Start Game when ready.');
      }
    }
  };

  // Handle game actions for Ludo Race
  const handleGameAction = (action, data) => {
    if (!socket) return;
    
    switch (action) {
      case 'rollDice':
        socket.emit('rollDice', data);
        break;
      case 'movePiece':
        socket.emit('movePiece', data);
        break;
      case 'resetGame':
        socket.emit('resetGame', data);
        break;
      default:
        console.log('Unknown game action:', action);
    }
  };

  // Automatic room creation for Ludo Race
  const joinLudoGame = async () => {
    try {
      setJoiningGame(true);
      
      // Create a new Ludo Race room
      const response = await api.post('/api/games/ludo-race', {
        name: `🏁 Ludo Race - ${userProfile.college_name}`,
        max_players: 4,
        points_at_stake: 150
      });
      
      toast.success('Ludo Race room created! Waiting for players...');
      
      // Set the game room
      setSelectedGame(gameTypes.find(g => g.id === 'ludo'));
      setGameRoom(response.data.room);
      
      // Join socket room
      if (socket) {
        socket.emit('join-ludo-race-room', {
          roomId: response.data.room.id,
          userId: userProfile.id,
          username: userProfile.username
        });
      }
    } catch (error) {
      console.error('Error creating Ludo Race room:', error);
      toast.error('Failed to create game room');
    } finally {
      setJoiningGame(false);
    }
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
    if (gameType.autoCreate) {
      // For auto-create games like Ludo, just join the queue
      if (gameType.id === 'ludo') {
        joinLudoGame();
      }
    } else {
      // For manual games, show the game board
      // TicTacToe will show mode selection first
      setSelectedGame(gameType);
      setGameRoom(null);
    }
  };

  const renderGameBoard = () => {
    if (!selectedGame) return null;

    switch (selectedGame.id) {
      case 'ludo':
                return <LudoRaceGame
          gameRoom={gameRoom}
          currentPlayer={userProfile}
          onGameAction={handleGameAction}
        />;
      case 'tictactoe':
        return <TicTacToe gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
      case 'rockpaperscissors':
        return <RockPaperScissors gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
      case 'quiz':
        return <QuizGame gameType={selectedGame} onBack={() => setSelectedGame(null)} />;

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
                  {game.autoCreate ? (
                    <button 
                      className="play-btn primary"
                      onClick={() => startGame(game)}
                      disabled={joiningGame}
                    >
                      {joiningGame ? (
                        <>
                          <FaSpinner className="spinning" /> Joining...
                        </>
                      ) : (
                        <>
                          <FaPlay /> Play
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      className="play-btn primary"
                      onClick={() => startGame(game)}
                    >
                      <FaPlay /> Play
                    </button>
                  )}
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

// Ludo Game Component
const LudoGame = ({ gameType, onBack }) => {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [canRoll, setCanRoll] = useState(true);
  const [winner, setWinner] = useState(null);
  
  // College vs College players
  const [players, setPlayers] = useState([
    { 
      id: 0, 
      name: 'Rahul Sharma', 
      college: 'IIT Guwahati', 
      color: '#FF6B6B', 
      pieces: [
        { id: 0, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 1, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 2, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 3, position: 'home', steps: 0, isHome: true, isFinished: false }
      ],
      avatar: '👨‍🎓',
      score: 0
    },
    { 
      id: 1, 
      name: 'Priya Patel', 
      college: 'Gauhati University', 
      color: '#4ECDC4', 
      pieces: [
        { id: 0, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 1, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 2, position: 'home', steps: 0, isHome: true, isFinished: false },
        { id: 3, position: 'home', steps: 0, isHome: true, isFinished: false }
      ],
      avatar: '👩‍🎓',
      score: 0
    }
  ]);

  // Ludo board paths and positions
  const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
  
  function initializeLudoPaths() {
    // Create the classic Ludo board path (52 positions)
    const paths = [];
    for (let i = 0; i < 52; i++) {
      paths.push({
        position: i,
        pieces: [],
        isSafe: safeSpots.includes(i),
        color: null
      });
    }
    return paths;
  }
  
  const [boardPaths, setBoardPaths] = useState(initializeLudoPaths());
  const [safeSpotsState, setSafeSpotsState] = useState(safeSpots);

  const rollDice = async () => {
    if (!canRoll || isRolling) return;
    
    setIsRolling(true);
    setCanRoll(false);
    
    // Animate dice roll
    for (let i = 0; i < 10; i++) {
      const tempValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(tempValue);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const finalValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(finalValue);
    
    setIsRolling(false);
    
    // Check if player can move any piece
    const canMove = checkIfCanMove(finalValue);
    if (!canMove) {
      toast("No valid moves available. Turn passed to next player.");
      nextTurn();
    } else {
      toast.success(`Dice rolled: ${finalValue}! Select a piece to move.`);
    }
  };

  const checkIfCanMove = (diceValue) => {
    const currentPlayerPieces = players[currentPlayer].pieces;
    
    // Check if any piece can be moved out of home
    if (diceValue === 6) {
      const homePieces = currentPlayerPieces.filter(p => p.isHome);
      if (homePieces.length > 0) return true;
    }
    
    // Check if any piece on board can move
    const boardPieces = currentPlayerPieces.filter(p => !p.isHome && !p.isFinished);
    if (boardPieces.length > 0) return true;
    
    return false;
  };

  const selectPiece = (pieceId) => {
    if (!canRoll && !isRolling) {
      setSelectedPiece(pieceId);
      movePiece(pieceId);
    }
  };

  const movePiece = (pieceId) => {
    const piece = players[currentPlayer].pieces.find(p => p.id === pieceId);
    if (!piece) return;

    let newPosition = piece.position;
    let newSteps = piece.steps;

    if (piece.isHome && diceValue === 6) {
      // Move out of home
      newPosition = 'board';
      newSteps = 0;
      piece.isHome = false;
    } else if (!piece.isHome) {
      // Move on board
      newSteps += diceValue;
      if (newSteps >= 57) {
        // Piece finished
        piece.isFinished = true;
        piece.position = 'finished';
        checkWinner();
      } else {
        newPosition = 'board';
      }
    }

    // Update piece
    const updatedPlayers = [...players];
    const playerIndex = updatedPlayers.findIndex(p => p.id === currentPlayer);
    const pieceIndex = updatedPlayers[playerIndex].pieces.findIndex(p => p.id === pieceId);
    
    updatedPlayers[playerIndex].pieces[pieceIndex] = {
      ...piece,
      position: newPosition,
      steps: newSteps
    };

    setPlayers(updatedPlayers);
    setSelectedPiece(null);
    
    // Check for special moves (capturing, safe spots)
    handleSpecialMoves(piece, newSteps);
    
    // Next turn (unless rolled 6)
    if (diceValue !== 6) {
      nextTurn();
    } else {
      setCanRoll(true);
      toast.success("You rolled a 6! Roll again!");
    }
  };

  const handleSpecialMoves = (piece, newSteps) => {
    // Check if piece landed on opponent piece (capture)
    const opponentPieces = players.filter(p => p.id !== currentPlayer).flatMap(p => p.pieces);
    const opponentOnPosition = opponentPieces.find(p => !p.isHome && p.steps === newSteps);
    
    if (opponentOnPosition && !safeSpots.includes(newSteps)) {
      // Capture opponent piece
      opponentOnPosition.position = 'home';
      opponentOnPosition.steps = 0;
      opponentOnPosition.isHome = true;
      opponentOnPosition.isFinished = false;
      
      toast.success(`🎯 Captured opponent's piece!`);
      
      // Award points
      const updatedPlayers = [...players];
      const playerIndex = updatedPlayers.findIndex(p => p.id === currentPlayer);
      updatedPlayers[playerIndex].score += 10;
      setPlayers(updatedPlayers);
    }
  };

  const nextTurn = () => {
    setCurrentPlayer((prev) => (prev + 1) % players.length);
    setCanRoll(true);
    setDiceValue(0);
  };

  const checkWinner = () => {
    const currentPlayerPieces = players[currentPlayer].pieces;
    const finishedPieces = currentPlayerPieces.filter(p => p.isFinished);
    
    if (finishedPieces.length === 4) {
      setWinner(currentPlayer);
      setGameState('finished');
      toast.success(`🎉 ${players[currentPlayer].name} from ${players[currentPlayer].college} wins!`);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameState('playing');
    toast.success('🎮 Ludo Battle started! College vs College!');
  };

  const renderDice = () => (
    <div className={`dice ${isRolling ? 'rolling' : ''}`}>
      <div className="dice-inner">
        {diceValue > 0 && (
          <div className="dice-dots">
            {[...Array(diceValue)].map((_, i) => (
              <div key={i} className="dice-dot" />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPlayerProfile = (player, isCurrentTurn) => (
    <div className={`player-profile ${isCurrentTurn ? 'current-turn' : ''}`}>
      <div className="player-avatar">{player.avatar}</div>
      <div className="player-info">
        <h4>{player.name}</h4>
        <p className="college-name">{player.college}</p>
        <p className="player-score">Score: {player.score}</p>
      </div>
      <div className="player-pieces-status">
        {player.pieces.map((piece, idx) => (
          <div 
            key={idx}
            className={`piece-status ${piece.isFinished ? 'finished' : piece.isHome ? 'home' : 'board'}`}
            style={{ backgroundColor: player.color }}
            onClick={() => selectPiece(piece.id)}
          />
        ))}
      </div>
    </div>
  );

  const renderLudoBoard = () => (
    <div className="ludo-board">
      <div className="board-center">
        <div className="center-logo">🎯</div>
      </div>
      
      {/* Home areas */}
      <div className="home-areas">
        <div className="home-area red-home" style={{ backgroundColor: players[0].color }}>
          {players[0].pieces.map((piece, idx) => (
            <div 
              key={idx}
              className={`home-piece ${piece.isHome ? 'visible' : 'hidden'}`}
              onClick={() => piece.isHome && diceValue === 6 ? selectPiece(piece.id) : null}
            />
          ))}
        </div>
        
        <div className="home-area green-home" style={{ backgroundColor: players[1].color }}>
          {players[1].pieces.map((piece, idx) => (
            <div 
              key={idx}
              className={`home-piece ${piece.isHome ? 'visible' : 'hidden'}`}
              onClick={() => piece.isHome && diceValue === 6 ? selectPiece(piece.id) : null}
            />
          ))}
        </div>
      </div>
      
      {/* Board path */}
      <div className="board-path">
        {boardPaths.map((path, idx) => (
          <div 
            key={idx}
            className={`path-cell ${path.isSafe ? 'safe' : ''}`}
            style={{ backgroundColor: path.color || 'transparent' }}
          >
            {path.pieces.map((piece, pieceIdx) => (
              <div 
                key={pieceIdx}
                className="path-piece"
                style={{ backgroundColor: players[piece.playerId].color }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (gameState === 'waiting') {
    return (
      <div className="game-board ludo-board">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>← Back to Games</button>
          <h2>{gameType.name}</h2>
          <div className="game-info">
            <span>College vs College Battle</span>
            <span>Waiting for players...</span>
          </div>
        </div>

        <div className="ludo-waiting">
          <div className="college-battle">
            <div className="college-vs">
              <div className="college-card">
                <h3>🏛️ IIT Guwahati</h3>
                <p>Represented by Rahul Sharma</p>
                <div className="college-color" style={{ backgroundColor: players[0].color }}></div>
              </div>
              
              <div className="vs-badge">VS</div>
              
              <div className="college-card">
                <h3>🎓 Gauhati University</h3>
                <p>Represented by Priya Patel</p>
                <div className="college-color" style={{ backgroundColor: players[1].color }}></div>
              </div>
            </div>
            
            <button className="start-battle-btn" onClick={startGame}>
              🚀 Start College Battle!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="game-board ludo-board">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>← Back to Games</button>
          <h2>🏆 Battle Results</h2>
        </div>

        <div className="battle-results">
          <div className="winner-announcement">
            <h2>🎉 {players[winner].college} Wins!</h2>
            <p>Champion: {players[winner].name}</p>
            <div className="winner-avatar">{players[winner].avatar}</div>
          </div>
          
          <div className="final-scores">
            {players.map((player, idx) => (
              <div key={idx} className={`final-score ${idx === winner ? 'winner' : ''}`}>
                <span className="college-name">{player.college}</span>
                <span className="final-score-value">{player.score} pts</span>
              </div>
            ))}
          </div>
          
          <button className="play-again-btn" onClick={() => window.location.reload()}>
            🎮 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-board ludo-board">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>← Back to Games</button>
        <h2>{gameType.name}</h2>
        <div className="game-info">
          <span>🎯 College vs College Battle</span>
          <span>🏆 First to finish all pieces wins!</span>
        </div>
      </div>

      <div className="ludo-game-container">
        {/* Player Profiles */}
        <div className="player-profiles">
          {players.map((player, idx) => renderPlayerProfile(player, idx === currentPlayer))}
        </div>

        {/* Game Board */}
        <div className="game-board-section">
          {renderLudoBoard()}
        </div>

        {/* Game Controls */}
        <div className="game-controls-section">
          <div className="dice-section">
            {renderDice()}
            <button 
              className={`roll-dice-btn ${!canRoll || isRolling ? 'disabled' : ''}`}
              onClick={rollDice}
              disabled={!canRoll || isRolling}
            >
              {isRolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
            </button>
          </div>
          
          <div className="game-status">
            <p>Current Turn: <strong>{players[currentPlayer].name}</strong></p>
            <p>College: <strong>{players[currentPlayer].college}</strong></p>
            {diceValue > 0 && <p>Dice: <strong>{diceValue}</strong></p>}
          </div>
        </div>
      </div>
    </div>
  );
};



// Quiz Game Component
const QuizGame = ({ gameType, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchQuizQuestions();
  }, []);

  const fetchQuizQuestions = async () => {
    try {
      const response = await api.get('/api/quiz/questions?category=General Knowledge&difficulty=easy&limit=5');
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
    }
  };

  const startQuiz = () => {
    setGameStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    toast.success('Quiz started! Good luck!');
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQ = questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correct_answer;

    if (isCorrect) {
      setScore(score + currentQ.points);
      toast.success(`Correct! +${currentQ.points} points`);
    } else {
      toast.error(`Wrong! Correct answer: ${currentQ.options[currentQ.correct_answer]}`);
    }

    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Quiz completed
        toast.success(`Quiz completed! Final score: ${score + (isCorrect ? currentQ.points : 0)}`);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStarted(false);
  };

  if (questions.length === 0) {
    return (
      <div className="game-board quiz-board">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>← Back to Games</button>
          <h2>{gameType.name}</h2>
        </div>
        <div className="loading">Loading quiz questions...</div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="game-board quiz-board">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>← Back to Games</button>
        <h2>{gameType.name}</h2>
        <div className="game-info">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
      </div>

      <div className="quiz-container">
        {!gameStarted ? (
          <div className="quiz-start">
            <h3>Ready to test your knowledge?</h3>
            <p>Answer 5 questions and earn points!</p>
            <button className="start-btn" onClick={startQuiz}>
              Start Quiz
            </button>
          </div>
        ) : currentQuestion < questions.length ? (
          <div className="question-container">
            <div className="question">
              <h3>{currentQ.question}</h3>
            </div>
            
            <div className="options">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="answer-controls">
              <button 
                className="submit-btn"
                onClick={submitAnswer}
                disabled={selectedAnswer === null || showResult}
              >
                Submit Answer
              </button>
            </div>

            {showResult && (
              <div className="result">
                <p>{selectedAnswer === currentQ.correct_answer ? '✅ Correct!' : '❌ Wrong!'}</p>
                <p>Explanation: {currentQ.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="quiz-complete">
            <h3>🎉 Quiz Completed!</h3>
            <p>Final Score: {score} points</p>
            <button className="reset-btn" onClick={resetQuiz}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};










export default Games;
