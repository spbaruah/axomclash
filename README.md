# AxomClash - College Battle Games Platform

A comprehensive gaming platform for college students to compete in various multiplayer games.

## 🎮 Games Available

### Tic-Tac-Toe
- **Solo Mode**: Play against AI bot with two difficulty levels:
  - **Easy**: Random moves for beginners
  - **Hard**: Unbeatable AI using minimax algorithm
- **Online Mode**: 1v1 multiplayer battles with real-time gameplay
- **Features**:
  - Beautiful, responsive UI with smooth animations
  - Real-time game updates using Socket.IO
  - Automatic room creation and player matching
  - Game state management and history tracking

### Ludo Battle
- 4-player multiplayer game
- Automatic room creation and bot filling for testing
- Real-time dice rolling and piece movement

### Quiz Challenge
- Knowledge-based multiplayer competitions
- 2-4 players per game

### Snake Game
- Single-player classic snake gameplay

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- XAMPP or similar local server environment

### Backend Setup
```bash
cd backend
npm install
npm run setup-db
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Game Flow

### Tic-Tac-Toe Solo Mode
1. Click "Play Solo" from the mode selection screen
2. Choose difficulty level (Easy/Hard)
3. Play against AI bot with automatic turn switching
4. Game ends with Win/Lose/Draw message
5. Option to Play Again or start New Game

### Tic-Tac-Toe Online Mode
1. Click "Play Online" from the mode selection screen
2. System creates a private game room
3. Wait for opponent to join
4. Game starts automatically when two players are present
5. Players take turns until game completion
6. After game: Play Again or Exit options

## 🏗️ Architecture

### Backend
- **Express.js** server with Socket.IO for real-time communication
- **MySQL** database for user management and game data
- **Room-based** game management system
- **AI algorithms** for solo gameplay (minimax for unbeatable AI)

### Frontend
- **React.js** with hooks for state management
- **Socket.IO client** for real-time game updates
- **Responsive design** with modern CSS animations
- **Context API** for authentication and socket management

### Multi-Game Support
- Each game type has independent room management
- Dynamic room creation and cleanup
- Player matching and queue systems
- Scalable architecture for multiple concurrent games

## 🎯 Features

- **Real-time multiplayer**: Live game updates using WebSocket technology
- **AI opponents**: Intelligent bot players with configurable difficulty
- **Room management**: Automatic creation, joining, and cleanup
- **User authentication**: Secure login and profile management
- **Responsive design**: Works on desktop and mobile devices
- **Game history**: Track completed games and results

## 🔒 Security Features

- JWT-based authentication
- Rate limiting for API endpoints
- Input validation and sanitization
- Secure WebSocket connections

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly game controls
- Optimized for mobile gaming experience

## 🚀 Deployment

The platform is configured for deployment on Render with:
- Automatic database setup
- Environment variable management
- Production-ready configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**AxomClash** - Where college students battle for glory! 🏆
