const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token and get user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await db.execute(
      'SELECT id, name, email, college_id, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user[0]) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all Ludo rooms
router.get('/', async (req, res) => {
  try {
    const [rooms] = await db.execute(`
      SELECT 
        r.id,
        r.name,
        r.status,
        r.created_at,
        r.started_at,
        r.ended_at,
        r.winner_id,
        r.creator_id,
        u.name as creator_name,
        u.avatar as creator_avatar,
        c.name as creator_college,
        COUNT(rp.id) as player_count
      FROM ludo_rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN room_players rp ON r.id = rp.room_id
      WHERE r.status IN ('waiting', 'playing')
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    // Get players for each room
    const roomsWithPlayers = await Promise.all(
      rooms.map(async (room) => {
        const [players] = await db.execute(`
          SELECT 
            rp.id,
            rp.user_id,
            rp.joined_at,
            rp.is_ready,
            u.name,
            u.avatar,
            c.name as college,
            c.id as college_id
          FROM room_players rp
          JOIN users u ON rp.user_id = u.id
          JOIN colleges c ON u.college_id = c.id
          WHERE rp.room_id = ?
          ORDER BY rp.joined_at
        `, [room.id]);

        return {
          ...room,
          players: players.map(player => ({
            id: player.user_id,
            name: player.name,
            avatar: player.avatar || '👤',
            college: player.college,
            collegeId: player.college_id,
            joinedAt: player.joined_at,
            isReady: player.is_ready
          })),
          creator: {
            id: room.creator_id,
            name: room.creator_name,
            avatar: room.creator_avatar || '👤',
            college: room.creator_college
          }
        };
      })
    );

    res.json({ rooms: roomsWithPlayers });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new Ludo room
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const collegeId = req.user.college_id;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ message: 'Room name must be at least 3 characters long' });
    }

    // Create room
    const [result] = await db.execute(`
      INSERT INTO ludo_rooms (name, creator_id, status, created_at)
      VALUES (?, ?, 'waiting', NOW())
    `, [name.trim(), userId]);

    const roomId = result.insertId;

    // Add creator as first player
    await db.execute(`
      INSERT INTO room_players (room_id, user_id, joined_at, is_ready)
      VALUES (?, ?, NOW(), true)
    `, [roomId, userId]);

    // Emit socket event for room creation
    if (req.app.get('io')) {
      req.app.get('io').emit('roomCreated', {
        roomId,
        room: {
          id: roomId,
          name: name.trim(),
          creator_id: userId,
          status: 'waiting'
        }
      });
    }

    res.status(201).json({ 
      message: 'Room created successfully',
      roomId,
      room: {
        id: roomId,
        name: name.trim(),
        creator_id: userId,
        status: 'waiting'
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Join a Ludo room
router.post('/:roomId/join', verifyToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user.id;

    // Check if room exists and is joinable
    const [rooms] = await db.execute(`
      SELECT r.*, COUNT(rp.id) as player_count
      FROM ludo_rooms r
      LEFT JOIN room_players rp ON r.id = rp.room_id
      WHERE r.id = ? AND r.status = 'waiting'
      GROUP BY r.id
    `, [roomId]);

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found or not joinable' });
    }

    const room = rooms[0];

    // Check if room is full
    if (room.player_count >= 4) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Check if user is already in the room
    const [existingPlayer] = await db.execute(`
      SELECT id FROM room_players WHERE room_id = ? AND user_id = ?
    `, [roomId, userId]);

    if (existingPlayer.length > 0) {
      return res.status(400).json({ message: 'You are already in this room' });
    }

    // Add player to room
    await db.execute(`
      INSERT INTO room_players (room_id, user_id, joined_at, is_ready)
      VALUES (?, ?, NOW(), true)
    `, [roomId, userId]);

    // Get updated room data
    const [updatedRooms] = await db.execute(`
      SELECT 
        r.id,
        r.name,
        r.status,
        r.creator_id,
        COUNT(rp.id) as player_count
      FROM ludo_rooms r
      LEFT JOIN room_players rp ON r.id = rp.room_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [roomId]);

    const updatedRoom = updatedRooms[0];

    // Check if room is now full and should start
    if (updatedRoom.player_count === 4) {
      // Start the game automatically
      await db.execute(`
        UPDATE ludo_rooms 
        SET status = 'playing', started_at = NOW()
        WHERE id = ?
      `, [roomId]);

      // Emit game starting event
      if (req.app.get('io')) {
        req.app.get('io').emit('gameStarting', {
          roomId,
          room: updatedRoom
        });
      }

      // Award points to all players
      const [players] = await db.execute(`
        SELECT user_id, college_id FROM room_players WHERE room_id = ?
      `, [roomId]);

      for (const player of players) {
        // Award 10 points for joining a full room
        await db.execute(`
          INSERT INTO points_history (user_id, college_id, points, reason, created_at)
          VALUES (?, ?, 10, 'Joined Ludo room', NOW())
        `, [player.user_id, player.college_id]);

        // Update college points
        await db.execute(`
          UPDATE colleges 
          SET total_points = total_points + 10
          WHERE id = ?
        `, [player.college_id]);
      }
    }

    // Emit player joined event
    if (req.app.get('io')) {
      req.app.get('io').emit('playerJoined', {
        roomId,
        playerName: req.user.name,
        room: updatedRoom
      });
    }

    res.json({ 
      message: 'Joined room successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Leave a Ludo room
router.post('/:roomId/leave', verifyToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user.id;

    // Check if user is in the room
    const [player] = await db.execute(`
      SELECT rp.*, r.creator_id, r.status
      FROM room_players rp
      JOIN ludo_rooms r ON rp.room_id = r.id
      WHERE rp.room_id = ? AND rp.user_id = ?
    `, [roomId, userId]);

    if (player.length === 0) {
      return res.status(400).json({ message: 'You are not in this room' });
    }

    const playerData = player[0];

    // Remove player from room
    await db.execute(`
      DELETE FROM room_players WHERE room_id = ? AND user_id = ?
    `, [roomId, userId]);

    // If room becomes empty, delete it
    const [remainingPlayers] = await db.execute(`
      SELECT COUNT(*) as count FROM room_players WHERE room_id = ?
    `, [roomId]);

    if (remainingPlayers[0].count === 0) {
      await db.execute(`
        DELETE FROM ludo_rooms WHERE id = ?
      `, [roomId]);
    } else if (playerData.creator_id === userId) {
      // If creator leaves, transfer ownership to next player
      const [nextPlayer] = await db.execute(`
        SELECT user_id FROM room_players WHERE room_id = ? ORDER BY joined_at LIMIT 1
      `, [roomId]);

      if (nextPlayer.length > 0) {
        await db.execute(`
          UPDATE ludo_rooms SET creator_id = ? WHERE id = ?
        `, [nextPlayer[0].user_id, roomId]);
      }
    }

    // Emit player left event
    if (req.app.get('io')) {
      req.app.get('io').emit('playerLeft', {
        roomId,
        playerName: req.user.name
      });
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get room details
router.get('/:roomId', async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);

    const [rooms] = await db.execute(`
      SELECT 
        r.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        c.name as creator_college
      FROM ludo_rooms r
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE r.id = ?
    `, [roomId]);

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = rooms[0];

    // Get players
    const [players] = await db.execute(`
      SELECT 
        rp.user_id,
        rp.joined_at,
        rp.is_ready,
        u.name,
        u.avatar,
        c.name as college,
        c.id as college_id
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE rp.room_id = ?
      ORDER BY rp.joined_at
    `, [roomId]);

    const roomData = {
      ...room,
      players: players.map(player => ({
        id: player.user_id,
        name: player.name,
        avatar: player.avatar || '👤',
        college: player.college,
        collegeId: player.college_id,
        joinedAt: player.joined_at,
        isReady: player.is_ready
      })),
      creator: {
        id: room.creator_id,
        name: room.creator_name,
        avatar: room.creator_avatar || '👤',
        college: room.creator_college
      }
    };

    res.json({ room: roomData });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// End game and declare winner
router.post('/:roomId/end', verifyToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const { winnerId, scores } = req.body;

    // Update room status
    await db.execute(`
      UPDATE ludo_rooms 
      SET status = 'completed', ended_at = NOW(), winner_id = ?
      WHERE id = ?
    `, [winnerId, roomId]);

    // Award points to winner
    if (winnerId) {
      const [winner] = await db.execute(`
        SELECT user_id, college_id FROM room_players WHERE room_id = ? AND user_id = ?
      `, [roomId, winnerId]);

      if (winner.length > 0) {
        // Award 50 points for winning
        await db.execute(`
          INSERT INTO points_history (user_id, college_id, points, reason, created_at)
          VALUES (?, ?, 50, 'Won Ludo game', NOW())
        `, [winner[0].user_id, winner[0].college_id]);

        // Update college points
        await db.execute(`
          UPDATE colleges 
          SET total_points = total_points + 50
          WHERE id = ?
        `, [winner[0].college_id]);
      }
    }

    // Emit game ended event
    if (req.app.get('io')) {
      req.app.get('io').emit('gameEnded', {
        roomId,
        winnerId,
        scores
      });
    }

    res.json({ message: 'Game ended successfully' });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
