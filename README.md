# 🏆 CampusClash - College vs College Social Gaming Platform

> **Represent Your College. Clash for Glory.**

CampusClash is a revolutionary social gaming platform that brings colleges together in friendly competition. Students can represent their institutions, play games, and build communities while earning points for themselves and their colleges.

## ✨ Features

### 🎯 Core Features
- **College vs College Battles** - Compete in various games
- **Points & Ranking System** - Earn points for yourself and your college
- **Real-time Chat** - Connect with fellow students in college chatrooms

- **Leaderboards** - Track college and individual performance
- **Multi-language Support** - English, Assamese, and Hindi

### 🎮 Gaming
- **Online Games** - Ludo, BGMI, Free Fire, Valorant rooms
- **Quiz Battles** - General knowledge, tech, and pop culture

- **Coding Battles** - Hackathon-style competitions
- **Special Events** - Fest mode with double points

### 🏫 College Community
- **Auto College Chat Join** - Instant access to your college's chatroom
- **College Spotlight** - Featured posts and achievements
- **Event Management** - Organize and participate in college events
- **Alliance System** - Small colleges can team up against bigger ones

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Framer Motion** - Smooth animations and transitions
- **Styled Components** - CSS-in-JS styling
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MySQL** - Relational database
- **Firebase Admin** - Authentication and file storage
- **JWT** - JSON Web Token authentication

### Database
- **MySQL** - Primary database with optimized schema
- **Connection Pooling** - Efficient database connections
- **Indexed Queries** - Fast data retrieval

## 📱 Screenshots

### Onboarding Flow
- Welcome screen with animated logo
- Language selection (EN/AS/HI)
- College search and selection
- Profile setup with validation
- Starter challenge completion

### Home Dashboard
- College rank board with top performers

- Community feed with posts
- Quick action buttons
- Real-time notifications

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Firebase project with service account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/campusclash.git
cd campusclash
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

### 3. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=axomclash_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url
```

#### Frontend (.env)
```bash
cd frontend
```

Create `.env` with:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup
```bash
# Start MySQL service
# On Windows: Start XAMPP or MySQL service
# On macOS: brew services start mysql
# On Linux: sudo systemctl start mysql

# Run database setup
npm run setup-db
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run server    # Backend on port 5000
npm run client    # Frontend on port 3000
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Colleges
- `GET /api/colleges` - List all colleges
- `GET /api/colleges/:id` - Get college details
- `GET /api/colleges/rankings` - Get college rankings

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Games
- `GET /api/games` - List active games
- `POST /api/games` - Create new game
- `POST /api/games/:id/join` - Join game
- `PUT /api/games/:id` - Update game state



## 🎨 Design System

### Color Palette
- **Primary Gradient**: Purple (#7B42F6) → Pink (#C86DD7)
- **Accent Colors**: Gold (#FFB800), Green (#34C759), Red (#FF3B30)
- **Backgrounds**: Light gradients with soft purple shades

### Typography
- **Primary Font**: Poppins (modern, rounded, friendly)
- **Number Font**: Montserrat Bold (for scores and rankings)

### UI Components
- Rounded corners (12px-16px)
- Drop shadows and glassmorphism effects
- Gradient buttons with hover animations
- Responsive grid layouts

## 🔧 Development

### Project Structure
```
campusclash/
├── backend/                 # Node.js backend
│   ├── config/             # Database, Firebase config
│   ├── routes/             # API route handlers
│   ├── scripts/            # Database setup scripts
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── styles/         # CSS files
│   │   └── App.js          # Main app component
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

### Available Scripts
```bash
npm run dev              # Start both servers
npm run server           # Start backend only
npm run client           # Start frontend only
npm run build            # Build frontend for production
npm run setup            # Complete setup (install + database)
npm run setup-db         # Setup database only
```

### Code Style
- **ESLint** configuration for consistent code style
- **Prettier** for code formatting
- **Component-based architecture** with hooks
- **Responsive design** for mobile-first approach

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use PM2 or similar process manager
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Configure environment variables
4. Set up custom domain

### Database Deployment
1. Use managed MySQL service (AWS RDS, Google Cloud SQL)
2. Configure connection pooling
3. Set up automated backups
4. Monitor performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure responsive design
- Test on multiple devices

## 📱 Mobile App

Future plans include:
- React Native mobile app
- Push notifications
- Offline support
- Native device features

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ User authentication and onboarding
- ✅ Basic college vs college system
- ✅ Points and ranking system
- ✅ Real-time chat

### Phase 2 (Next)
- 🚧 Advanced gaming features
- 🚧 AR filters and effects
- 🚧 Mini eSports tournaments
- 🚧 University partnerships

### Phase 3 (Future)
- 📋 AI-powered content moderation
- 📋 Advanced analytics dashboard
- 📋 International expansion
- 📋 Blockchain integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Framer Motion** - For smooth animations
- **Firebase** - For authentication and storage
- **MySQL** - For reliable database
- **College Communities** - For inspiration and feedback

## 📞 Support

- **Email**: support@campusclash.com
- **Discord**: [Join our community](https://discord.gg/campusclash)
- **Twitter**: [@CampusClash](https://twitter.com/CampusClash)
- **Documentation**: [docs.campusclash.com](https://docs.campusclash.com)

---

**Made with ❤️ for college communities everywhere**

*Represent Your College. Clash for Glory.* 🏆
