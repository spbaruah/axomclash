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
      'SELECT id, full_name, email, college_id, profile_picture FROM users WHERE id = ?',
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

// Get all Ludo Race rooms
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
        u.full_name as creator_name,
        u.profile_picture as creator_avatar,
        c.name as creator_college,
        COUNT(rp.id) as player_count
      FROM ludo_race_rooms r
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
            u.full_name,
            u.profile_picture,
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
            name: player.full_name,
            avatar: player.profile_picture || '👤',
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
    console.error('Error fetching Ludo Race rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new Ludo Race room
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, max_players = 4, points_at_stake = 150 } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Create room
    const [roomResult] = await db.execute(`
      INSERT INTO ludo_race_rooms (name, creator_id, max_players, points_at_stake, status, created_at)
      VALUES (?, ?, ?, ?, 'waiting', NOW())
    `, [name, req.user.id, max_players, points_at_stake]);

    const roomId = roomResult.insertId;

    // Add creator as first player
    await db.execute(`
      INSERT INTO room_players (room_id, user_id, joined_at, is_ready)
      VALUES (?, ?, NOW(), true)
    `, [roomId, req.user.id]);

    // Get created room with player info
    const [roomData] = await db.execute(`
      SELECT 
        r.*,
        u.full_name as creator_name,
        u.profile_picture as creator_avatar,
        c.name as creator_college
      FROM ludo_race_rooms r
      JOIN users u ON r.creator_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE r.id = ?
    `, [roomId]);

    const room = {
      ...roomData[0],
      players: [{
        id: req.user.id,
        name: req.user.full_name,
        avatar: req.user.profile_picture || '👤',
        college: roomData[0].creator_college,
        collegeId: req.user.college_id,
        joinedAt: new Date(),
        isReady: true
      }]
    };

    res.status(201).json({ 
      message: 'Ludo Race room created successfully',
      room 
    });
  } catch (error) {
    console.error('Error creating Ludo Race room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Join a Ludo Race room
router.post('/:roomId/join', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if room exists and has space
    const [roomData] = await db.execute(`
      SELECT r.*, COUNT(rp.id) as current_players
      FROM ludo_race_rooms r
      LEFT JOIN room_players rp ON r.id = rp.room_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [roomId]);

    if (roomData.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomData[0];
    
    if (room.status !== 'waiting') {
      return res.status(400).json({ message: 'Room is not accepting players' });
    }

    if (room.current_players >= room.max_players) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Check if user is already in the room
    const [existingPlayer] = await db.execute(`
      SELECT id FROM room_players WHERE room_id = ? AND user_id = ?
    `, [roomId, req.user.id]);

    if (existingPlayer.length > 0) {
      return res.status(400).json({ message: 'Already in this room' });
    }

    // Add player to room
    await db.execute(`
      INSERT INTO room_players (room_id, user_id, joined_at, is_ready)
      VALUES (?, ?, NOW(), true)
    `, [roomId, req.user.id]);

    // Get updated room info
    const [updatedRoom] = await db.execute(`
      SELECT 
        r.*,
        u.full_name as creator_name,
        u.profile_picture as creator_avatar,
        c.name as creator_college
      FROM ludo_race_rooms r
      JOIN users u ON r.creator_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE r.id = ?
    `, [roomId]);

    const [players] = await db.execute(`
      SELECT 
        rp.id,
        rp.user_id,
        rp.joined_at,
        rp.is_ready,
        u.full_name,
        u.profile_picture,
        c.name as college,
        c.id as college_id
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE rp.room_id = ?
      ORDER BY rp.joined_at
    `, [roomId]);

    const updatedRoomData = {
      ...updatedRoom[0],
      players: players.map(player => ({
        id: player.user_id,
        name: player.full_name,
        avatar: player.profile_picture || '👤',
        college: player.college,
        collegeId: player.college_id,
        joinedAt: player.joined_at,
        isReady: player.is_ready
      }))
    };

    res.json({ 
      message: 'Joined room successfully',
      room: updatedRoomData 
    });
  } catch (error) {
    console.error('Error joining Ludo Race room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Leave a Ludo Race room
router.post('/:roomId/leave', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Remove player from room
    const [result] = await db.execute(`
      DELETE FROM room_players WHERE room_id = ? AND user_id = ?
    `, [roomId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Not in this room' });
    }

    // Check if room is now empty
    const [remainingPlayers] = await db.execute(`
      SELECT COUNT(*) as count FROM room_players WHERE room_id = ?
    `, [roomId]);

    if (remainingPlayers[0].count === 0) {
      // Delete empty room
      await db.execute(`
        DELETE FROM ludo_race_rooms WHERE id = ?
      `, [roomId]);
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving Ludo Race room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get room details
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const [roomData] = await db.execute(`
      SELECT 
        r.*,
        u.full_name as creator_name,
        u.profile_picture as creator_avatar,
        c.name as creator_college
      FROM ludo_race_rooms r
      JOIN users u ON r.creator_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE r.id = ?
    `, [roomId]);

    if (roomData.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const [players] = await db.execute(`
      SELECT 
        rp.id,
        rp.user_id,
        rp.joined_at,
        rp.is_ready,
        u.full_name,
        u.profile_picture,
        c.name as college,
        c.id as college_id
      FROM room_players rp
      JOIN users u ON rp.user_id = u.id
      JOIN colleges c ON u.college_id = c.id
      WHERE rp.room_id = ?
      ORDER BY rp.joined_at
    `, [roomId]);

    const room = {
      ...roomData[0],
      players: players.map(player => ({
        id: player.user_id,
        name: player.full_name,
        avatar: player.profile_picture || '👤',
        college: player.college,
        collegeId: player.college_id,
        joinedAt: player.joined_at,
        isReady: player.is_ready
      }))
    };

    res.json({ room });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start Ludo Race game
router.post('/:roomId/start', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if user is room creator
    const [roomData] = await db.execute(`
      SELECT creator_id, status FROM ludo_race_rooms WHERE id = ?
    `, [roomId]);

    if (roomData.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (roomData[0].creator_id !== req.user.id) {
      return res.status(403).json({ message: 'Only room creator can start the game' });
    }

    if (roomData[0].status !== 'waiting') {
      return res.status(400).json({ message: 'Game already started' });
    }

    // Check if enough players
    const [playerCount] = await db.execute(`
      SELECT COUNT(*) as count FROM room_players WHERE room_id = ?
    `, [roomId]);

    if (playerCount[0].count < 2) {
      return res.status(400).json({ message: 'Need at least 2 players to start' });
    }

    // Update room status
    await db.execute(`
      UPDATE ludo_race_rooms SET status = 'playing', started_at = NOW() WHERE id = ?
    `, [roomId]);

    res.json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting Ludo Race game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
