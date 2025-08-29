import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDice, FaPlay, FaRedo, FaHome, FaFlag, FaCrown } from 'react-icons/fa';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './LudoGameBoard.css';

const LudoGameBoard = ({ gameRoom, currentPlayer, onGameAction }) => {
  // Game constants
  const PLAYER_COLORS = useMemo(() => ['#FF5252', '#4CAF50', '#2196F3', '#FFC107'], []);
  const PLAYER_NAMES = ['Red', 'Green', 'Blue', 'Yellow'];
  const START_POSITIONS = useMemo(() => [0, 13, 26, 39], []);
  // const FINISH_PATHS = {
  //   0: [52, 53, 54, 55, 56],
  //   1: [57, 58, 59, 60, 61],
  //   2: [62, 63, 64, 65, 66],
  //   3: [67, 68, 69, 70, 71]
  // };

  // Initialize game board
  const initializeBoard = useCallback(() => {
    const board = [];
    
    // Create main path positions (0-51)
    for (let i = 0; i < 52; i++) {
      board[i] = {
        position: i,
        pieces: [],
        isSafe: [0, 8, 13, 21, 26, 34, 39, 47].includes(i),
        type: 'path'
      };
    }
    
    // Create finish path positions (52-71)
    for (let i = 52; i < 72; i++) {
      board[i] = {
        position: i,
        pieces: [],
        isSafe: true,
        type: 'finish'
      };
    }
    
    return board;
  }, []);

  // Initialize player pieces
  const initializePieces = useCallback(() => {
    const pieces = [];
    
    for (let player = 0; player < 4; player++) {
      for (let piece = 0; piece < 4; piece++) {
        pieces.push({
          id: `player-${player}-piece-${piece}`,
          player: player,
          pieceNumber: piece,
          color: PLAYER_COLORS[player],
          position: 'home',
          homePosition: piece,
          pathPosition: -1,
          isHome: true,
          isFinished: false,
          moves: 0
        });
      }
    }
    return pieces;
  }, [PLAYER_COLORS]);

  const [board, setBoard] = useState(initializeBoard());
  const [diceValue, setDiceValue] = useState(0);
  // const [selectedPiece, setSelectedPiece] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [currentTurn, setCurrentTurn] = useState(0);
  const [pieces, setPieces] = useState(initializePieces());
  const [diceRolling, setDiceRolling] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  const [winner, setWinner] = useState(null);
  const { socket } = useSocket();
  const { userProfile } = useAuth();

  // Update board with current pieces
  const updateBoard = useCallback((currentPieces) => {
    const newBoard = initializeBoard();
    
    // Place pieces on board
    currentPieces.forEach(piece => {
      if (piece.position === 'path' && piece.pathPosition >= 0) {
        newBoard[piece.pathPosition].pieces.push(piece);
      } else if (piece.position === 'finish' && piece.pathPosition >= 52) {
        newBoard[piece.pathPosition].pieces.push(piece);
      }
    });
    
    setBoard(newBoard);
  }, [initializeBoard]);

  // Check if a piece can move
  const canMovePiece = useCallback((piece, diceVal) => {
    if (piece.isFinished) return false;
    
    // Can only move out of home with a 6
    if (piece.isHome) {
      return diceVal === 6;
    }
    
    // Check if piece can enter finish path
    if (piece.position === 'path') {
      const currentPos = piece.pathPosition;
      const playerId = piece.player;
      const startPos = START_POSITIONS[playerId];
      
      // Calculate distance from start
      let distanceFromStart = 0;
      if (currentPos >= startPos) {
        distanceFromStart = currentPos - startPos;
      } else {
        distanceFromStart = 52 - startPos + currentPos;
      }
      
      const newDistance = distanceFromStart + diceVal;
      
      // Check if piece can enter finish path
      if (newDistance > 50) {
        const finishPathPos = newDistance - 51;
        return finishPathPos <= 5; // Finish path has 6 cells (0-5)
      }
      
      return true;
    }
    
    // Moving in finish path
    if (piece.position === 'finish') {
      const currentFinishPos = piece.pathPosition - 52 - (piece.player * 5);
      return currentFinishPos + diceVal <= 5;
    }
    
    return false;
  }, [START_POSITIONS]);

  // Calculate new position for a piece - Currently unused
  // const calculateNewPosition = useCallback((piece, diceVal) => {
  //   if (piece.isHome && diceVal === 6) {
  //     return {
  //       position: 'path',
  //       pathPosition: START_POSITIONS[piece.player],
  //       isHome: false
  //     };
  //   }
  //   
  //   if (piece.position === 'path') {
  //     const currentPos = piece.pathPosition;
  //     const playerId = piece.player;
  //     const startPos = START_POSITIONS[playerId];
  //   
  //     // Calculate distance from start
  //     let distanceFromStart = 0;
  //     if (currentPos >= startPos) {
  //       distanceFromStart = currentPos - startPos;
  //     } else {
  //       distanceFromStart = 52 - startPos + currentPos;
  //     }
  //   
  //     const newDistance = distanceFromStart + diceVal;
  //   
  //     // Check if piece can enter finish path
  //     if (newDistance > 50) {
  //       const finishPathPos = newDistance - 51;
  //       if (finishPathPos <= 5) {
  //         return {
  //           position: 'finish',
  //           pathPosition: 52 + (playerId * 5) + finishPathPos - 1,
  //           isHome: false
  //         };
  //       }
  //     }
  //   
  //     // Regular move on main path
  //     const newPos = (currentPos + diceVal) % 52;
  //     return {
  //       position: 'path',
  //       pathPosition: newPos,
  //       isHome: false
  //     };
  //   }
  //   
  //   if (piece.position === 'finish') {
  //     const currentFinishPos = piece.pathPosition - 52 - (piece.player * 5);
  //     const newFinishPos = currentFinishPos + diceVal;
  //   
  //     if (newFinishPos === 5) {
  //       return {
  //         position: 'finished',
  //         pathPosition: -1,
  //         isFinished: true,
  //         isHome: false
  //       };
  //     }
  //   
  //     if (newFinishPos < 5) {
  //       return {
  //         position: 'finish',
  //         pathPosition: 52 + (piece.player * 5) + newFinishPos,
  //         isHome: false
  //         };
  //     }
  //   }
  //   
  //   return null;
  // }, [START_POSITIONS]);

  // Check for captures - Currently unused
  // const checkCapture = useCallback((newPosition, movingPiece, currentPieces) => {
  //   if (newPosition < 52 && !board[newPosition].isSafe) {
  //     const capturedPieces = currentPieces.filter(p => 
  //       p.pathPosition === newPosition && 
  //       p.player !== movingPiece.player &&
  //       p.position === 'path'
  //     );
  //   
  //     if (capturedPieces.length > 0) {
  //       // Send captured pieces back home
  //       return currentPieces.map(piece => {
  //         if (capturedPieces.some(cp => cp.id === piece.id)) {
  //           return {
  //             ...piece,
  //             position: 'home',
  //             pathPosition: -1,
  //             isHome: true
  //           };
  //         }
  //         return piece;
  //       });
  //     }
  //   }
  //   
  //   return currentPieces;
  // }, [board]);

  // Socket event handlers
  const handleDiceRolled = useCallback((data) => {
    setDiceValue(data.diceValue);
    setDiceRolling(false);
    
    if (data.room?.gameData?.pieces) {
      setPieces(data.room.gameData.pieces);
      updateBoard(data.room.gameData.pieces);
    }
    
    if (data.room?.gameData?.gameHistory) {
      setGameHistory(data.room.gameData.gameHistory);
    }
    
    // Calculate valid moves
    if (data.room?.gameData?.pieces && data.currentPlayerId === userProfile?.id) {
      const playerPieces = data.room.gameData.pieces.filter(p => p.player === data.currentTurn);
      const validPieces = playerPieces.filter(piece => canMovePiece(piece, data.diceValue));
      setValidMoves(validPieces.map(p => p.id));
    }
  }, [canMovePiece, updateBoard, userProfile]);

  const handleTurnUpdate = useCallback((data) => {
    setCurrentTurn(data.currentTurn);
    
    if (data.room?.gameData?.pieces) {
      setPieces(data.room.gameData.pieces);
      updateBoard(data.room.gameData.pieces);
    }
    
    if (data.room?.gameData?.gameHistory) {
      setGameHistory(data.room.gameData.gameHistory);
    }
    
    // Check if it's my turn
    if (gameRoom?.players && Array.isArray(gameRoom.players)) {
      const myPlayerIndex = gameRoom.players.findIndex(p => p.userId === userProfile?.id);
      setIsMyTurn(myPlayerIndex === data.currentTurn);
    } else {
      setIsMyTurn(false);
    }
    
    // Reset dice value and valid moves for new turn
    setDiceValue(0);
    setValidMoves([]);
  }, [gameRoom, updateBoard, userProfile]);

  const handleGameEnd = useCallback((data) => {
    setGameState('finished');
    setWinner(data.winnerId);
    toast.success(`🎉 ${data.winnerName} wins the game! 🎉`);
    
    if (data.room?.gameData?.pieces) {
      setPieces(data.room.gameData.pieces);
      updateBoard(data.room.gameData.pieces);
    }
    
    if (data.room?.gameData?.gameHistory) {
      setGameHistory(data.room.gameData.gameHistory);
    }
  }, [updateBoard]);

  const handleGameUpdate = useCallback((data) => {
    if (data.room?.gameData?.pieces) {
      setPieces(data.room.gameData.pieces);
      updateBoard(data.room.gameData.pieces);
    }
    
    if (data.room?.gameData?.gameHistory) {
      setGameHistory(data.room.gameData.gameHistory);
    }
    
    if (data.room?.gameData?.gameState) {
      setGameState(data.room.gameData.gameState);
    }
  }, [updateBoard]);

  // Set up socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('diceRolled', handleDiceRolled);
      socket.on('turnUpdate', handleTurnUpdate);
      socket.on('gameEnd', handleGameEnd);
      socket.on('gameUpdate', handleGameUpdate);
    }

    return () => {
      if (socket) {
        socket.off('diceRolled');
        socket.off('turnUpdate');
        socket.off('gameEnd');
        socket.off('gameUpdate');
      }
    };
  }, [socket, handleDiceRolled, handleTurnUpdate, handleGameEnd, handleGameUpdate]);

  // Initialize game from room data
  useEffect(() => {
    if (gameRoom) {
      setGameState(gameRoom.gameData?.gameState || 'waiting');
      setCurrentTurn(gameRoom.gameData?.currentTurn || 0);
      if (gameRoom.gameData?.pieces) {
        setPieces(gameRoom.gameData.pieces);
        updateBoard(gameRoom.gameData.pieces);
      }
      if (gameRoom.gameData?.gameHistory) {
        setGameHistory(gameRoom.gameData.gameHistory);
      }
      
      // Check if it's my turn
      if (gameRoom.players && Array.isArray(gameRoom.players)) {
        const myPlayerIndex = gameRoom.players.findIndex(p => p.userId === userProfile?.id);
        setIsMyTurn(myPlayerIndex === gameRoom.gameData?.currentTurn);
      } else {
        setIsMyTurn(false);
      }
    }
  }, [gameRoom, userProfile, updateBoard]);

  // Roll dice handler
  const rollDice = () => {
    if (diceRolling || gameState !== 'playing' || !isMyTurn) return;
    
    setDiceRolling(true);
    
    // Emit dice roll to backend
    if (onGameAction) {
      onGameAction('rollDice', { roomId: gameRoom?.id });
    }
    
    // Simulate dice rolling animation
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);
    
    setTimeout(() => {
      clearInterval(rollInterval);
    }, 1000);
  };

  // Select and move piece
  const selectPiece = (piece) => {
    if (gameState !== 'playing' || !isMyTurn || diceValue === 0) return;
    
    if (validMoves.includes(piece.id) && canMovePiece(piece, diceValue)) {
      // setSelectedPiece(piece);
      movePiece(piece, diceValue);
    } else {
      toast.error('This piece cannot move with the current dice value.');
    }
  };

  // Move piece handler
  const movePiece = (piece, diceVal) => {
    // Emit move to backend
    if (onGameAction) {
      onGameAction('movePiece', { 
        roomId: gameRoom?.id,
        pieceId: piece.id, 
        diceValue: diceVal 
      });
    }
    
    // Reset selection
    // setSelectedPiece(null);
  };

  // Reset game
  const resetGame = () => {
    if (onGameAction) {
      onGameAction('resetGame', { roomId: gameRoom?.id });
    }
  };

  // Render a game piece
  const renderPiece = (piece, index) => {
    if (piece.isHome) {
      return (
        <motion.div
          key={piece.id}
          className={`home-piece ${validMoves.includes(piece.id) ? 'can-move' : ''}`}
          style={{ backgroundColor: piece.color }}
          onClick={() => selectPiece(piece)}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            y: 0
          }}
          whileHover={{ 
            scale: validMoves.includes(piece.id) ? 1.15 : 1.05,
            y: -5,
            zIndex: 10
          }}
          whileTap={{ scale: validMoves.includes(piece.id) ? 0.9 : 1 }}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          {index + 1}
        </motion.div>
      );
    }
    
    if (piece.isFinished) {
      return (
        <motion.div
          key={piece.id}
          className="finished-piece"
          style={{ backgroundColor: piece.color }}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: 1, 
            rotate: 360,
            y: 0
          }}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          <FaFlag />
        </motion.div>
      );
    }
    
    return null;
  };

  // Render a piece on the path
  const renderPathPiece = (piece) => (
    <motion.div
      key={piece.id}
      className={`path-piece ${validMoves.includes(piece.id) ? 'can-move' : ''}`}
      style={{ backgroundColor: piece.color }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: 0,
        y: 0
      }}
      whileHover={{ 
        scale: validMoves.includes(piece.id) ? 1.2 : 1.05,
        zIndex: 10
      }}
      whileTap={{ scale: validMoves.includes(piece.id) ? 0.9 : 1 }}
      onClick={() => selectPiece(piece)}
      layout
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        duration: 0.3
      }}
    >
      {piece.pieceNumber + 1}
    </motion.div>
  );

  // Render the dice
  const renderDice = () => (
    <div className="dice-container">
      <motion.div
        className={`dice ${diceRolling ? 'rolling' : ''}`}
        animate={diceRolling ? { rotate: [0, 360] } : {}}
        transition={{ duration: 0.5, repeat: diceRolling ? Infinity : 0 }}
      >
        <div className="dice-inner">
          {renderDiceDots(diceValue)}
        </div>
      </motion.div>
      
      <button
        className={`roll-dice-btn ${diceRolling || gameState !== 'playing' || !isMyTurn ? 'disabled' : ''}`}
        onClick={rollDice}
        disabled={diceRolling || gameState !== 'playing' || !isMyTurn}
      >
        <FaDice />
        {diceRolling ? ' Rolling...' : isMyTurn ? ' Roll Dice' : ' Wait for your turn'}
      </button>
    </div>
  );

  // Render dice dots based on value
  const renderDiceDots = (value) => {
    const dots = [];
    const positions = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const isActive = positions[value]?.some(([r, c]) => r === row && c === col);
        dots.push(
          <div
            key={`${row}-${col}`}
            className={`dice-dot ${isActive ? 'active' : ''}`}
          />
        );
      }
    }
    
    return dots;
  };

  // Render player info panel
  const renderPlayerInfo = (playerId) => {
    const playerPieces = pieces.filter(p => p.player === playerId);
    const finishedPieces = playerPieces.filter(p => p.isFinished).length;
    const isCurrentTurn = playerId === currentTurn;
    const playerName = gameRoom?.players[playerId]?.username || PLAYER_NAMES[playerId];
    
    return (
      <div className={`player-info ${isCurrentTurn ? 'current-turn' : ''}`}>
        <div className="player-header">
          <div 
            className="player-color-indicator"
            style={{ backgroundColor: PLAYER_COLORS[playerId] }}
          />
          <h4>{playerName}</h4>
          {isCurrentTurn && <FaPlay className="turn-indicator" />}
          {winner === playerId && <FaCrown className="winner-crown" />}
        </div>
        
        <div className="player-pieces">
          {playerPieces.map((piece, index) => renderPiece(piece, index))}
        </div>
        
        <div className="player-progress">
          <span>{finishedPieces}/4 finished</span>
        </div>
      </div>
    );
  };

  // Loading state
  if (!gameRoom || !gameRoom.players) {
    return (
      <div className="ludo-game-board">
        <div className="game-header">
          <h2>🎮 Ludo Battle</h2>
          <div className="game-status">
            <span className="status-badge waiting">Loading...</span>
          </div>
        </div>
        <div className="loading-message">
          <p>Loading game room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ludo-game-board">
      <div className="game-header">
        <h2>🎮 Ludo Battle</h2>
        <div className="game-status">
          <span className={`status-badge ${gameState}`}>
            {gameState === 'waiting' ? 'Waiting' : 
             gameState === 'playing' ? 'Playing' : 
             gameState === 'finished' ? 'Finished' : 'Unknown'}
          </span>
          {gameState === 'playing' && (
            <span className="current-player">
              Current Turn: {gameRoom.players[currentTurn]?.username || PLAYER_NAMES[currentTurn]}
              {isMyTurn && ' (Your Turn!)'}
            </span>
          )}
          {gameState === 'finished' && winner !== null && (
            <span className="winner-announcement">
              Winner: {gameRoom.players[winner]?.username || PLAYER_NAMES[winner]}
            </span>
          )}
        </div>
      </div>

      <div className="game-layout">
        {/* Left Sidebar - Player 0 & 1 */}
        <div className="players-sidebar left">
          {renderPlayerInfo(0)}
          {renderPlayerInfo(1)}
        </div>

        {/* Center - Game Board */}
        <div className="game-center">
          <div className="ludo-board">
            {/* Home Areas */}
            <div className="home-areas">
              <div className="home-area player-0">
                {pieces.filter(p => p.player === 0 && p.isHome).map((piece, index) => 
                  renderPiece(piece, index)
                )}
              </div>
              <div className="home-area player-1">
                {pieces.filter(p => p.player === 1 && p.isHome).map((piece, index) => 
                  renderPiece(piece, index)
                )}
              </div>
              <div className="home-area player-2">
                {pieces.filter(p => p.player === 2 && p.isHome).map((piece, index) => 
                  renderPiece(piece, index)
                )}
              </div>
              <div className="home-area player-3">
                {pieces.filter(p => p.player === 3 && p.isHome).map((piece, index) => 
                  renderPiece(piece, index)
                )}
              </div>
            </div>

            {/* Center Logo */}
            <div className="board-center">
              <FaHome className="center-logo" />
            </div>

            {/* Game Path */}
            <div className="game-path">
              {/* Render all path positions */}
              {Array.from({ length: 72 }, (_, index) => {
                const cell = board[index];
                const position = getPathPosition(index);
                
                return (
                  <motion.div
                    key={index}
                    className={`path-cell ${cell.isSafe ? 'safe' : ''} ${cell.type}`}
                    style={{
                      left: position.x,
                      top: position.y
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                  >
                    {cell.pieces.map(piece => renderPathPiece(piece))}
                  </motion.div>
                );
              })}
            </div>

            {/* Player Start Areas */}
            <div className="player-starts">
              <div className="start-area player-0"></div>
              <div className="start-area player-1"></div>
              <div className="start-area player-2"></div>
              <div className="start-area player-3"></div>
            </div>

            {/* Player Finish Areas */}
            <div className="player-finishes">
              <div className="finish-area player-0">
                {pieces.filter(p => p.player === 0 && p.position === 'finish').map(piece => (
                  <motion.div
                    key={piece.id}
                    className="finish-path-piece"
                    style={{ backgroundColor: piece.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {piece.pieceNumber + 1}
                  </motion.div>
                ))}
              </div>
              <div className="finish-area player-1">
                {pieces.filter(p => p.player === 1 && p.position === 'finish').map(piece => (
                  <motion.div
                    key={piece.id}
                    className="finish-path-piece"
                    style={{ backgroundColor: piece.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {piece.pieceNumber + 1}
                  </motion.div>
                ))}
              </div>
              <div className="finish-area player-2">
                {pieces.filter(p => p.player === 2 && p.position === 'finish').map(piece => (
                  <motion.div
                    key={piece.id}
                    className="finish-path-piece"
                    style={{ backgroundColor: piece.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {piece.pieceNumber + 1}
                  </motion.div>
                ))}
              </div>
              <div className="finish-area player-3">
                {pieces.filter(p => p.player === 3 && p.position === 'finish').map(piece => (
                  <motion.div
                    key={piece.id}
                    className="finish-path-piece"
                    style={{ backgroundColor: piece.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {piece.pieceNumber + 1}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Decorative Board Elements */}
            <div className="board-decoration">
              <div className="corner-decoration top-left"></div>
              <div className="corner-decoration top-right"></div>
              <div className="corner-decoration bottom-left"></div>
              <div className="corner-decoration bottom-right"></div>
              
              <div className="path-border top"></div>
              <div className="path-border right"></div>
              <div className="path-border bottom"></div>
              <div className="path-border left"></div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="game-controls">
            {renderDice()}
            
            <div className="game-actions">
              <button className="reset-btn" onClick={resetGame}>
                <FaRedo /> Reset Game
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Player 2 & 3 */}
        <div className="players-sidebar right">
          {renderPlayerInfo(2)}
          {renderPlayerInfo(3)}
        </div>
      </div>

      {/* Game History */}
      <div className="game-history">
        <h3>Game History</h3>
        <div className="history-list">
          <AnimatePresence>
            {gameHistory.slice(-10).reverse().map((entry, index) => (
              <motion.div
                key={`${entry.timestamp}-${index}`}
                className="history-entry"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <span className="timestamp">{entry.timestamp}</span>
                <span className="message">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Calculate path positions for the Ludo board
function getPathPosition(index) {
  const boardSize = 500;
  const cellSize = 16;
  const centerX = boardSize / 2;
  const centerY = boardSize / 2;
  
  // Main path coordinates (0-51)
  if (index < 52) {
    const pathCoordinates = [
      // Top row (0-5)
      ...Array.from({ length: 6 }, (_, i) => ({ 
        x: centerX - 60 + i * cellSize, 
        y: centerY - 120 
      })),
      
      // Right column (6-18)
      ...Array.from({ length: 13 }, (_, i) => ({ 
        x: centerX + 120, 
        y: centerY - 120 + i * cellSize 
      })),
      
      // Bottom row (19-31)
      ...Array.from({ length: 13 }, (_, i) => ({ 
        x: centerX + 120 - i * cellSize, 
        y: centerY + 120 
      })),
      
      // Left column (32-44)
      ...Array.from({ length: 13 }, (_, i) => ({ 
        x: centerX - 120, 
        y: centerY + 120 - i * cellSize 
      })),
      
      // Top row continuation (45-51)
      ...Array.from({ length: 7 }, (_, i) => ({ 
        x: centerX - 120 + i * cellSize, 
        y: centerY - 120 
      }))
    ];
    
    return pathCoordinates[index] || { x: 0, y: 0 };
  }
  
  // Finish paths (52-71)
  if (index >= 52 && index < 72) {
    const playerId = Math.floor((index - 52) / 5);
    const finishIndex = (index - 52) % 5;
    
    const finishPositions = {
      0: Array.from({ length: 5 }, (_, i) => ({ x: centerX - 30 + i * cellSize, y: centerY - 90 })),
      1: Array.from({ length: 5 }, (_, i) => ({ x: centerX + 90, y: centerY - 30 + i * cellSize })),
      2: Array.from({ length: 5 }, (_, i) => ({ x: centerX - 30 + i * cellSize, y: centerY + 90 })),
      3: Array.from({ length: 5 }, (_, i) => ({ x: centerX - 90, y: centerY - 30 + i * cellSize }))
    };
    
    return finishPositions[playerId][finishIndex] || { x: 0, y: 0 };
  }
  
  return { x: 0, y: 0 };
}

export default LudoGameBoard;