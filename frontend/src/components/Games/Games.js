import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGamepad, FaUsers, FaPlay, FaClock, FaStar, FaDice, FaBrain, FaSpinner, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import api from '../../services/axios';
import LudoRoomSystem from './LudoRoomSystem';
import TicTacToe from './TicTacToe';
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
      name: 'Ludo Battle',
      description: 'Classic Ludo game - 4 players, free for all, automatic room creation',
      icon: FaDice,
      players: 4,
      duration: '15-20 min',
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
    {
      id: 'snake',
      name: 'Snake Game',
      description: 'Classic snake game - single player',
      icon: FaGamepad,
      players: 1,
      duration: '5-15 min',
      difficulty: 'Easy',
      reward: 75,
      color: '#9B59B6',
      autoCreate: false
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

  // Automatic room creation for Ludo
  const joinLudoGame = async () => {
    try {
      setJoiningGame(true);
      
      // Emit join request to socket
      if (socket) {
        socket.emit('join-ludo-queue', {
          userId: userProfile.id,
          username: userProfile.username,
          collegeId: userProfile.college_id,
          collegeName: userProfile.college_name
        });
        
        toast.success('Joining Ludo queue...');
        
        // Show waiting screen
        setSelectedGame(gameTypes.find(g => g.id === 'ludo'));
        setGameRoom({ status: 'waiting', type: 'ludo' });
      }
    } catch (error) {
      console.error('Error joining Ludo game:', error);
      toast.error('Failed to join game');
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
      setSelectedGame(gameType);
      setGameRoom(null);
    }
  };

  const renderGameBoard = () => {
    if (!selectedGame) return null;

    switch (selectedGame.id) {
      case 'ludo':
        return <LudoRoomSystem 
          onBack={() => setSelectedGame(null)} 
          gameRoom={gameRoom}
          waitingPlayers={waitingPlayers}
          userProfile={userProfile}
        />;
      case 'tictactoe':
        return <TicTacToe gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
      case 'quiz':
        return <QuizGame gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
      case 'snake':
        return <SnakeGame gameType={selectedGame} onBack={() => setSelectedGame(null)} />;
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
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Games
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
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

        {activeTab === 'active' && (
          <div className="active-games">
            {loading ? (
              <div className="loading">Loading active games...</div>
            ) : availableGames.length === 0 ? (
              <div className="no-games">
                <p>No active games at the moment.</p>
                <p>Join a game or wait for others to join!</p>
              </div>
            ) : (
              availableGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="active-game-card"
                >
                  <div className="game-info">
                    <h3>{game.name}</h3>
                    <p>{game.current_players}/{game.max_players} players</p>
                    <span className="game-type">{game.type}</span>
                  </div>
                  <div className="game-status">
                    <span className={`status ${game.status}`}>{game.status}</span>
                    <span className="points">{game.points_at_stake} points at stake</span>
                  </div>
                  <div className="game-actions">
                    <button 
                      className="join-btn"
                      onClick={() => joinGame(game.id)}
                      disabled={loading}
                    >
                      Join Game
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-games">
            <div className="no-games">
              <p>No completed games yet.</p>
              <p>Start playing to see your results here!</p>
            </div>
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

// Snake Game Component
const SnakeGame = ({ gameType, onBack }) => {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(150);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [animationId, setAnimationId] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [trail, setTrail] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  // Multiplayer states
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [gameMode, setGameMode] = useState('single'); // 'single', 'multiplayer', 'battle'
  const [leaderboard, setLeaderboard] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { userProfile } = useAuth();
  const { socket } = useSocket();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Socket event handlers for multiplayer
  useEffect(() => {
    if (!socket || !isMultiplayer) return;

    // Join snake game room
    if (roomId) {
      socket.emit('join-snake-room', { roomId, player: currentPlayer });
    }

    // Listen for player updates
    socket.on('snake-player-update', handlePlayerUpdate);
    socket.on('snake-food-update', handleFoodUpdate);
    socket.on('snake-game-over', handleMultiplayerGameOver);
    socket.on('snake-player-joined', handlePlayerJoined);
    socket.on('snake-player-left', handlePlayerLeft);
    socket.on('snake-chat-message', handleChatMessage);
    socket.on('snake-leaderboard-update', handleLeaderboardUpdate);
    socket.on('snake-spectator-joined', handleSpectatorJoined);
    socket.on('snake-spectator-left', handleSpectatorLeft);

    return () => {
      socket.off('snake-player-update');
      socket.off('snake-food-update');
      socket.off('snake-game-over');
      socket.off('snake-player-joined');
      socket.off('snake-player-left');
      socket.off('snake-chat-message');
      socket.off('snake-leaderboard-update');
      socket.off('snake-spectator-joined');
      socket.off('snake-spectator-left');
    };
  }, [socket, isMultiplayer, roomId, currentPlayer]);

  useEffect(() => {
    if (!gameStarted || isPaused) return;

    const gameLoop = (currentTime) => {
      if (currentTime - lastUpdate >= gameSpeed) {
      moveSnake();
        setLastUpdate(currentTime);
      }
      setAnimationId(requestAnimationFrame(gameLoop));
    };

    setAnimationId(requestAnimationFrame(gameLoop));

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [snake, direction, gameStarted, gameSpeed, lastUpdate, isPaused]);

  // Trail fade effect
  useEffect(() => {
    if (trail.length > 0) {
      const trailTimer = setTimeout(() => {
        setTrail(prev => prev.slice(1));
      }, 300);
      return () => clearTimeout(trailTimer);
    }
  }, [trail]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (gameStarted && !gameOver) {
            setIsPaused(!isPaused);
          }
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (gameStarted && !gameOver) {
            setIsPaused(!isPaused);
          }
          break;
        case 'Enter':
          if (showChat) {
            sendChatMessage();
          }
          break;
        default:
          break;
      }
    };

    if (gameStarted) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameStarted, gameOver, isPaused, showChat]);

  // Touch controls for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && direction !== 'LEFT') {
          setDirection('RIGHT');
        } else if (deltaX < 0 && direction !== 'RIGHT') {
          setDirection('LEFT');
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && direction !== 'UP') {
          setDirection('DOWN');
        } else if (deltaY < 0 && direction !== 'DOWN') {
          setDirection('UP');
        }
      }
    }
  };

  // Multiplayer functions
  const createMultiplayerRoom = () => {
    const newRoomId = `snake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlayer = {
      id: userProfile.id,
      username: userProfile.username,
      college: userProfile.college_name,
      snake: [[10, 10]],
      score: 0,
      isAlive: true,
      color: getRandomSnakeColor(),
      avatar: userProfile.avatar || '🐍'
    };

    setRoomId(newRoomId);
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
    setIsMultiplayer(true);
    setGameMode('multiplayer');
    setWaitingForPlayers(true);

    if (socket) {
      socket.emit('create-snake-room', { roomId: newRoomId, player: newPlayer });
    }

    toast.success('Multiplayer room created! Waiting for players...');
  };

  const joinMultiplayerRoom = (roomIdToJoin) => {
    if (!roomIdToJoin.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    const newPlayer = {
      id: userProfile.id,
      username: userProfile.username,
      college: userProfile.college_name,
      snake: [[10, 10]],
      score: 0,
      isAlive: true,
      color: getRandomSnakeColor(),
      avatar: userProfile.avatar || '🐍'
    };

    setRoomId(roomIdToJoin);
    setCurrentPlayer(newPlayer);
    setIsMultiplayer(true);
    setGameMode('multiplayer');

    if (socket) {
      socket.emit('join-snake-room', { roomId: roomIdToJoin, player: newPlayer });
    }

    toast.success('Joining multiplayer room...');
  };

  const startMultiplayerGame = () => {
    if (players.length < 2) {
      toast.error('Need at least 2 players to start!');
      return;
    }

    setGameStarted(true);
    setWaitingForPlayers(false);
    setScore(0);
    setSnake([[10, 10]]);
    setDirection('RIGHT');
    setGameSpeed(150);
    setLastUpdate(0);
    setTrail([]);
    setDifficulty(1);
    setSpeedMultiplier(1);
    generateFood();

    if (socket) {
      socket.emit('start-snake-game', { roomId });
    }

    toast.success('Multiplayer game started! 🎮');
  };

  const leaveMultiplayerRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-snake-room', { roomId, playerId: userProfile.id });
    }

    setIsMultiplayer(false);
    setRoomId(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setWaitingForPlayers(false);
    setGameMode('single');
    setLeaderboard([]);
    setSpectators([]);
    setChatMessages([]);
    setShowChat(false);

    toast.success('Left multiplayer room');
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !socket || !roomId) return;

    const message = {
      id: Date.now(),
      playerId: userProfile.id,
      username: userProfile.username,
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    socket.emit('snake-chat-message', { roomId, message });
    setNewMessage('');
  };

  // Socket event handlers
  const handlePlayerUpdate = (data) => {
    if (data.roomId === roomId) {
      setPlayers(prev => prev.map(p => 
        p.id === data.player.id ? { ...p, ...data.player } : p
      ));
    }
  };

  const handleFoodUpdate = (data) => {
    if (data.roomId === roomId) {
      setFood(data.food);
    }
  };

  const handleMultiplayerGameOver = (data) => {
    if (data.roomId === roomId) {
      setGameOver(true);
      if (data.winner) {
        toast.success(`🎉 ${data.winner.username} wins with ${data.winner.score} points!`);
      }
    }
  };

  const handlePlayerJoined = (data) => {
    if (data.roomId === roomId) {
      setPlayers(prev => [...prev, data.player]);
      toast.success(`${data.player.username} joined the game!`);
      
      if (players.length >= 1) {
        setWaitingForPlayers(false);
      }
    }
  };

  const handlePlayerLeft = (data) => {
    if (data.roomId === roomId) {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
      toast.info(`${data.username} left the game`);
      
      if (players.length <= 1 && gameStarted) {
        setGameOver(true);
        toast.info('Game ended - not enough players');
      }
    }
  };

  const handleChatMessage = (data) => {
    if (data.roomId === roomId) {
      setChatMessages(prev => [...prev, data.message]);
    }
  };

  const handleLeaderboardUpdate = (data) => {
    if (data.roomId === roomId) {
      setLeaderboard(data.leaderboard);
    }
  };

  const handleSpectatorJoined = (data) => {
    if (data.roomId === roomId) {
      setSpectators(prev => [...prev, data.spectator]);
    }
  };

  const handleSpectatorLeft = (data) => {
    if (data.roomId === roomId) {
      setSpectators(prev => prev.filter(s => s.id !== data.spectatorId));
    }
  };

  const getRandomSnakeColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const moveSnake = () => {
    const newSnake = [...snake];
    const head = [...newSnake[0]];

    switch (direction) {
      case 'UP':
        head[1] -= 1;
        break;
      case 'DOWN':
        head[1] += 1;
        break;
      case 'LEFT':
        head[0] -= 1;
        break;
      case 'RIGHT':
        head[0] += 1;
        break;
      default:
        break;
    }

    // Check wall collision
    if (head[0] < 0 || head[0] >= 20 || head[1] < 0 || head[1] >= 20) {
      handleGameOver();
      return;
    }

    // Check self collision
    if (newSnake.some(segment => segment[0] === head[0] && segment[1] === head[1])) {
      handleGameOver();
      return;
    }

    // Check collision with other players in multiplayer
    if (isMultiplayer) {
      const otherPlayers = players.filter(p => p.id !== currentPlayer.id && p.isAlive);
      for (const player of otherPlayers) {
        if (player.snake.some(segment => segment[0] === head[0] && segment[1] === head[1])) {
          handleGameOver();
          return;
        }
      }
    }

    // Add current head to trail before moving
    if (newSnake.length > 0) {
      setTrail(prev => [...prev, [...newSnake[0]]]);
    }

    newSnake.unshift(head);

    // Check food collision
    if (head[0] === food[0] && head[1] === food[1]) {
      setScore(prevScore => prevScore + 10);
      generateFood();
      
      // Update current player in multiplayer
      if (isMultiplayer && currentPlayer) {
        const updatedPlayer = { ...currentPlayer, snake: newSnake, score: score + 10 };
        setCurrentPlayer(updatedPlayer);
        
        if (socket) {
          socket.emit('snake-player-update', { roomId, player: updatedPlayer });
        }
      }
      
      // Difficulty progression system
      const newScore = score + 10;
      const newDifficulty = Math.floor(newScore / 50) + 1;
      
      if (newDifficulty > difficulty) {
        setDifficulty(newDifficulty);
        setSpeedMultiplier(prev => Math.min(prev + 0.1, 2.0));
        toast.success(`Level ${newDifficulty}! Speed increased!`);
      }
      
      const baseSpeed = 150;
      const difficultySpeed = baseSpeed - (newDifficulty - 1) * 10;
      const scoreSpeed = Math.max(80, difficultySpeed - Math.floor(newScore / 20) * 2);
      setGameSpeed(scoreSpeed);
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const handleGameOver = () => {
    setGameOver(true);
    
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }

    // Update player status in multiplayer
    if (isMultiplayer && currentPlayer) {
      const updatedPlayer = { ...currentPlayer, isAlive: false, finalScore: score };
      setCurrentPlayer(updatedPlayer);
      
      if (socket) {
        socket.emit('snake-player-update', { roomId, player: updatedPlayer });
      }
    }
  };

  const generateFood = () => {
    let newFood;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      newFood = [
      Math.floor(Math.random() * 20),
      Math.floor(Math.random() * 20)
    ];
      attempts++;
    } while (
      (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]) ||
       (isMultiplayer && players.some(p => p.snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])))) &&
      attempts < maxAttempts
    );
    
    setFood(newFood);

    // Update food for all players in multiplayer
    if (isMultiplayer && socket) {
      socket.emit('snake-food-update', { roomId, food: newFood });
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSnake([[10, 10]]);
    setDirection('RIGHT');
    setGameSpeed(150);
    setLastUpdate(0);
    setTrail([]);
    setDifficulty(1);
    setSpeedMultiplier(1);
    generateFood();
  };

  const resetGame = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    setGameStarted(false);
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSnake([[10, 10]]);
    setDirection('RIGHT');
    setFood([15, 15]);
    setGameSpeed(150);
    setLastUpdate(0);
    setTrail([]);
    setDifficulty(1);
    setSpeedMultiplier(1);
  };

  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const renderBoard = () => {
    const board = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const snakeIndex = snake.findIndex(segment => segment[0] === x && segment[1] === y);
        const isSnake = snakeIndex !== -1;
        const isFood = food[0] === x && food[1] === y;
        const isHead = snakeIndex === 0;
        const isTail = snakeIndex === snake.length - 1;
        const trailIndex = trail.findIndex(pos => pos[0] === x && pos[1] === y);
        const isTrail = trailIndex !== -1;
        
        // Check if other players are on this position
        let otherPlayerSnake = null;
        if (isMultiplayer) {
          otherPlayerSnake = players.find(p => 
            p.id !== currentPlayer?.id && 
            p.isAlive && 
            p.snake.some(segment => segment[0] === x && segment[1] === y)
          );
        }
        
        board.push(
          <div
            key={`${x}-${y}`}
            className={`snake-cell ${isSnake ? 'snake' : ''} ${isHead ? 'snake-head' : ''} ${isTail ? 'snake-tail' : ''} ${isFood ? 'food' : ''} ${isTrail ? 'trail' : ''} ${otherPlayerSnake ? 'other-player' : ''}`}
            style={{
              '--snake-index': snakeIndex,
              '--snake-length': snake.length,
              '--trail-index': trailIndex,
              '--other-player-color': otherPlayerSnake?.color
            }}
          />
        );
      }
    }
    return board;
  };

  const renderMobileControls = () => {
    if (!isMobile) return null;

    return (
      <div className="mobile-controls">
        <div className="control-row">
          <button 
            className="control-btn up-btn"
            onClick={() => direction !== 'DOWN' && setDirection('UP')}
            disabled={!gameStarted || gameOver || isPaused}
          >
            ↑
          </button>
        </div>
        <div className="control-row">
          <button 
            className="control-btn left-btn"
            onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
            disabled={!gameStarted || gameOver || isPaused}
          >
            ←
          </button>
          <button 
            className="control-btn right-btn"
            onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
            disabled={!gameStarted || gameOver || isPaused}
          >
            →
          </button>
        </div>
        <div className="control-row">
          <button 
            className="control-btn down-btn"
            onClick={() => direction !== 'UP' && setDirection('DOWN')}
            disabled={!gameStarted || gameOver || isPaused}
          >
            ↓
          </button>
        </div>
      </div>
    );
  };

  const renderMultiplayerLobby = () => {
    if (!isMultiplayer) return null;

    return (
      <div className="multiplayer-lobby">
        <div className="lobby-header">
          <h3>🎮 Multiplayer Snake Game</h3>
          <p>Room ID: <span className="room-id">{roomId}</span></p>
          <p>Players: {players.length}/8</p>
        </div>

        <div className="players-list">
          <h4>Players in Room:</h4>
          {players.map((player, index) => (
            <div key={player.id} className={`player-item ${player.id === currentPlayer?.id ? 'current-player' : ''}`}>
              <div className="player-avatar" style={{ backgroundColor: player.color }}>
                {player.avatar}
              </div>
              <div className="player-info">
                <span className="player-name">{player.username}</span>
                <span className="player-college">{player.college}</span>
              </div>
              <div className="player-status">
                {player.id === currentPlayer?.id ? 'You' : 'Player'}
              </div>
            </div>
          ))}
        </div>

        {spectators.length > 0 && (
          <div className="spectators-list">
            <h4>Spectators ({spectators.length}):</h4>
            {spectators.map(spectator => (
              <div key={spectator.id} className="spectator-item">
                <span>{spectator.username}</span>
              </div>
            ))}
          </div>
        )}

        <div className="lobby-actions">
          {waitingForPlayers ? (
            <button 
              className="start-btn"
              onClick={startMultiplayerGame}
              disabled={players.length < 2}
            >
              Start Game ({players.length}/2)
            </button>
          ) : (
            <button className="waiting-btn" disabled>
              Waiting for host to start...
            </button>
          )}
          
          <button className="leave-btn" onClick={leaveMultiplayerRoom}>
            Leave Room
          </button>
        </div>

        <div className="chat-section">
          <div className="chat-header" onClick={() => setShowChat(!showChat)}>
            <span>💬 Chat ({chatMessages.length})</span>
            <span className="chat-toggle">{showChat ? '▼' : '▲'}</span>
          </div>
          
          {showChat && (
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`chat-message ${msg.playerId === userProfile.id ? 'own-message' : ''}`}>
                    <span className="message-username">{msg.username}:</span>
                    <span className="message-text">{msg.message}</span>
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button onClick={sendChatMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGameModeSelection = () => {
    if (isMultiplayer) return null;

    return (
      <div className="game-mode-selection">
        <h3>🐍 Snake Game</h3>
        <p>Choose your game mode:</p>
        
        <div className="mode-buttons">
          <button 
            className="mode-btn single-player"
            onClick={() => setGameMode('single')}
          >
            <span className="mode-icon">👤</span>
            <span className="mode-title">Single Player</span>
            <span className="mode-desc">Classic snake game</span>
          </button>
          
          <button 
            className="mode-btn multiplayer"
            onClick={() => setGameMode('multiplayer')}
          >
            <span className="mode-icon">👥</span>
            <span className="mode-title">Multiplayer</span>
            <span className="mode-desc">Play with friends</span>
          </button>
          
          <button 
            className="mode-btn battle-royale"
            onClick={() => setGameMode('battle')}
          >
            <span className="mode-icon">⚔️</span>
            <span className="mode-title">Battle Royale</span>
            <span className="mode-desc">Last snake standing</span>
          </button>
        </div>

        {gameMode === 'multiplayer' && (
          <div className="multiplayer-options">
            <div className="option-group">
              <button className="create-room-btn" onClick={createMultiplayerRoom}>
                🏠 Create Room
              </button>
              <p>Create a new multiplayer room</p>
            </div>
            
            <div className="option-group">
              <div className="join-room-input">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId || ''}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={() => joinMultiplayerRoom(roomId)}>
                  🚪 Join Room
                </button>
              </div>
              <p>Join an existing room</p>
            </div>
          </div>
        )}

        {gameMode === 'single' && (
          <div className="single-player-options">
            <button className="start-btn" onClick={startGame}>
              Start Single Player Game
            </button>
            <p className="high-score">High Score: {highScore}</p>
          </div>
        )}
      </div>
    );
  };

  const renderLeaderboard = () => {
    if (!isMultiplayer || !leaderboard.length) return null;

    return (
      <div className="leaderboard">
        <h4>🏆 Leaderboard</h4>
        <div className="leaderboard-list">
          {leaderboard.slice(0, 5).map((player, index) => (
            <div key={player.id} className={`leaderboard-item ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`}>
              <span className="rank">{index + 1}</span>
              <span className="player-name">{player.username}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Main render logic
  if (isMultiplayer && !gameStarted) {
    return (
      <div className="game-board snake-board">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>← Back to Games</button>
          <h2>{gameType.name} - Multiplayer</h2>
        </div>
        {renderMultiplayerLobby()}
      </div>
    );
  }

  if (!gameStarted && !isMultiplayer) {
  return (
    <div className="game-board snake-board">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>← Back to Games</button>
        <h2>{gameType.name}</h2>
        </div>
        {renderGameModeSelection()}
      </div>
    );
  }

  return (
    <div className="game-board snake-board">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>← Back to Games</button>
        <h2>{gameType.name} {isMultiplayer ? '- Multiplayer' : ''}</h2>
        <div className="game-info">
          <span>Score: {score}</span>
          <span>High Score: {highScore}</span>
          <span>Level: {difficulty}</span>
          <span>Speed: {Math.round(1000 / gameSpeed)} FPS</span>
          {isPaused && <span className="paused-indicator">PAUSED</span>}
          {isMultiplayer && <span>Players: {players.filter(p => p.isAlive).length}</span>}
        </div>
      </div>

      <div className="snake-container">
        {gameOver ? (
          <div className="snake-gameover">
            <h3>Game Over!</h3>
            <p>Final Score: {score}</p>
            <p>Snake Length: {snake.length}</p>
            {score === highScore && <p className="new-record">🎉 New High Score! 🎉</p>}
            
            {isMultiplayer && (
              <div className="multiplayer-results">
                <h4>Game Results:</h4>
                {players
                  .sort((a, b) => (b.finalScore || b.score) - (a.finalScore || a.score))
                  .map((player, index) => (
                    <div key={player.id} className={`result-item ${index === 0 ? 'winner' : ''}`}>
                      <span className="rank">{index + 1}</span>
                      <span className="player-name">{player.username}</span>
                      <span className="final-score">{player.finalScore || player.score}</span>
                    </div>
                  ))}
              </div>
            )}
            
            <div className="game-over-actions">
            <button className="reset-btn" onClick={resetGame}>
              Play Again
            </button>
              {isMultiplayer && (
                <button className="leave-btn" onClick={leaveMultiplayerRoom}>
                  Leave Room
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="snake-game">
            <div className="game-layout">
              <div className="game-main">
                <div 
                  className="snake-board-grid"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
              {renderBoard()}
            </div>
                
                {renderMobileControls()}
                
            <div className="snake-controls">
                  <p>Use arrow keys to move • SPACE/P to pause</p>
                  {isMobile && <p className="mobile-controls-hint">Or swipe on the game board!</p>}
                  <div className="control-buttons">
                    <button className="pause-btn" onClick={togglePause}>
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
              <button className="reset-btn" onClick={resetGame}>
                Reset Game
              </button>
                  </div>
                </div>
              </div>

              {isMultiplayer && (
                <div className="game-sidebar">
                  {renderLeaderboard()}
                  
                  <div className="active-players">
                    <h4>🎯 Active Players</h4>
                    {players.filter(p => p.isAlive).map(player => (
                      <div key={player.id} className={`active-player ${player.id === currentPlayer?.id ? 'current' : ''}`}>
                        <div className="player-indicator" style={{ backgroundColor: player.color }}></div>
                        <span className="player-name">{player.username}</span>
                        <span className="player-score">{player.score}</span>
                      </div>
                    ))}
                  </div>

                  <div className="spectators-section">
                    <h4>👀 Spectators ({spectators.length})</h4>
                    {spectators.map(spectator => (
                      <div key={spectator.id} className="spectator-item">
                        <span>{spectator.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
