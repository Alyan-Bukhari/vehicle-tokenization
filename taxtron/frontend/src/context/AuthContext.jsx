import React, { createContext, useContext, useState, useEffect } from 'react';
import {hasSession} from '../utils/session';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasSession('admin'));

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const sync = () => setIsLoggedIn(hasSession('admin'));
    window.addEventListener('storage', sync);
    window.addEventListener('session-expired', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('session-expired', sync);
    };
  }, []);

  const login = () => {
    // Don't overwrite the token - it should already be set by the login component
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  const value = {
    isLoggedIn,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
