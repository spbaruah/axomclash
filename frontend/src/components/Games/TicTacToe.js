import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { FaRobot, FaUser, FaPlay, FaArrowLeft, FaRedo, FaCrown, FaHandshake } from 'react-icons/fa';
import './TicTacToe.css';

const TicTacToe = ({ gameType, onBack }) => {
  const [gameMode, setGameMode] = useState(null); // 'solo' or 'online'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' or 'hard'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting', 'playing', 'finished'
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [mySymbol, setMySymbol] = useState(null); // Track which symbol (X or O) I am
  const [opponentSymbol, setOpponentSymbol] = useState(null); // Track opponent's symbol

  const { socket } = useSocket();
  const { userProfile } = useAuth();

  // Game winning combinations
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  // Calculate winner
  const calculateWinner = useCallback((squares) => {
    for (let i = 0; i < winningCombinations.length; i++) {
      const [a, b, c] = winningCombinations[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }, []);

  // Check if board is full (draw)
  const isBoardFull = useCallback((squares) => {
    return squares.every(square => square !== null);
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((index) => {
    // Additional validation on client side to prevent unnecessary requests
    if (board[index] || winner || gameStatus !== 'playing') return;
    if (gameMode === 'online' && !isMyTurn) {
      alert("It's not your turn!");
      return;
    }

    const playerSymbol = gameMode === 'online' ? mySymbol : currentPlayer;
    
    if (gameMode === 'solo') {
      // Solo mode logic remains the same
      socket.emit('solo-tictactoe-move', {
        roomId,
        position: index,
        player: currentPlayer
      });
    } else if (gameMode === 'online') {
      // Online mode - send move to server for validation
      socket.emit('tictactoe-move', {
        roomId,
        position: index,
        player: playerSymbol
      });
    }
  }, [board, winner, gameStatus, currentPlayer, gameMode, isMyTurn, socket, roomId, mySymbol]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameStatus('playing');
    setShowGameOver(false);
    setIsMyTurn(true);
    
    // For online mode, reset turn to X (first player)
    if (gameMode === 'online' && roomId) {
      setIsMyTurn(mySymbol === 'X');
      // Reset the game on the backend
      socket.emit('reset-tictactoe', { roomId });
    }
    
    // For solo mode, we need to restart the game with the backend
    if (gameMode === 'solo' && roomId) {
      // Reset the game on the backend
      socket.emit('reset-solo-tictactoe', { roomId });
    }
  }, [gameMode, roomId, socket, mySymbol]);

  // Start new game
  const startNewGame = useCallback(() => {
    setGameMode(null);
    setDifficulty('easy');
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameStatus('waiting');
    setIsMyTurn(false);
    setRoomId(null);
    setOpponent(null);
    setShowGameOver(false);
    setMySymbol(null);
    setOpponentSymbol(null);
  }, []);

  // Start solo game
  const startSoloGame = useCallback(() => {
    setGameMode('solo');
    setGameStatus('waiting');
    
    // Start solo game with AI on backend
    socket.emit('start-solo-tictactoe', {
      difficulty,
      player: {
        id: userProfile?.id || 'anonymous',
        username: userProfile?.username || 'Player',
        collegeName: userProfile?.collegeName || 'Unknown College'
      }
    });
  }, [socket, difficulty, userProfile]);

  // Start online game
  const startOnlineGame = useCallback(() => {
    setGameMode('online');
    setGameStatus('waiting');
    
    // Use the find-tictactoe-room event for automatic matchmaking
    socket.emit('find-tictactoe-room', {
      player: {
        id: userProfile?.id || 'anonymous',
        username: userProfile?.username || 'Player',
        collegeName: userProfile?.collegeName || 'Unknown College'
      }
    });
  }, [socket, userProfile]);

  // Socket event handlers for online mode - UPDATED VERSION
  useEffect(() => {
    if (!socket || gameMode !== 'online') return;

    const handleRoomCreated = (data) => {
      console.log('TicTacToe room created:', data);
    };

    const handlePlayerJoined = (data) => {
      console.log('Player joined:', data);
      setOpponent(data.player);
      setGameStatus('playing');
      setIsMyTurn(data.player.id !== userProfile?.id);
    };

    const handleGameStart = (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
      
      // Use the board from the server
      if (data.board) {
        setBoard(data.board);
      }
      
      // Determine which player I am (X or O) based on socket.id
      const myPlayer = data.players.find(p => p.socketId === socket.id);
      const opponentPlayer = data.players.find(p => p.socketId !== socket.id);
      
      if (myPlayer && opponentPlayer) {
        setOpponent(opponentPlayer);
        
        // Set my symbol and opponent's symbol
        setMySymbol(myPlayer.symbol);
        setOpponentSymbol(opponentPlayer.symbol);
        
        // Set initial turn - if starting player is X, and I'm X, then it's my turn
        const isMyTurn = data.startingPlayer === myPlayer.symbol;
        setIsMyTurn(isMyTurn);
        
        // Set current player to starting player
        setCurrentPlayer(data.startingPlayer);
        
        console.log(`Game started - I am ${myPlayer.symbol}, opponent is ${opponentPlayer.symbol}, starting player: ${data.startingPlayer}, my turn: ${isMyTurn}`);
      }
    };

    const handleMove = (data) => {
      console.log('Move received:', data);
      
      // Use the board state from the server instead of updating locally
      setBoard(data.board);
      setCurrentPlayer(data.nextTurn);
      
      // Determine whose turn it is next
      const moveWasMadeByMe = data.playerId === socket.id;
      setIsMyTurn(!moveWasMadeByMe);
      
      const newWinner = calculateWinner(data.board);
      if (newWinner) {
        setWinner(newWinner);
        setGameStatus('finished');
        setShowGameOver(true);
      } else if (isBoardFull(data.board)) {
        setWinner('draw');
        setGameStatus('finished');
        setShowGameOver(true);
      }
    };

    const handleMoveError = (data) => {
      console.log('Move error:', data);
      // Show error message to user
      alert(data.message || 'Invalid move');
    };

    const handleGameOver = (data) => {
      console.log('Game over:', data);
      setWinner(data.winner);
      setGameStatus('finished');
      setShowGameOver(true);
    };

    const handlePlayerLeft = (data) => {
      console.log('Player left:', data);
      setWinner('opponent_left');
      setGameStatus('finished');
      setShowGameOver(true);
    };

    const handleGameReset = (data) => {
      console.log('Game reset:', data);
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
      setWinner(null);
      setGameStatus('playing');
      setShowGameOver(false);
      
      // Set turn based on who I am
      setIsMyTurn(mySymbol === data.currentTurn);
    };

    socket.on('tictactoe-room-created', handleRoomCreated);
    socket.on('tictactoe-player-joined', handlePlayerJoined);
    socket.on('tictactoe-game-start', handleGameStart);
    socket.on('tictactoe-move', handleMove);
    socket.on('tictactoe-move-error', handleMoveError);
    socket.on('tictactoe-game-over', handleGameOver);
    socket.on('tictactoe-player-left', handlePlayerLeft);
    socket.on('tictactoe-game-reset', handleGameReset);

    return () => {
      socket.off('tictactoe-room-created', handleRoomCreated);
      socket.off('tictactoe-player-joined', handlePlayerJoined);
      socket.off('tictactoe-game-start', handleGameStart);
      socket.off('tictactoe-move', handleMove);
      socket.off('tictactoe-move-error', handleMoveError);
      socket.off('tictactoe-game-over', handleGameOver);
      socket.off('tictactoe-player-left', handlePlayerLeft);
      socket.off('tictactoe-game-reset', handleGameReset);
    };
  }, [socket, gameMode, calculateWinner, isBoardFull, userProfile, mySymbol]);

  // Socket event handlers for solo mode - UPDATED VERSION
  useEffect(() => {
    if (!socket || gameMode !== 'solo') return;

    const handleSoloGameStarted = (data) => {
      console.log('Solo TicTacToe game started:', data);
      setRoomId(data.roomId);
      setGameStatus('playing');
      setIsMyTurn(true);
    };

    const handleSoloMoveUpdated = (data) => {
      console.log('Solo move updated:', data);
      // Use the board from the server
      setBoard(data.board);
      setCurrentPlayer(data.nextTurn);
      setIsMyTurn(data.nextTurn === 'X');
      
      const newWinner = calculateWinner(data.board);
      if (newWinner) {
        setWinner(newWinner);
        setGameStatus('finished');
        setShowGameOver(true);
      } else if (isBoardFull(data.board)) {
        setWinner('draw');
        setGameStatus('finished');
        setShowGameOver(true);
      }
    };

    const handleSoloGameOver = (data) => {
      console.log('Solo game over:', data);
      setBoard(data.finalBoard);
      setWinner(data.winner);
      setGameStatus('finished');
      setShowGameOver(true);
    };

    const handleSoloGameReset = (data) => {
      console.log('Solo game reset:', data);
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
      setWinner(null);
      setGameStatus('playing');
      setShowGameOver(false);
      setIsMyTurn(true);
    };

    socket.on('solo-tictactoe-started', handleSoloGameStarted);
    socket.on('solo-tictactoe-move-updated', handleSoloMoveUpdated);
    socket.on('solo-tictactoe-game-over', handleSoloGameOver);
    socket.on('solo-tictactoe-reset', handleSoloGameReset);

    return () => {
      socket.off('solo-tictactoe-started', handleSoloGameStarted);
      socket.off('solo-tictactoe-move-updated', handleSoloMoveUpdated);
      socket.off('solo-tictactoe-game-over', handleSoloGameOver);
      socket.off('solo-tictactoe-reset', handleSoloGameReset);
    };
  }, [socket, gameMode, calculateWinner, isBoardFull]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && roomId) {
        if (gameMode === 'online') {
          socket.emit('leave-tictactoe-room', { roomId, playerId: userProfile?.id });
        }
        // For solo games, the room will be cleaned up automatically
      }
    };
  }, [socket, roomId, userProfile, gameMode]);

  // Show mode selection screen
  if (!gameMode) {
    return (
      <div className="game-board ttt-board">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft /> Back to Games
          </button>
          <h2>🎯 Tic Tac Toe</h2>
          <p>Choose your game mode</p>
        </div>

        <div className="ttt-mode-selection">
          <div className="mode-card solo-mode" onClick={startSoloGame}>
            <div className="mode-icon">
              <FaRobot size={48} />
            </div>
            <h3>Play Solo</h3>
            <p>Challenge the AI bot</p>
            <div className="difficulty-selector">
              <label>Difficulty:</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="easy">Easy</option>
                <option value="hard">Hard (Unbeatable)</option>
              </select>
            </div>
          </div>

          <div className="mode-card online-mode" onClick={startOnlineGame}>
            <div className="mode-icon">
              <FaUser size={48} />
            </div>
            <h3>Play Online</h3>
            <p>1v1 multiplayer battle</p>
            <div className="online-status">
              <span className="status-indicator online"></span>
              <span>Live multiplayer</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show game board
  return (
    <div className="game-board ttt-board">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Back to Games
        </button>
        <h2>🎯 Tic Tac Toe</h2>
        <div className="game-info">
          {gameMode === 'solo' ? (
            <div className="mode-indicator">
              <FaRobot /> Solo vs AI ({difficulty})
            </div>
          ) : (
            <div className="mode-indicator">
              <FaUser /> Online 1v1
              {opponent && <span> vs {opponent.username}</span>}
            </div>
          )}
          
          {gameStatus === 'playing' && !winner && (
            <div className="turn-indicator">
              {isMyTurn ? (
                <span className="player-turn">Your Turn ({mySymbol})</span>
              ) : (
                <span className="opponent-turn">
                  {gameMode === 'solo' ? "AI's Turn (O)" : `${opponent?.username || 'Opponent'}'s Turn (${opponentSymbol})`}
                </span>
              )}
            </div>
          )}
          
          {gameStatus === 'waiting' && gameMode === 'online' && (
            <div className="waiting-indicator">
              <div className="spinner"></div>
              Waiting for opponent...
            </div>
          )}
        </div>
      </div>

      <div className="ttt-container">
        <div className="ttt-grid">
          {board.map((cell, idx) => (
            <button 
              key={idx} 
              className={`ttt-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'player-x' : cell === 'O' ? 'player-o' : ''}`}
              onClick={() => handleCellClick(idx)}
              disabled={gameStatus !== 'playing' || winner || (gameMode === 'solo' && currentPlayer === 'O') || (gameMode === 'online' && !isMyTurn)}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="ttt-actions">
          {gameStatus === 'playing' && !winner && (
            <button className="reset-btn" onClick={resetGame}>
              <FaRedo /> Reset Game
            </button>
          )}
          
          {gameStatus === 'finished' && (
            <div className="game-over-actions">
              <button className="play-again-btn" onClick={resetGame}>
                <FaPlay /> Play Again
              </button>
              <button className="new-game-btn" onClick={startNewGame}>
                <FaRedo /> New Game
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <div className="result-icon">
              {winner === 'X' ? (
                <FaCrown className="winner-icon player-x" />
              ) : winner === 'O' ? (
                <FaCrown className="winner-icon player-o" />
              ) : winner === 'draw' ? (
                <FaHandshake className="draw-icon" />
              ) : (
                <FaHandshake className="opponent-left-icon" />
              )}
            </div>
            
            <h3 className="result-title">
              {winner === 'X' || winner === 'O' ? (
                <>
                  <span className={winner === 'X' ? 'player-x' : 'player-o'}>
                    {winner} Wins!
                  </span>
                </>
              ) : winner === 'draw' ? (
                "It's a Draw!"
              ) : winner === 'opponent_left' ? (
                "Opponent Left"
              ) : (
                "Game Over"
              )}
            </h3>
            
            <p className="result-message">
              {winner === 'X' || winner === 'O' ? (
                gameMode === 'solo' ? (
                  winner === mySymbol ? "Congratulations! You won!" : "The AI won. Better luck next time!"
                ) : (
                  winner === mySymbol ? "Congratulations! You won!" : `${opponent?.username || 'Opponent'} won!`
                )
              ) : winner === 'draw' ? (
                "Great game! Both players played well!"
              ) : winner === 'opponent_left' ? (
                "Your opponent has left the game."
              ) : (
                "The game has ended."
              )}
            </p>
            
            <div className="modal-actions">
              <button className="play-again-btn" onClick={resetGame}>
                <FaPlay /> Play Again
              </button>
              <button className="new-game-btn" onClick={startNewGame}>
                <FaRedo /> New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;