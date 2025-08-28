import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // For potential future token validation or refresh

// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
  const [loading, setLoading] = useState(true); // To manage initial loading state
  const navigate = useNavigate();

  // Function to log in a user
  const login = useCallback((token) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    // You might want to navigate here, but it's often better to navigate from the login component itself
    // navigate('/dashboard', { replace: true }); 
  }, []);

  // Function to log out a user
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setIsAuthenticated(false);
    navigate('/login', { replace: true }); // Redirect to login page on logout
  }, [navigate]);

  // Effect to check token on initial load (optional, but good for persistence)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Optionally, you could make an API call here to validate the token with your backend
      // If validation fails, call logout()
      setAuthToken(token);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false); // Finished initial loading check
  }, []);

  // Provide the auth state and functions to children components
  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
