# 🏁 Ludo Race Game

## Overview
The Ludo Race game is a 4-player race-type mini game that replaces the previous Ludo Battle game. Players compete to be the first to get all 4 of their pieces to the finish line.

## Game Rules

### Objective
- Be the first player to get all 4 pieces to the finish line
- The game ends immediately when one player wins
- Other players lose regardless of their progress

### Gameplay
1. **Turn-based**: Players take turns rolling dice and moving pieces
2. **Starting**: A piece can only leave home when the player rolls a 6
3. **Movement**: After rolling, players choose which of their available pieces to move
4. **Path**: Pieces move around the main board path (52 positions)
5. **Finish**: Pieces enter their individual finish path when reaching the correct position
6. **Winning**: First player to get all 4 pieces to the finish line wins

### Piece States
- **Home**: Piece starts in home area, needs a 6 to leave
- **Path**: Piece is moving around the main board
- **Finish**: Piece is in the finish path (6 cells)
- **Finished**: Piece has reached the end of the finish path

### Special Rules
- Rolling a 6 gives an extra turn
- Consecutive sixes are tracked and displayed
- Safe spots on the board protect pieces from capture
- Pieces can capture opponents on non-safe spots

## Technical Implementation

### Frontend Components
- `LudoRaceGame.js` - Main game component
- `LudoRaceGame.css` - Game styling and animations

### Backend Routes
- `ludoRace.js` - API endpoints for room management
- Database tables for game state and history

### Socket Events
- `join-ludo-race-room` - Join a game room
- `ludoRaceUpdate` - Room state updates
- `ludoRacePlayerJoined` - Player join notifications

## Database Schema

### Tables
1. **ludo_race_rooms** - Game rooms and metadata
2. **room_players** - Players in each room
3. **ludo_race_games** - Game action history
4. **ludo_race_pieces** - Piece positions and states

## Setup Instructions

1. **Database Setup**:
   ```bash
   node backend/scripts/setupLudoRaceDatabase.js
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Game Flow

1. Player creates/joins a Ludo Race room
2. Room waits for 2-4 players
3. Game starts when ready
4. Players take turns rolling dice and moving pieces
5. Game ends when one player finishes all pieces
6. Winner is declared and game state saved

## Features

- ✅ 4-player multiplayer support
- ✅ Real-time game updates via WebSocket
- ✅ Responsive design for mobile and desktop
- ✅ Smooth animations and visual feedback
- ✅ Game history and progress tracking
- ✅ Automatic room creation and management
- ✅ College-based player identification

## Future Enhancements

- [ ] AI bots for single-player mode
- [ ] Tournament system
- [ ] Leaderboards and statistics
- [ ] Custom board themes
- [ ] Power-ups and special moves
- [ ] Spectator mode
- [ ] Replay system

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check database configuration
2. **Socket connection issues**: Verify WebSocket server is running
3. **Game not starting**: Ensure enough players have joined

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Contributing

When contributing to the Ludo Race game:
1. Follow the existing code style
2. Test thoroughly on different devices
3. Update this README for any new features
4. Ensure backward compatibility

## License

This game is part of the AxomClash project and follows the same licensing terms.
