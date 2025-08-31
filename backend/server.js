const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting (fixes X-Forwarded-For header issue)
// Only trust proxy in production environment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  maxHttpBufferSize: 1e8
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const collegeRoutes = require('./routes/colleges');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const gameRoutes = require('./routes/games');
const chatRoutes = require('./routes/chat');

const quizRoutes = require('./routes/quiz');
const ludoRoomsRoutes = require('./routes/ludoRooms');
const adminRoutes = require('./routes/admin');
const bannerRoutes = require('./routes/banners');

// Import database connection
const db = require('./config/database');

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Create uploads directories if they don't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const bannersDir = path.join(uploadsDir, 'banners');
const coversDir = path.join(uploadsDir, 'covers');
const profilesDir = path.join(uploadsDir, 'profiles');
const chatDir = path.join(uploadsDir, 'chat');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir);
}
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir);
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir);
}
if (!fs.existsSync(chatDir)) {
  fs.mkdirSync(chatDir);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api/quiz', quizRoutes);
app.use('/api/games/ludo-rooms', ludoRoomsRoutes);
app.use('/api/admin', adminRoutes);

// Add debugging for banner routes
console.log('🔧 Registering banner routes at /api/banners');
app.use('/api/banners', (req, res, next) => {
  console.log(`📡 Banner route accessed: ${req.method} ${req.path}`);
  console.log('📋 Request headers:', req.headers);
  next();
}, bannerRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'CampusClash API is running',
      timestamp: new Date().toISOString()
    });
  });

// Serve default college logo
app.get('/default-college-logo.png', (req, res) => {
  const pngPath = path.join(__dirname, '../uploads/default-college-logo.png');
  const svgPath = path.join(__dirname, '../uploads/default-college-logo.svg');
  
  // Check if PNG exists, if not serve SVG instead
  if (require('fs').existsSync(pngPath)) {
    res.sendFile(pngPath);
  } else {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(svgPath);
  }
});

// Serve default college logo SVG
app.get('/default-college-logo.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '../uploads/default-college-logo.svg'));
});

// Global game state management
const tictactoeRooms = new Map();
const ludoQueue = [];
const ludoRooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user data in socket for reconnection handling
  let userData = null;
  
  // Join college room
  socket.on('join-college', (collegeId) => {
    userData = { collegeId };
    socket.join(`college-${collegeId}`);
    console.log(`User joined college room: ${collegeId}`);
  });
  
  // Join Ludo queue for automatic room creation
  socket.on('join-ludo-queue', (playerData) => {
    console.log('Player joining Ludo queue:', playerData.username);
    
    // Check if player is already in queue
    const existingPlayer = ludoQueue.find(p => p.userId === playerData.userId);
    if (existingPlayer) {
      socket.emit('error', { message: 'Already in queue' });
      return;
    }
    
    // Add player to queue
    const player = {
      ...playerData,
      socketId: socket.id,
      joinedAt: new Date()
    };
    ludoQueue.push(player);
    
    // Join waiting room
    socket.join('ludo-waiting');
    
    // AUTO-ADD 3 BOTS FOR TESTING (since user is developing alone)
    if (ludoQueue.length === 1) {
      console.log('Adding 3 bots for testing...');
      
      const botNames = ['Bot Rahul', 'Bot Priya', 'Bot Amit'];
      const botColleges = ['IIT Guwahati', 'Gauhati University', 'Assam University'];
      const botColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
      
      for (let i = 0; i < 3; i++) {
        const bot = {
          userId: `bot-${i + 1}`,
          username: botNames[i],
          collegeId: i + 1,
          collegeName: botColleges[i],
          socketId: `bot-socket-${i + 1}`,
          joinedAt: new Date(),
          isBot: true,
          color: botColors[i]
        };
        ludoQueue.push(bot);
        console.log(`Bot ${botNames[i]} added to queue`);
      }
    }
    
    // Notify all waiting players
    io.to('ludo-waiting').emit('waitingForPlayers', {
      players: ludoQueue,
      count: ludoQueue.length,
      needed: 4 - ludoQueue.length
    });
    
    console.log(`Player ${playerData.username} joined Ludo queue. Total: ${ludoQueue.length}/4`);
    
    // Check if we have enough players to create a room
    if (ludoQueue.length >= 4) {
      createLudoRoom();
    }
  });

  // Leave Ludo queue
  socket.on('leave-ludo-queue', (playerData) => {
    console.log('Player leaving Ludo queue:', playerData.userId);
    
    // Remove player from queue
    const queueIndex = ludoQueue.findIndex(p => p.userId === playerData.userId);
    if (queueIndex !== -1) {
      const removedPlayer = ludoQueue.splice(queueIndex, 1)[0];
      
      // Leave waiting room
      socket.leave('ludo-waiting');
      
      // Notify remaining players
      io.to('ludo-waiting').emit('waitingForPlayers', {
        players: ludoQueue,
        count: ludoQueue.length,
        needed: 4 - ludoQueue.length
      });
      
      console.log(`Player ${removedPlayer.username} left Ludo queue. Total: ${ludoQueue.length}/4`);
    }
  });
  
  // Create Ludo room when 4 players join
  const createLudoRoom = async () => {
    if (ludoQueue.length < 4) return;
    
    // Take first 4 players from queue
    const roomPlayers = ludoQueue.splice(0, 4);
    const roomId = `ludo-${Date.now()}`;
    
    // Create room data - Individual players, no teams
    const room = {
      id: roomId,
      type: 'ludo',
      status: 'starting',
      players: roomPlayers.map(player => ({
        userId: player.userId,
        username: player.username,
        collegeName: player.collegeName,
        color: player.color,
        isBot: player.isBot,
        socketId: player.socketId
      })),
      createdAt: new Date(),
      gameData: {
        board: initializeLudoBoard(),
        currentTurn: 0,
        diceValue: 0,
        gameState: 'waiting'
      }
    };
    
    // Verify board initialization
    if (!room.gameData.board || !room.gameData.board.paths) {
      console.error('Board initialization failed in createLudoRoom');
      room.gameData.board = initializeLudoBoard();
    }
    
    // Store room
    ludoRooms.set(roomId, room);
    
    // Notify all players in the room
    roomPlayers.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.leave('ludo-waiting');
        playerSocket.join(roomId);
        playerSocket.emit('roomCreated', { room });
      }
    });
    
    // Start countdown
    setTimeout(() => {
      startLudoGame(roomId);
    }, 5000);
    
    console.log(`Ludo room ${roomId} created with ${roomPlayers.length} individual players`);
    console.log('Room structure:', JSON.stringify(room, null, 2));
  };
  
  // Initialize Ludo board
  const initializeLudoBoard = () => {
    return {
      paths: Array(52).fill(null).map((_, i) => ({
        position: i,
        pieces: [],
        isSafe: [0, 8, 13, 21, 26, 34, 39, 47].includes(i)
      })),
      homeAreas: {
        team1: Array(4).fill(null).map((_, i) => ({ id: i, status: 'home' })),
        team2: Array(4).fill(null).map((_, i) => ({ id: i, status: 'home' }))
      }
    };
  };
  
  // Start Ludo game
  const startLudoGame = (roomId) => {
    const room = ludoRooms.get(roomId);
    if (!room) return;
    
    room.status = 'active';
    room.gameData.gameState = 'playing';
    room.startedAt = new Date();
    
    // Initialize game data
    room.gameData = {
      ...room.gameData,
      board: initializeLudoBoard(),
      currentTurn: 0,
      diceValue: 0,
      gameState: 'playing',
      pieces: initializeLudoPieces(),
      gameHistory: []
    };
    
    // Ensure board is properly initialized
    if (!room.gameData.board || !room.gameData.board.paths) {
      console.error('Board initialization failed in startLudoGame');
      room.gameData.board = initializeLudoBoard();
    }
    
    // Notify all players
    io.to(roomId).emit('gameStart', { room });
    
    console.log(`Ludo game started in room ${roomId}`);
    
    // Start bot turns if it's a bot's turn
    if (room.gameData.currentTurn < room.players.length) {
      const currentPlayer = room.players[room.gameData.currentTurn];
      if (currentPlayer.isBot) {
        setTimeout(() => botMakeMove(roomId, currentPlayer), 2000); // Bot takes 2 seconds to think
      }
    }
  };

  // Initialize Ludo pieces
  const initializeLudoPieces = () => {
    const pieces = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D'];
    
    for (let player = 0; player < 4; player++) {
      for (let piece = 0; piece < 4; piece++) {
        pieces.push({
          id: `player-${player}-piece-${piece}`,
          player: player,
          pieceNumber: piece,
          color: colors[player],
          position: 'home',
          homePosition: piece,
          pathPosition: -1,
          isHome: true,
          isFinished: false
        });
      }
    }
    return pieces;
  };

  // Bot AI for making moves
  const botMakeMove = (roomId, botPlayer) => {
    const room = ludoRooms.get(roomId);
    if (!room || room.status !== 'active') return;
    
    console.log(`Bot ${botPlayer.username} is thinking...`);
    
    // Simulate bot thinking time
    setTimeout(() => {
      // Simple bot logic: roll dice and make a random valid move
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      console.log(`Bot ${botPlayer.username} rolled: ${diceRoll}`);
      
      // Find a valid piece to move
      const botPieces = room.gameData.pieces.filter(p => p.player === room.gameData.currentTurn);
      const validPieces = botPieces.filter(p => canMovePiece(p, diceRoll));
      
      if (validPieces.length > 0) {
        // Select random valid piece
        const selectedPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
        makeBotMove(roomId, selectedPiece, diceRoll);
      } else {
        // No valid moves, pass turn
        console.log(`Bot ${botPlayer.username} has no valid moves, passing turn`);
        nextTurn(roomId);
      }
    }, 1000);
  };

  // Check if bot piece can move
  const canMovePiece = (piece, diceValue) => {
    if (piece.isFinished) return false;
    
    if (piece.isHome) {
      // Can only move out of home with a 6
      return diceValue === 6;
    }
    
    // Check if piece can move without going out of bounds
    const newPosition = piece.pathPosition + diceValue;
    return newPosition <= 51;
  };

  // Make bot move
  const makeBotMove = (roomId, piece, diceValue) => {
    const room = ludoRooms.get(roomId);
    if (!room) return;
    
    const pieceIndex = room.gameData.pieces.findIndex(p => p.id === piece.id);
    if (pieceIndex === -1) return;
    
    if (piece.isHome && diceValue === 6) {
      // Move out of home
      room.gameData.pieces[pieceIndex] = {
        ...piece,
        isHome: false,
        pathPosition: 0,
        position: 'path'
      };
      addToGameHistory(room, `${getPlayerColorName(piece.color)} piece moved out of home!`);
    } else if (!piece.isHome) {
      // Move on path
      const newPathPosition = piece.pathPosition + diceValue;
      
      if (newPathPosition > 51) {
        // Piece finished
        room.gameData.pieces[pieceIndex] = {
          ...piece,
          isFinished: true,
          position: 'finished',
          pathPosition: 51
        };
        addToGameHistory(room, `${getPlayerColorName(piece.color)} piece reached the finish!`);
        
        // Check if player won
        if (checkPlayerWon(room, piece.player)) {
          handlePlayerWin(room, piece.player);
          return;
        }
      } else {
        room.gameData.pieces[pieceIndex] = {
          ...piece,
          pathPosition: newPathPosition,
          position: 'path'
        };
        addToGameHistory(room, `${getPlayerColorName(piece.color)} piece moved to position ${newPathPosition}`);
      }
    }
    
    // Ensure board is properly initialized before updating
    if (!room.gameData.board || !room.gameData.board.paths) {
      console.log('Board not initialized in makeBotMove, initializing now');
      room.gameData.board = initializeLudoBoard();
    }
    
    // Update board
    updateLudoBoard(room);
    
    // Check for captures
    checkForCaptures(room);
    
    // Move to next turn
    nextTurn(roomId);
  };

  // Check if player won
  const checkPlayerWon = (room, playerId) => {
    const playerPieces = room.gameData.pieces.filter(p => p.player === playerId);
    return playerPieces.every(p => p.isFinished);
  };

  // Handle player win
  const handlePlayerWin = (room, playerId) => {
    const playerNames = ['Red', 'Green', 'Blue', 'Yellow'];
    addToGameHistory(room, `🎉 ${playerNames[playerId]} player wins the game! 🎉`);
    room.gameData.gameState = 'finished';
    
    // Notify all players
    io.to(room.id).emit('gameEnd', { 
      winner: playerId, 
      winnerName: playerNames[playerId],
      room: room
    });
    
    console.log(`Game ended in room ${room.id}. Winner: ${playerNames[playerId]}`);
  };

  // Next turn
  const nextTurn = (roomId) => {
    const room = ludoRooms.get(roomId);
    if (!room) return;
    
    const nextTurnIndex = (room.gameData.currentTurn + 1) % 4;
    room.gameData.currentTurn = nextTurnIndex;
    
    // Notify all players
    io.to(roomId).emit('turnUpdate', {
      currentTurn: nextTurnIndex,
      currentPlayer: room.players[nextTurnIndex],
      room: room
    });
    
    // Check if next player can move
    const nextPlayerPieces = room.gameData.pieces.filter(p => p.player === nextTurnIndex);
    const canMove = nextPlayerPieces.some(p => !p.isFinished);
    
    if (!canMove) {
      addToGameHistory(room, `${['Red', 'Green', 'Blue', 'Yellow'][nextTurnIndex]} player has no moves, skipping turn.`);
      nextTurn(roomId); // Skip to next player
    } else {
      // If next player is also a bot, continue the cycle
      const nextPlayer = room.players[nextTurnIndex];
      if (nextPlayer.isBot) {
        setTimeout(() => botMakeMove(roomId, nextPlayer), 2000);
      }
    }
  };

  // Update Ludo board
  const updateLudoBoard = (room) => {
    // Ensure board is properly initialized
    if (!room.gameData.board || !room.gameData.board.paths) {
      console.log('Board not initialized, creating new board');
      room.gameData.board = initializeLudoBoard();
    }
    
    // Place pieces on board
    if (room.gameData.pieces && Array.isArray(room.gameData.pieces)) {
      room.gameData.pieces.forEach(piece => {
        if (piece.position === 'path' && piece.pathPosition >= 0 && piece.pathPosition < 52) {
          // Access the paths array within the board object
          if (room.gameData.board.paths[piece.pathPosition]) {
            room.gameData.board.paths[piece.pathPosition].pieces.push(piece);
          } else {
            console.error(`Board path position ${piece.pathPosition} not found for piece ${piece.id}`);
          }
        }
      });
    } else {
      console.error('No pieces array found in room.gameData:', room.gameData);
    }
  };

  // Check for captures
  const checkForCaptures = (room) => {
    const pathPieces = room.gameData.pieces.filter(p => p.position === 'path' && !p.isHome);
    
    for (let piece of pathPieces) {
      const piecesAtPosition = pathPieces.filter(p => 
        p.pathPosition === piece.pathPosition && p.id !== piece.id
      );
      
      if (piecesAtPosition.length > 0) {
        // Capture happened - send pieces back home
        room.gameData.pieces = room.gameData.pieces.map(p => {
          if (piecesAtPosition.some(captured => captured.id === p.id)) {
            return {
              ...p,
              position: 'home',
              pathPosition: -1,
              isHome: true
            };
          }
          return p;
        });
        
        // Ensure board is initialized before updating
        if (!room.gameData.board || !room.gameData.board.paths) {
          console.log('Board not initialized in checkForCaptures, initializing now');
          room.gameData.board = initializeLudoBoard();
        }
        
        updateLudoBoard(room);
        addToGameHistory(room, `Capture! ${getPlayerColorName(piece.color)} piece captured opponent!`);
      }
    }
  };

  // Add to game history
  const addToGameHistory = (room, message) => {
    const timestamp = new Date().toLocaleTimeString();
    room.gameData.gameHistory.push({ message, timestamp });
    
    // Keep only last 50 entries
    if (room.gameData.gameHistory.length > 50) {
      room.gameData.gameHistory = room.gameData.gameHistory.slice(-50);
    }
  };

  // Get player color name
  const getPlayerColorName = (color) => {
    const colorMap = {
      '#FF6B6B': 'Red',
      '#4ECDC4': 'Green',
      '#45B7D1': 'Blue',
      '#FFD93D': 'Yellow'
    };
    return colorMap[color] || 'Unknown';
  };

  // Handle game actions from frontend
  socket.on('game-action', (data) => {
    const { gameId, action, gameData } = data;
    
    if (action === 'rollDice') {
      handlePlayerDiceRoll(gameId, socket.id, gameData);
    } else if (action === 'movePiece') {
      handlePlayerMove(gameId, socket.id, gameData);
    }
  });

  // Handle player dice roll
  const handlePlayerDiceRoll = (roomId, socketId, data) => {
    const room = ludoRooms.get(roomId);
    if (!room || room.status !== 'active') return;
    
    const player = room.players.find(p => p.socketId === socketId);
    if (!player || room.gameData.currentTurn !== room.players.indexOf(player)) return;
    
    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.gameData.diceValue = diceValue;
    
    // Check if player can move any piece
    const playerPieces = room.gameData.pieces.filter(p => p.player === room.players.indexOf(player));
    const canMove = playerPieces.some(p => canMovePiece(p, diceValue));
    
    if (!canMove) {
      addToGameHistory(room, `No valid moves available. Turn passed to next player.`);
      nextTurn(roomId);
    } else {
      addToGameHistory(room, `Dice rolled: ${diceValue}! Select a piece to move.`);
    }
    
    // Notify all players
    io.to(roomId).emit('diceRolled', {
      playerId: room.players.indexOf(player),
      diceValue: diceValue,
      canMove: canMove,
      room: room
    });
  };

  // Handle player move
  const handlePlayerMove = (roomId, socketId, data) => {
    const room = ludoRooms.get(roomId);
    if (!room || room.status !== 'active') return;
    
    const player = room.players.find(p => p.socketId === socketId);
    if (!player || room.gameData.currentTurn !== room.players.indexOf(player)) return;
    
    const { pieceId, diceValue } = data;
    const piece = room.gameData.pieces.find(p => p.id === pieceId);
    
    if (!piece || piece.player !== room.players.indexOf(player)) return;
    
    if (canMovePiece(piece, diceValue)) {
      makePlayerMove(room, piece, diceValue);
    }
  };

  // Make player move
  const makePlayerMove = (room, piece, diceValue) => {
    const pieceIndex = room.gameData.pieces.findIndex(p => p.id === piece.id);
    if (pieceIndex === -1) return;
    
    if (piece.isHome && diceValue === 6) {
      // Move out of home
      room.gameData.pieces[pieceIndex] = {
        ...piece,
        isHome: false,
        pathPosition: 0,
        position: 'path'
      };
      addToGameHistory(room, `${getPlayerColorName(piece.color)} piece moved out of home!`);
    } else if (!piece.isHome) {
      // Move on path
      const newPathPosition = piece.pathPosition + diceValue;
      
      if (newPathPosition > 51) {
        // Piece finished
        room.gameData.pieces[pieceIndex] = {
          ...piece,
          isFinished: true,
          position: 'finished',
          pathPosition: 51
        };
        addToGameHistory(room, `${getPlayerColorName(piece.color)} piece reached the finish!`);
        
        // Check if player won
        if (checkPlayerWon(room, piece.player)) {
          handlePlayerWin(room, piece.player);
          return;
        }
      } else {
        room.gameData.pieces[pieceIndex] = {
          ...piece,
          pathPosition: newPathPosition,
          position: 'path'
        };
        addToGameHistory(room, `${getPlayerColorName(piece.color)} piece moved to position ${newPathPosition}`);
      }
    }
    
    // Ensure board is properly initialized before updating
    if (!room.gameData.board || !room.gameData.board.paths) {
      console.log('Board not initialized in makePlayerMove, initializing now');
      room.gameData.board = initializeLudoBoard();
    }
    
    // Update board
    updateLudoBoard(room);
    
    // Check for captures
    checkForCaptures(room);
    
    // Move to next turn
    nextTurn(room.id);
  };
  
  // Join game room
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`User joined game room: ${gameId}`);
  });
  
  // Handle chat messages
  socket.on('send-message', (data) => {
    // Emit to college room
    io.to(`college-${data.collegeId}`).emit('new-message', data);
    
    // Update online users count for the college
    const collegeRoom = io.sockets.adapter.rooms.get(`college-${data.collegeId}`);
    const onlineUsers = collegeRoom ? collegeRoom.size : 0;
    
    io.to(`college-${data.collegeId}`).emit('college-users-update', {
      collegeId: data.collegeId,
      onlineUsers: onlineUsers
    });
  });

  // Handle media messages
  socket.on('send-media-message', (data) => {
    io.to(`college-${data.collegeId}`).emit('new-media-message', data);
  });

  // Handle voice messages
  socket.on('send-voice-message', (data) => {
    io.to(`college-${data.collegeId}`).emit('new-voice-message', data);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`college-${data.collegeId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      collegeId: data.collegeId
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`college-${data.collegeId}`).emit('user-stop-typing', {
      userId: data.userId,
      collegeId: data.collegeId
    });
  });

  // Handle message reactions
  socket.on('message-reaction', (data) => {
    const { messageId, reaction, action, userId, collegeId } = data;
    
    // Emit to all users in the college chat room
    io.to(`college-${collegeId}`).emit('message-reacted', {
      messageId,
      reaction,
      action,
      userId,
      collegeId
    });
    
    console.log(`Message reaction ${action}: ${reaction} on message ${messageId} by user ${userId} in college ${collegeId}`);
  });

  // Handle game start
  socket.on('game-start', (data) => {
    const { gameId, gameData } = data;
    
    io.to(`game-${gameId}`).emit('game-start', {
      gameData,
      timestamp: new Date().toISOString()
    });
  });

  // Handle game end
  socket.on('game-end', (data) => {
    const { gameId, winner, scores } = data;
    
    io.to(`game-${gameId}`).emit('game-end', {
      winner,
      scores,
      timestamp: new Date().toISOString()
    });
  });

  // Tic Tac Toe multiplayer handlers
  
  // Create Tic Tac Toe room
  socket.on('create-tictactoe-room', (data) => {
    const { roomId, player } = data;
    
    const room = {
      id: roomId,
      players: [player],
      status: 'waiting',
      board: Array(9).fill(null),
      currentTurn: 'X',
      createdAt: new Date()
    };
    
    tictactoeRooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('tictactoe-room-created', { roomId, room });
    console.log(`Tic Tac Toe room ${roomId} created by ${player.username}`);
  });

  // Find available Tic Tac Toe room
  socket.on('find-tictactoe-room', (data) => {
    const { player } = data;
    
    // Find a room that's waiting for players
    let availableRoom = null;
    for (const [roomId, room] of tictactoeRooms) {
      if (room.status === 'waiting' && room.players.length === 1) {
        availableRoom = room;
        break;
      }
    }
    
    if (availableRoom) {
      // Join the available room
      const joiningPlayer = {
        ...player,
        socketId: socket.id,
        symbol: 'O' // Second player is always O
      };
      availableRoom.players.push(joiningPlayer);
      
      // Assign X to the first player
      availableRoom.players[0].symbol = 'X';
      
      socket.join(availableRoom.id);
      
      // Set roomId for the joining player
      socket.emit('tictactoe-room-created', { 
        roomId: availableRoom.id, 
        room: availableRoom 
      });
      
      // Notify all players in the room
      io.to(availableRoom.id).emit('tictactoe-player-joined', { 
        roomId: availableRoom.id, 
        player: joiningPlayer 
      });
      
      // Start the game since we now have 2 players
      availableRoom.status = 'playing';
      availableRoom.currentTurn = 'X';
      
      // Assign X and O to players
      const playerX = availableRoom.players[0];
      const playerO = availableRoom.players[1];
      
      console.log('Starting game with players:', { 
        playerX: { id: playerX.id, socketId: playerX.socketId, symbol: playerX.symbol }, 
        playerO: { id: playerO.id, socketId: playerO.socketId, symbol: playerO.symbol } 
      });
      
      io.to(availableRoom.id).emit('tictactoe-game-start', { 
        roomId: availableRoom.id, 
        startingPlayer: 'X',
        players: availableRoom.players,
        playerX: playerX,
        playerO: playerO,
        currentTurn: 'X',
        board: availableRoom.board // Send the board state
      });
      
      console.log(`Player ${player.username} joined available room ${availableRoom.id} and game started`);
      console.log('Room state after game start:', { 
        roomId: availableRoom.id, 
        players: availableRoom.players, 
        status: availableRoom.status, 
        currentTurn: availableRoom.currentTurn 
      });
    } else {
      // No available room, create a new one
      const newRoomId = `ttt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newRoom = {
        id: newRoomId,
        players: [{
          ...player,
          socketId: socket.id,
          symbol: 'X' // First player is always X
        }],
        status: 'waiting',
        board: Array(9).fill(null),
        currentTurn: 'X',
        createdAt: new Date()
      };
      
      tictactoeRooms.set(newRoomId, newRoom);
      socket.join(newRoomId);
      
      socket.emit('tictactoe-room-created', { roomId: newRoomId, room: newRoom });
      console.log(`New Tic Tac Toe room ${newRoomId} created by ${player.username}`);
    }
  });

  // Start solo Tic Tac Toe game with AI
  socket.on('start-solo-tictactoe', (data) => {
    const { difficulty, player } = data;
    
    const roomId = `solo-ttt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const room = {
      id: roomId,
      players: [player],
      status: 'playing',
      board: Array(9).fill(null),
      currentTurn: 'X',
      difficulty: difficulty,
      isSolo: true,
      createdAt: new Date()
    };
    
    tictactoeRooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('solo-tictactoe-started', { roomId, room });
    console.log(`Solo Tic Tac Toe game started with ${difficulty} difficulty for ${player.username}`);
  });

  // Handle solo Tic Tac Toe moves
  socket.on('solo-tictactoe-move', (data) => {
    const { roomId, position, player } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room || !room.isSolo || room.status !== 'playing') {
      return;
    }
    
    // Validate move
    if (room.board[position] !== null || room.currentTurn !== player) {
      return;
    }
    
    // Update board with player move
    room.board[position] = player;
    
    // Check for winner after player move
    const winner = calculateTicTacToeWinner(room.board);
    if (winner || isTicTacToeBoardFull(room.board)) {
      room.status = 'finished';
      socket.emit('solo-tictactoe-game-over', { 
        roomId, 
        winner: winner || 'tie', 
        board: room.board,
        finalBoard: room.board
      });
      return;
    }
    
    // Switch to AI turn
    room.currentTurn = 'O';
    socket.emit('solo-tictactoe-move-updated', { 
      roomId, 
      position, 
      player,
      nextTurn: 'O',
      board: room.board // Send the updated board
    });
    
    // AI makes move after a short delay
    setTimeout(() => {
      makeAIMove(roomId, room.difficulty);
    }, 500);
  });

  // Reset solo Tic Tac Toe game
  socket.on('reset-solo-tictactoe', (data) => {
    const { roomId } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room || !room.isSolo) {
      return;
    }
    
    // Reset the room state
    room.board = Array(9).fill(null);
    room.currentTurn = 'X';
    room.status = 'playing';
    
    // Notify the client that the game has been reset
    socket.emit('solo-tictactoe-reset', { 
      roomId, 
      board: room.board,
      currentTurn: 'X'
    });
    
    console.log(`Solo Tic Tac Toe game reset in room ${roomId}`);
  });

  // AI move function for solo games
  const makeAIMove = (roomId, difficulty) => {
    const room = tictactoeRooms.get(roomId);
    if (!room || !room.isSolo || room.status !== 'playing') {
      return;
    }
    
    let move;
    if (difficulty === 'hard') {
      // Unbeatable AI using minimax algorithm
      move = findBestMove([...room.board]);
    } else {
      // Easy AI - random moves
      const availableMoves = room.board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
      move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    if (move !== null && move !== undefined) {
      // Update board with AI move
      room.board[move] = 'O';
      
      // Check for winner after AI move
      const winner = calculateTicTacToeWinner(room.board);
      if (winner || isTicTacToeBoardFull(room.board)) {
        room.status = 'finished';
        // For solo games, emit to the same socket
        socket.emit('solo-tictactoe-game-over', { 
          roomId, 
          winner: winner || 'tie', 
          board: room.board,
          finalBoard: room.board
        });
      } else {
        // Switch back to player turn
        room.currentTurn = 'X';
        // For solo games, emit to the same socket
        socket.emit('solo-tictactoe-move-updated', { 
          roomId, 
          position: move, 
          player: 'O',
          nextTurn: 'X',
          board: room.board // Send the updated board
        });
      }
    }
  };

  // Minimax algorithm for unbeatable AI
  const findBestMove = (board) => {
    let bestScore = -Infinity;
    let bestMove = null;
    
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let score = minimax(board, 0, false);
        board[i] = null;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const minimax = (board, depth, isMaximizing) => {
    const winner = calculateTicTacToeWinner(board);
    if (winner === 'O') return 1;
    if (winner === 'X') return -1;
    if (isTicTacToeBoardFull(board)) return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          let score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          let score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };
  
  // Join Tic Tac Toe room
  socket.on('join-tictactoe-room', (data) => {
    const { roomId, player } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Add player to room
    room.players.push(player);
    socket.join(roomId);
    
    // Notify all players in the room
    io.to(roomId).emit('tictactoe-player-joined', { roomId, player });
    
    // If we have 2 players, start the game automatically
    if (room.players.length === 2) {
      room.status = 'playing';
      room.currentTurn = 'X';
      
      io.to(roomId).emit('tictactoe-game-start', { 
        roomId, 
        startingPlayer: 'X',
        players: room.players,
        board: room.board // Send the board state
      });
      
      console.log(`Tic Tac Toe game started in room ${roomId}`);
    }
    
    console.log(`Player ${player.username} joined Tic Tac Toe room ${roomId}`);
  });
  
  // Handle Tic Tac Toe moves - UPDATED VERSION
  socket.on('tictactoe-move', (data) => {
    const { roomId, position, player } = data;
    
    console.log('Move received on server:', { roomId, position, player, socketId: socket.id });
    
    const room = tictactoeRooms.get(roomId);
    if (!room || room.status !== 'playing') {
      console.log('Invalid room or game not playing:', { roomId, roomExists: !!room, status: room?.status });
      socket.emit('tictactoe-move-error', { message: 'Game is not active' });
      return;
    }
    
    // Find the player making the move
    const currentPlayer = room.players.find(p => p.socketId === socket.id);
    if (!currentPlayer) {
      console.log('Player not found in room:', { socketId: socket.id, roomPlayers: room.players });
      socket.emit('tictactoe-move-error', { message: 'Player not in this room' });
      return;
    }
    
    console.log('Player found in room:', { 
      player: currentPlayer, 
      roomCurrentTurn: room.currentTurn, 
      playerSymbol: currentPlayer.symbol 
    });
    
    // Validate that the player is using their correct symbol
    if (player !== currentPlayer.symbol) {
      console.log('Player using wrong symbol:', player, 'should be:', currentPlayer.symbol);
      socket.emit('tictactoe-move-error', { message: 'Invalid player symbol' });
      return;
    }
    
    // Validate turn - check if it's the player's turn
    if (room.currentTurn !== currentPlayer.symbol) {
      console.log('Not player turn:', currentPlayer.symbol, 'current turn:', room.currentTurn);
      socket.emit('tictactoe-move-error', { message: 'Not your turn' });
      return;
    }
    
    // Validate move - check if position is empty and within bounds
    if (position < 0 || position > 8 || room.board[position] !== null) {
      console.log('Invalid move position:', position);
      socket.emit('tictactoe-move-error', { message: 'Invalid move' });
      return;
    }
    
    // Update board with the validated move
    room.board[position] = player;
    
    // Check for winner or draw
    const winner = calculateTicTacToeWinner(room.board);
    const isDraw = isTicTacToeBoardFull(room.board) && !winner;
    
    if (winner || isDraw) {
      // Game over
      room.status = 'finished';
      io.to(roomId).emit('tictactoe-game-over', { 
        roomId, 
        winner: winner || 'draw', 
        board: room.board 
      });
      
      console.log(`Game over in room ${roomId}: ${winner ? winner + ' wins' : 'draw'}`);
    } else {
      // Switch turns and continue game
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
      
      // Send move to all players with updated board and next turn
      io.to(roomId).emit('tictactoe-move', { 
        roomId, 
        position, 
        player,
        playerId: socket.id,
        nextTurn: room.currentTurn,
        board: room.board // Send the entire updated board
      });
      
      console.log(`Valid move in room ${roomId}: ${player} at position ${position}, next turn: ${room.currentTurn}`);
    }
  });
  
  // Start Tic Tac Toe game manually - UPDATED VERSION
  socket.on('tictactoe-start-game', (data) => {
    const { roomId, startingPlayer } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room || room.players.length < 2) {
      return;
    }
    
    room.status = 'playing';
    room.currentTurn = startingPlayer;
    room.board = Array(9).fill(null);
    
    // Assign symbols to players
    room.players[0].symbol = 'X';
    room.players[1].symbol = 'O';
    
    io.to(roomId).emit('tictactoe-game-start', { 
      roomId, 
      startingPlayer,
      players: room.players,
      board: room.board // Send initial empty board
    });
    
    console.log(`Tic Tac Toe game started in room ${roomId}, starting player: ${startingPlayer}`);
  });
  
  // Reset Tic Tac Toe game - UPDATED VERSION
  socket.on('reset-tictactoe', (data) => {
    const { roomId } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room) {
      return;
    }
    
    // Reset the game state but keep players
    room.board = Array(9).fill(null);
    room.currentTurn = 'X';
    room.status = 'playing';
    
    // Notify all players that the game has been reset
    io.to(roomId).emit('tictactoe-game-reset', { 
      roomId,
      board: room.board,
      currentTurn: room.currentTurn
    });
    
    console.log(`Tic Tac Toe game reset in room ${roomId}`);
  });
  
  // Leave Tic Tac Toe room
  socket.on('leave-tictactoe-room', (data) => {
    const { roomId, playerId } = data;
    
    const room = tictactoeRooms.get(roomId);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    socket.leave(roomId);
    
    // Notify other players
    io.to(roomId).emit('tictactoe-player-left', { 
      roomId, 
      playerId,
      username: room.players.find(p => p.id === playerId)?.username || 'Unknown'
    });
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      tictactoeRooms.delete(roomId);
    } else if (room.status === 'playing') {
      // End game if someone left during play
      room.status = 'waiting';
      io.to(roomId).emit('tictactoe-game-over', { 
        roomId, 
        winner: 'opponent_left',
        board: room.board 
      });
    }
    
    console.log(`Player left Tic Tac Toe room ${roomId}`);
  });
  
  // Helper functions for Tic Tac Toe
  const calculateTicTacToeWinner = (board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };
  
  const isTicTacToeBoardFull = (board) => {
    return board.every(square => square !== null);
  };

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from Ludo queue if they were waiting
    const queueIndex = ludoQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      const removedPlayer = ludoQueue.splice(queueIndex, 1)[0];
      console.log(`Player ${removedPlayer.username} removed from Ludo queue due to disconnection`);
      
      // If a real player disconnected, remove all bots too
      if (!removedPlayer.isBot) {
        console.log('Real player disconnected, removing all bots from queue');
        ludoQueue.splice(0, ludoQueue.length); // Clear entire queue
      }
      
      // Notify remaining players
      io.to('ludo-waiting').emit('waitingForPlayers', {
        players: ludoQueue,
        count: ludoQueue.length,
        needed: 4 - ludoQueue.length
      });
    }
    
    // Handle room cleanup if needed
    ludoRooms.forEach((room, roomId) => {
      const playerInRoom = room.players.find(p => p.socketId === socket.id);
      if (playerInRoom) {
        console.log(`Player ${playerInRoom.username} disconnected from room ${roomId}`);
        // Could implement reconnection logic here
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 10000;

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Database connected successfully');
  connection.release();
  
  // Start server
  server.listen(PORT, () => {
    console.log(`🚀 CampusClash server running on port ${PORT}`);
    console.log(`📱 Socket.IO server ready for real-time connections`);
  });
});

module.exports = { app, io };