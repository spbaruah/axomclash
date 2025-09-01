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

// Get active games
router.get('/active', async (req, res) => {
  try {
    const [games] = await db.promise().execute(
      `SELECT g.*, 
              c1.name as college1_name, c1.logo_url as college1_logo,
              c2.name as college2_name, c2.logo_url as college2_logo
       FROM games g
       JOIN colleges c1 ON g.college1_id = c1.id
       JOIN colleges c2 ON g.college2_id = c2.id
       WHERE g.status IN ('waiting', 'active')
       ORDER BY g.created_at DESC`
    );

    res.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create a new game
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, type, college2_id, max_players, points_at_stake } = req.body;
    const userId = req.user.userId;
    const college1_id = req.user.college_id;

    const [result] = await db.promise().execute(
      `INSERT INTO games (name, type, college1_id, college2_id, max_players, points_at_stake) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, college1_id, college2_id, max_players, points_at_stake]
    );

    // Add creator as participant
    await db.promise().execute(
      `INSERT INTO game_participants (game_id, user_id, college_id, team_number) 
       VALUES (?, ?, ?, 1)`,
      [result.insertId, userId, college1_id]
    );

    res.status(201).json({ 
      message: 'Game created successfully', 
      gameId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join a game
router.post('/:gameId/join', verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.userId;
    const collegeId = req.user.college_id;

    // Check if game exists and is joinable
    const [games] = await db.promise().execute(
      'SELECT * FROM games WHERE id = ? AND status = "waiting"',
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found or not joinable' });
    }

    const game = games[0];

    // Determine team number
    const teamNumber = collegeId === game.college1_id ? 1 : 2;

    // Check if user already joined
    const [existingParticipant] = await db.promise().execute(
      'SELECT id FROM game_participants WHERE game_id = ? AND user_id = ?',
      [gameId, userId]
    );

    if (existingParticipant.length > 0) {
      return res.status(400).json({ error: 'Already joined this game' });
    }

    // Join game
    await db.promise().execute(
      `INSERT INTO game_participants (game_id, user_id, college_id, team_number) 
       VALUES (?, ?, ?, ?)`,
      [gameId, userId, collegeId, teamNumber]
    );

    // Update current players count
    await db.promise().execute(
      'UPDATE games SET current_players = current_players + 1 WHERE id = ?',
      [gameId]
    );

    // Check if game is ready to start
    if (game.current_players + 1 >= game.max_players) {
      await db.promise().execute(
        'UPDATE games SET status = "active" WHERE id = ?',
        [gameId]
      );
    }

    res.json({ message: 'Joined game successfully' });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Get game details
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const [games] = await db.promise().execute(
      `SELECT g.*, 
              c1.name as college1_name, c1.logo_url as college1_logo,
              c2.name as college2_name, c2.logo_url as college2_logo
       FROM games g
       JOIN colleges c1 ON g.college1_id = c1.id
       JOIN colleges c2 ON g.college2_id = c2.id
       WHERE g.id = ?`,
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get participants
    const [participants] = await db.promise().execute(
      `SELECT gp.*, u.username, u.profile_picture
       FROM game_participants gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_id = ?`,
      [gameId]
    );

    res.json({ 
      game: games[0],
      participants 
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Start a game
router.post('/:gameId/start', verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { gameData } = req.body;
    
    // Check if game exists and user is participant
    const [games] = await db.promise().execute(
      'SELECT * FROM games WHERE id = ? AND status = "waiting"',
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found or not in waiting status' });
    }

    const game = games[0];

    // Check if user is participant
    const [participants] = await db.promise().execute(
      'SELECT * FROM game_participants WHERE game_id = ? AND user_id = ?',
      [gameId, req.user.userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: 'Not a participant in this game' });
    }

    // Update game status and data
    await db.promise().execute(
      'UPDATE games SET status = "active", game_data = ? WHERE id = ?',
      [JSON.stringify(gameData), gameId]
    );

    res.json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Update game state
router.post('/:gameId/update', verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { gameData, action } = req.body;
    
    // Check if game exists and is active
    const [games] = await db.promise().execute(
      'SELECT * FROM games WHERE id = ? AND status = "active"',
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found or not active' });
    }

    // Update game data
    await db.promise().execute(
      'UPDATE games SET game_data = ? WHERE id = ?',
      [JSON.stringify(gameData), gameId]
    );

    res.json({ message: 'Game state updated successfully' });
  } catch (error) {
    console.error('Error updating game state:', error);
    res.status(500).json({ error: 'Failed to update game state' });
  }
});

// End a game
router.post('/:gameId/end', verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { winnerCollegeId, finalScores } = req.body;
    
    // Check if game exists
    const [games] = await db.promise().execute(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = games[0];

    // Update game status and winner
    await db.promise().execute(
      'UPDATE games SET status = "completed", winner_college_id = ? WHERE id = ?',
      [winnerCollegeId, gameId]
    );

    // Update participant scores
    if (finalScores && Array.isArray(finalScores)) {
      for (const score of finalScores) {
        await db.promise().execute(
          'UPDATE game_participants SET score = ? WHERE game_id = ? AND user_id = ?',
          [score.score, gameId, score.userId]
        );
      }
    }

    // Award points to winner college
    if (winnerCollegeId) {
      await db.promise().execute(
        'UPDATE colleges SET total_points = total_points + ? WHERE id = ?',
        [game.points_at_stake, winnerCollegeId]
      );
    }



    res.json({ message: 'Game ended successfully' });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Test endpoint to verify routing
router.get('/test', (req, res) => {
  console.log('🎮 Test endpoint accessed');
  res.json({ message: 'Games route is working!', timestamp: new Date().toISOString() });
});

// Get user's game history
router.get('/history', verifyToken, async (req, res) => {
  console.log('🎮 Game history endpoint accessed for user:', req.user.userId);
  try {
    const userId = req.user.userId;
    
    // Get games from main games table
    const [mainGames] = await db.promise().execute(
      `SELECT g.*, 
              c1.name as college1_name, c1.logo_url as college1_logo,
              c2.name as college2_name, c2.logo_url as college2_logo,
              gp.team_number, gp.points_earned,
              'main' as game_source
       FROM games g
       JOIN colleges c1 ON g.college1_id = c1.id
       JOIN colleges c2 ON g.college2_id = c2.id
       JOIN game_participants gp ON g.id = gp.game_id
       WHERE gp.user_id = ? AND g.status = 'completed'
       ORDER BY g.updated_at DESC`,
      [userId]
    );

    // Get Ludo Race games
    const [ludoGames] = await db.promise().execute(
      `SELECT lr.*, 
              'ludo_race' as game_source,
              'Ludo Race' as game_name,
              'ludo' as game_type
       FROM ludo_race_rooms lr
       JOIN room_players rp ON lr.id = rp.room_id
       WHERE rp.user_id = ? AND lr.status = 'finished'
       ORDER BY lr.ended_at DESC`,
      [userId]
    );

    // Get RPS games
    const [rpsGames] = await db.promise().execute(
      `SELECT rg.*, 
              'rps' as game_source,
              'Rock Paper Scissors' as game_name,
              'rps' as game_type
       FROM rps_games rg
       WHERE JSON_CONTAINS(rg.players, ?, '$.userId') AND rg.status = 'finished'
       ORDER BY rg.updated_at DESC`,
      [JSON.stringify({ userId: parseInt(userId) })]
    );

    // Combine and format all games
    const allGames = [
      ...mainGames.map(game => ({
        ...game,
        game_date: game.updated_at,
        result: game.winner_college_id === game.college1_id ? 
          (game.team_number === 1 ? 'Won' : 'Lost') :
          (game.team_number === 2 ? 'Won' : 'Lost')
      })),
      ...ludoGames.map(game => ({
        ...game,
        game_date: game.ended_at,
        result: game.winner_id === parseInt(userId) ? 'Won' : 'Lost',
        points_at_stake: game.points_at_stake || 150
      })),
      ...rpsGames.map(game => ({
        ...game,
        game_date: game.updated_at,
        result: game.winner_id === parseInt(userId) ? 'Won' : 'Lost',
        points_at_stake: game.points_at_stake || 75
      }))
    ];

    // Sort by date (most recent first)
    allGames.sort((a, b) => new Date(b.game_date) - new Date(a.game_date));

    res.json({ 
      success: true, 
      games: allGames,
      total: allGames.length
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

module.exports = router;
