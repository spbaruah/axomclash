import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasShownConnectionMessage, setHasShownConnectionMessage] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isInitialConnection = useRef(true);

  useEffect(() => {
    if (userProfile) {
      console.log('Initializing socket connection for user:', userProfile.id);
      
      // Reset connection state for new user
      setIsConnected(false);
      setHasShownConnectionMessage(false);
      reconnectAttempts.current = 0;
      isInitialConnection.current = true;
      
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          userId: userProfile.id,
          collegeId: userProfile.college_id
        },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join college room
        newSocket.emit('join-college', userProfile.college_id);
        
        // Only show connection message if this is a reconnection after disconnection
        if (hasShownConnectionMessage && !isInitialConnection.current) {
          toast.success('Reconnected to real-time updates');
        }
        
        isInitialConnection.current = false;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Only show disconnection message if it's not a normal page refresh or initial connection
        if (reason !== 'io client disconnect' && 
            reason !== 'io server disconnect' && 
            !isInitialConnection.current) {
          console.log('Showing disconnection toast for reason:', reason);
          toast.error('Lost connection to server');
          setHasShownConnectionMessage(true);
        } else {
          console.log('Not showing disconnection toast for reason:', reason);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts.current += 1;
        
        // Only show error message after multiple failed attempts and not during initial connection
        if (reconnectAttempts.current >= maxReconnectAttempts && !isInitialConnection.current) {
          toast.error('Failed to connect to server. Please refresh the page.');
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        if (hasShownConnectionMessage) {
          toast.success('Reconnected to real-time updates');
        }
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt:', attemptNumber);
      });

      newSocket.on('reconnect_failed', () => {
        console.log('Socket reconnection failed');
        if (!isInitialConnection.current) {
          toast.error('Unable to reconnect. Please refresh the page.');
        }
      });

      // Game events
      newSocket.on('game-state-update', (data) => {
        console.log('Game state update:', data);
        // Handle game state updates
      });

      // Chat events
      newSocket.on('new-message', (data) => {
        console.log('New message:', data);
        // Handle new chat messages
        toast.success(`New message from ${data.username}`);
      });

      // Challenge events
      newSocket.on('challenge-update', (data) => {
        console.log('Challenge update:', data);
        // Handle challenge updates
      });

      // College events
      newSocket.on('college-rank-update', (data) => {
        console.log('College rank update:', data);
        // Handle college ranking updates
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        console.log('Cleaning up socket connection');
        if (newSocket) {
          newSocket.close();
        }
      };
    } else {
      console.log('No user profile, cleaning up socket');
      // Clean up socket when no user profile
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setIsConnected(false);
      setHasShownConnectionMessage(false);
    }
  }, [userProfile, hasShownConnectionMessage, socket]);

  // Socket utility functions
  const joinGame = (gameId) => {
    if (socket && isConnected) {
      socket.emit('join-game', gameId);
    }
  };

  const leaveGame = (gameId) => {
    if (socket && isConnected) {
      socket.emit('leave-game', gameId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    }
  };

  const updateGameState = (gameData) => {
    if (socket && isConnected) {
      socket.emit('game-update', gameData);
    }
  };

  const joinChallenge = (challengeId) => {
    if (socket && isConnected) {
      socket.emit('join-challenge', challengeId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinGame,
    leaveGame,
    sendMessage,
    updateGameState,
    joinChallenge
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
