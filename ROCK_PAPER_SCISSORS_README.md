# 🎯 Rock Paper Scissors Game

A new multiplayer Rock Paper Scissors game added to the AxomClash gaming platform. This game features multiple game modes, real-time multiplayer functionality, and a modern, responsive UI.

## ✨ Features

### 🎮 Game Modes
- **AI Mode**: Play against an AI opponent for instant practice
- **Friend Mode**: Create private rooms and invite friends
- **Random Match**: Find random opponents from your college

### 🏆 Game Features
- 5-round battles with score tracking
- Real-time multiplayer gameplay
- Beautiful animations and countdown timers
- Game history and statistics
- College-based matchmaking
- Points and rewards system

### 🎨 UI/UX Features
- Modern gradient design with glassmorphism effects
- Responsive design for all devices
- Smooth animations using Framer Motion
- Interactive game elements
- Real-time game state updates

## 🚀 Setup Instructions

### 1. Database Setup
Run the database setup script to create the required tables:

```bash
cd backend
node scripts/setupRPSDatabase.js
```

This will create the following tables:
- `rps_games` - Main game records
- `rps_game_participants` - Player participation details
- `rps_game_rounds` - Individual round results
- `rps_leaderboard` - College rankings
- `rps_user_stats` - User statistics

### 2. Backend Routes
The game uses the new `/api/rps` endpoint with the following routes:

- `POST /api/rps/create-room` - Create a new game room
- `POST /api/rps/join-room/:roomId` - Join an existing room
- `GET /api/rps/rooms` - Get available rooms
- `POST /api/rps/make-choice` - Submit player choice
- `POST /api/rps/start-game/:roomId` - Start the game
- `POST /api/rps/leave-room/:roomId` - Leave a room
- `GET /api/rps/history` - Get user's game history

### 3. Socket.IO Events
Real-time communication is handled through these socket events:

**Client to Server:**
- `rpsCreateRoom` - Create a new room
- `rpsJoinMatchmaking` - Join random matchmaking
- `rpsMakeChoice` - Submit game choice

**Server to Client:**
- `rpsRoomCreated` - Room creation confirmation
- `rpsOpponentJoined` - Opponent joined notification
- `rpsGameStart` - Game start signal
- `rpsGameResult` - Round result
- `rpsGameEnd` - Game completion

## 🎯 How to Play

### Game Rules
1. **Rock** beats **Scissors**
2. **Scissors** beats **Paper**
3. **Paper** beats **Rock**
4. Same choices result in a tie
5. Best of 5 rounds wins

### Game Flow
1. **Mode Selection**: Choose between AI, Friend, or Random Match
2. **Room Creation/Joining**: Create or join a game room
3. **Countdown**: 3-second countdown before each round
4. **Choice Selection**: Select Rock, Paper, or Scissors
5. **Result Display**: See the round result and updated scores
6. **Next Round**: Continue until 5 rounds are completed
7. **Final Results**: View final scores and game history

## 🛠️ Technical Implementation

### Frontend Components
- **RockPaperScissors.js**: Main game component
- **RockPaperScissors.css**: Game styling and animations

### Backend Architecture
- **Express.js** routes for HTTP endpoints
- **Socket.IO** for real-time communication
- **MySQL** database for game persistence
- **JWT** authentication for user verification

### State Management
- React hooks for local state
- Socket.IO for real-time updates
- Context API for user authentication

## 🎨 Customization

### Styling
The game uses CSS custom properties and can be easily customized:

```css
:root {
  --rps-primary-color: #9C27B0;
  --rps-secondary-color: #667eea;
  --rps-accent-color: #ffd700;
}
```

### Game Settings
Modify these constants in the component:

```javascript
const maxRounds = 5;        // Number of rounds per game
const countdownTime = 3;     // Countdown duration
const roundDelay = 3000;     // Delay between rounds
```

### Rewards System
Adjust point values in the Games.js configuration:

```javascript
{
  id: 'rockpaperscissors',
  reward: 75,  // Points earned for winning
  // ... other config
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if the backend server is running
   - Verify Socket.IO configuration
   - Check network connectivity

2. **Game Not Starting**
   - Ensure both players have joined the room
   - Check browser console for errors
   - Verify user authentication

3. **Database Errors**
   - Run the database setup script
   - Check database connection
   - Verify table structure

### Debug Mode
Enable debug logging by setting:

```javascript
const DEBUG_MODE = true;
```

This will log all socket events and game state changes to the console.

## 🚀 Future Enhancements

### Planned Features
- [ ] Tournament mode
- [ ] Advanced AI with learning
- [ ] Spectator mode
- [ ] Replay system
- [ ] Achievement system
- [ ] Social features (friend lists, challenges)

### Performance Optimizations
- [ ] Redis for room management
- [ ] WebSocket compression
- [ ] Lazy loading for game assets
- [ ] Service worker for offline support

## 📱 Mobile Support

The game is fully responsive and optimized for mobile devices:

- Touch-friendly controls
- Adaptive layouts
- Optimized animations
- Mobile-first design approach

## 🎯 Integration with Existing System

The Rock Paper Scissors game integrates seamlessly with the existing AxomClash platform:

- **User Authentication**: Uses existing auth system
- **College System**: College-based matchmaking
- **Points System**: Integrates with user points
- **Leaderboards**: College and user rankings
- **Navigation**: Integrated with main games section

## 📊 Analytics and Monitoring

The game includes built-in analytics:

- Game completion rates
- Player engagement metrics
- Win/loss statistics
- College performance tracking
- User behavior analysis

## 🤝 Contributing

To contribute to the Rock Paper Scissors game:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This game is part of the AxomClash platform and follows the same licensing terms.

## 🆘 Support

For support or questions about the Rock Paper Scissors game:

- Check the troubleshooting section
- Review the code comments
- Open an issue on GitHub
- Contact the development team

---

**Happy Gaming! 🎮✨**
