import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/axios';
import toast from 'react-hot-toast';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkInitialAuth = () => {
      // Check for admin authentication first
      const adminToken = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');
      
      if (adminToken && adminData) {
        try {
          const parsedAdminData = JSON.parse(adminData);
          if (parsedAdminData && parsedAdminData.isAdmin) {
            // User is logged in as admin - don't set regular user state
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing admin data:', error);
          // Clear invalid admin data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          localStorage.removeItem('isAdmin');
        }
      }
      
      // Check for regular user authentication
      const token = localStorage.getItem('authToken');
      if (token) {
        checkAuthStatus(token);
      } else {
        setLoading(false);
      }
    };
    
    checkInitialAuth();
  }, []);

  const checkAuthStatus = async (token) => {
    try {
      // Check if it's an admin token first
      const adminToken = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');
      
      if (adminToken && adminData) {
        try {
          const parsedAdminData = JSON.parse(adminData);
          if (parsedAdminData && parsedAdminData.isAdmin) {
            // User is logged in as admin - don't set regular user state
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing admin data:', error);
          // Clear invalid admin data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          localStorage.removeItem('isAdmin');
        }
      }
      
      // Regular user authentication
      const response = await api.get('/api/auth/profile');
      
      setUser(response.data.user);
      setUserProfile(response.data.user);
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('user');
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const registerUser = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      
      const { user, token } = response.data;
      setUser(user);
      setUserProfile(user);
      localStorage.setItem('authToken', token);
      
      toast.success('Profile created successfully!');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Login user
  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      const { user, token, isAdmin } = response.data;
      
      if (isAdmin) {
        // Admin login - store admin credentials separately
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(user));
        localStorage.setItem('isAdmin', 'true');
        
        // Clear regular user tokens and state
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setUserProfile(null);
        
        toast.success('Admin login successful!');
        return response.data;
      } else {
        // Regular user login
        setUser(user);
        setUserProfile(user);
        localStorage.setItem('authToken', token);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        
        toast.success('Login successful!');
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const token = localStorage.getItem('authToken');
      await api.put('/api/auth/profile', updates);
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
      setUser(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.error || 'Update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Upload/Update cover photo
  const uploadCoverPhoto = async (file) => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('cover', file);

      const response = await api.put('/api/auth/cover', formData);

      const { cover_photo } = response.data;
      setUserProfile(prev => ({ ...prev, cover_photo }));
      setUser(prev => ({ ...prev, cover_photo }));
      toast.success('Cover photo updated!');
      return cover_photo;
    } catch (error) {
      console.error('Cover upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload cover photo';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteCoverPhoto = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await api.delete('/api/auth/cover');
      setUserProfile(prev => ({ ...prev, cover_photo: null }));
      setUser(prev => ({ ...prev, cover_photo: null }));
      toast.success('Cover photo removed');
    } catch (error) {
      console.error('Cover delete error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete cover photo';
      toast.error(errorMessage);
      throw error;
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/api/auth/profile-picture', formData);

      const { profile_picture } = response.data;
      setUserProfile(prev => ({ ...prev, profile_picture }));
      setUser(prev => ({ ...prev, profile_picture }));
      toast.success('Profile photo updated!');
      return profile_picture;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await api.delete('/api/auth/profile-picture');
      setUserProfile(prev => ({ ...prev, profile_picture: null }));
      setUser(prev => ({ ...prev, profile_picture: null }));
      toast.success('Profile photo removed');
    } catch (error) {
      console.error('Profile picture delete error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete profile picture';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user states
      setUser(null);
      setUserProfile(null);
      
      // Clear all localStorage items
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('user');
      
      toast.success('Signed out successfully');
    }
  };

  // Get auth token for API calls
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('authToken');
  }, []);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = useCallback(() => {
    return userProfile && userProfile.username && userProfile.college_id;
  }, [userProfile]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    // Check if user is explicitly marked as admin in their profile
    if (userProfile && userProfile.isAdmin === true) {
      return true;
    }
    
    // Check if user is logged in as admin through adminToken
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (adminToken && adminData) {
      try {
        const parsedAdminData = JSON.parse(adminData);
        return parsedAdminData && parsedAdminData.isAdmin === true;
      } catch (error) {
        console.error('Error parsing admin data:', error);
        return false;
      }
    }
    
    return false;
  }, [userProfile]);

  const value = {
    user,
    userProfile,
    loading,
    registerUser,
    loginUser,
    updateProfile,
    uploadCoverPhoto,
    deleteCoverPhoto,
    uploadProfilePicture,
    deleteProfilePicture,
    signOut,
    getAuthToken,
    hasCompletedOnboarding,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
