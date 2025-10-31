// frontend/src/contexts/AuthContext.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (tokenData, userData) => {
    // Handle both full user object and just the user data
    const userToStore = userData.id ? userData : {
      id: userData._id || userData.id,
      email: userData.email,
      name: userData.name,
      dietary_preferences: userData.dietary_preferences || [],
      allergies: userData.allergies || [],
      health_goals: userData.health_goals || [],
    };

    setToken(tokenData);
    setUser(userToStore);
    setIsAuthenticated(true);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userToStore));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Add updateUser function to update user data without re-authentication
  const updateUser = (userData) => {
    const updatedUser = {
      ...user,
      ...userData,
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      token, 
      login, 
      logout, 
      updateUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};