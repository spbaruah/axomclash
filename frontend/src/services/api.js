export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper function to make authenticated API requests
const authenticatedRequest = async (endpoint, options = {}, token) => {
  const authToken = token || localStorage.getItem('authToken');
  if (!authToken) {
    throw new Error('No authentication token found');
  }

  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  });
};

// User API functions
export const getUsers = async () => {
  return apiRequest('/api/users');
};

export const createUser = async (userData) => {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const getUserById = async (userId) => {
  return apiRequest(`/api/users/${userId}`);
};

export const updateUser = async (userId, userData) => {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (userId) => {
  return apiRequest(`/api/users/${userId}`, {
    method: 'DELETE',
  });
};

// Game API functions
export const getGames = async () => {
  return apiRequest('/api/games');
};

export const createGame = async (gameData) => {
  return apiRequest('/api/games', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
};

export const getGameById = async (gameId) => {
  return apiRequest(`/api/games/${gameId}`);
};

export const updateGame = async (gameId, gameData) => {
  return apiRequest(`/api/games/${gameId}`, {
    method: 'PUT',
    body: JSON.stringify(gameData),
  });
};

export const deleteGame = async (gameId) => {
  return apiRequest(`/api/games/${gameId}`, {
    method: 'DELETE',
  });
};

// Match API functions
export const getMatches = async () => {
  return apiRequest('/api/matches');
};

export const createMatch = async (matchData) => {
  return apiRequest('/api/matches', {
    method: 'POST',
    body: JSON.stringify(matchData),
  });
};

export const getMatchById = async (matchId) => {
  return apiRequest(`/api/matches/${matchId}`);
};

export const updateMatch = async (matchId, matchData) => {
  return apiRequest(`/api/matches/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify(matchData),
  });
};

export const deleteMatch = async (matchId) => {
  return apiRequest(`/api/matches/${matchId}`, {
    method: 'DELETE',
  });
};

// Authentication API functions
export const login = async (credentials) => {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const register = async (userData) => {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logout = async () => {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
  });
};

// Profile API functions
export const getProfile = async () => {
  return apiRequest('/api/profile');
};

export const updateProfile = async (profileData) => {
  return apiRequest('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Points and Rewards API functions
export const getUserPoints = async (token) => {
  return authenticatedRequest('/api/user/points', {}, token);
};

export const getPointsHistory = async (token) => {
  return authenticatedRequest('/api/users/points/history', {}, token);
};

export const getCollegeRankings = async () => {
  return apiRequest('/api/colleges/rankings');
};

export const getUserRankings = async () => {
  return apiRequest('/api/users/leaderboard/top?limit=50');
};

// Update user points
export const updateUserPoints = async (points, token) => {
  return authenticatedRequest('/api/user/points', {
    method: 'PUT',
    body: JSON.stringify({ points })
  }, token);
};

// Get user's game history
export const getGameHistory = async (token) => {
  return authenticatedRequest('/api/games/history', {}, token);
};
