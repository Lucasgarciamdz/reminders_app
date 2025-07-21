import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, logoutUser, clearAuth } from '../store/slices/authSlice';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Initialize auth state on app start
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        // Set token in API service
        apiService.setToken(storedToken);
        
        try {
          // Try to get current user to validate token
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Token is invalid, clear auth state
          dispatch(clearAuth());
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    // Listen for auth logout events (from API service)
    const handleAuthLogout = () => {
      dispatch(logoutUser());
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [dispatch]);

  const logout = () => {
    dispatch(logoutUser());
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};