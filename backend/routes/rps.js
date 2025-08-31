const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Store active RPS games in memory (in production, use Redis)
const activeRPSGames = new Map();
const waitingPlayers = new Map();

// Create a new RPS game room
router.post('/create-room', verifyToken, async (req, res) => {
  try {
    const { roomName, maxPlayers = 2, pointsAtStake = 75 } = req.body;
    const userId = req.user.userId;
    const collegeId = req.user.college_id;

    // Generate unique room ID
    const roomId = `rps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create room
    const room = {
      id: roomId,
      name: roomName || `RPS Room ${roomId.slice(-6)}`,
      maxPlayers,
      pointsAtStake,
      status: 'waiting',
      players: [{
        userId,
        collegeId,
        username: req.user.username || 'Player',
        avatar: req.user.avatar,
        ready: false,
        choice: null
      }],
      currentRound: 0,
      maxRounds: 5,
      scores: { [userId]: 0 },
      history: [],
      createdAt: new Date(),
      createdBy: userId
    };

    activeRPSGames.set(roomId, room);
    waitingPlayers.set(userId, roomId);

    res.status(201).json({
      message: 'Room created successfully',
      roomId,
      room
    });
  } catch (error) {
    console.error('Error creating RPS room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join an existing RPS game room
router.post('/join-room/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const collegeId = req.user.college_id;

    const room = activeRPSGames.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Room is not accepting players' });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player already in room' });
    }

    // Add player to room
    room.players.push({
      userId,
      collegeId,
      username: req.user.username || 'Player',
      avatar: req.user.avatar,
      ready: false,
      choice: null
    });

    room.scores[userId] = 0;
    waitingPlayers.set(userId, roomId);

    res.json({
      message: 'Joined room successfully',
      room
    });
  } catch (error) {
    console.error('Error joining RPS room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get RPS room details
router.get('/room/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = activeRPSGames.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Error fetching RPS room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get available RPS rooms
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    const availableRooms = Array.from(activeRPSGames.values())
      .filter(room => room.status === 'waiting' && room.players.length < room.maxPlayers)
      .map(room => ({
        id: room.id,
        name: room.name,
        currentPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
        pointsAtStake: room.pointsAtStake,
        createdAt: room.createdAt
      }));

    res.json({ rooms: availableRooms });
  } catch (error) {
    console.error('Error fetching RPS rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Make a choice in RPS game
router.post('/make-choice', verifyToken, async (req, res) => {
  try {
    const { roomId, choice } = req.body;
    const userId = req.user.userId;

    const room = activeRPSGames.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = room.players.find(p => p.userId === userId);
    if (!player) {
      return res.status(400).json({ error: 'Player not in room' });
    }

    if (room.status !== 'playing') {
      return res.status(400).json({ error: 'Game not in playing state' });
    }

    // Record player's choice
    player.choice = choice;

    // Check if all players have made their choices
    const allPlayersChosen = room.players.every(p => p.choice !== null);
    
    if (allPlayersChosen) {
      // Calculate round result
      const result = calculateRPSResult(room.players);
      
      // Update scores and history
      updateRPSGameState(room, result);
      
      // Check if game is over
      if (room.currentRound >= room.maxRounds) {
        room.status = 'finished';
        // Save game result to database
        await saveRPSGameResult(room);
      } else {
        room.status = 'waiting';
        // Reset choices for next round
        room.players.forEach(p => p.choice = null);
      }
    }

    res.json({
      message: 'Choice recorded',
      room,
      allPlayersChosen
    });
  } catch (error) {
    console.error('Error making RPS choice:', error);
    res.status(500).json({ error: 'Failed to record choice' });
  }
});

// Start RPS game
router.post('/start-game/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = activeRPSGames.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({ error: 'Only room creator can start game' });
    }

    if (room.players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    room.status = 'playing';
    room.currentRound = 1;
    room.players.forEach(p => p.choice = null);

    res.json({
      message: 'Game started',
      room
    });
  } catch (error) {
    console.error('Error starting RPS game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Leave RPS room
router.post('/leave-room/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = activeRPSGames.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Remove player from room
    room.players = room.players.filter(p => p.userId !== userId);
    delete room.scores[userId];
    waitingPlayers.delete(userId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      activeRPSGames.delete(roomId);
    } else if (room.status === 'playing') {
      // If game was in progress, end it
      room.status = 'finished';
      await saveRPSGameResult(room);
    }

    res.json({
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Error leaving RPS room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Helper function to calculate RPS result
function calculateRPSResult(players) {
  const choices = players.map(p => p.choice);
  const uniqueChoices = [...new Set(choices)];
  
  if (uniqueChoices.length === 1) {
    // All players chose the same - it's a tie
    return {
      winner: null,
      result: 'tie',
      choices: choices
    };
  }

  // Determine winner based on RPS rules
  const rock = choices.filter(c => c === 'rock').length;
  const paper = choices.filter(c => c === 'paper').length;
  const scissors = choices.filter(c => c === 'scissors').length;

  let winner = null;
  let result = 'tie';

  if (rock > 0 && paper > 0 && scissors > 0) {
    // All three choices present - it's a tie
    result = 'tie';
  } else if (rock > 0 && paper > 0) {
    // Rock vs Paper - Paper wins
    winner = players.find(p => p.choice === 'paper');
    result = 'paper_wins';
  } else if (rock > 0 && scissors > 0) {
    // Rock vs Scissors - Rock wins
    winner = players.find(p => p.choice === 'rock');
    result = 'rock_wins';
  } else if (paper > 0 && scissors > 0) {
    // Paper vs Scissors - Scissors wins
    winner = players.find(p => p.choice === 'scissors');
    result = 'scissors_wins';
  }

  return {
    winner,
    result,
    choices: choices
  };
}

// Helper function to update game state
function updateRPSGameState(room, result) {
  // Add round to history
  room.history.push({
    round: room.currentRound,
    choices: room.players.map(p => ({ userId: p.userId, choice: p.choice })),
    result: result.result,
    winner: result.winner?.userId || null
  });

  // Update scores
  if (result.winner) {
    room.scores[result.winner.userId]++;
  }

  room.currentRound++;
}

// Helper function to save game result to database
async function saveRPSGameResult(room) {
  try {
    // Insert game record
    const [gameResult] = await db.promise().execute(
      `INSERT INTO rps_games (room_id, players, scores, history, points_at_stake, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        room.id,
        JSON.stringify(room.players.map(p => ({ userId: p.userId, collegeId: p.collegeId }))),
        JSON.stringify(room.scores),
        JSON.stringify(room.history),
        room.pointsAtStake,
        room.status,
        room.createdAt
      ]
    );

    // Update user points based on final scores
    for (const [userId, score] of Object.entries(room.scores)) {
      const pointsEarned = score > 0 ? Math.floor(room.pointsAtStake * (score / room.maxRounds)) : 0;
      
      if (pointsEarned > 0) {
        await db.promise().execute(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [pointsEarned, userId]
        );
      }
    }

    return gameResult.insertId;
  } catch (error) {
    console.error('Error saving RPS game result:', error);
    throw error;
  }
}

// Get user's RPS game history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [games] = await db.promise().execute(
      `SELECT * FROM rps_games 
       WHERE JSON_CONTAINS(players, ?, '$.userId') 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [JSON.stringify({ userId: parseInt(userId) })]
    );

    res.json({ games });
  } catch (error) {
    console.error('Error fetching RPS history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
