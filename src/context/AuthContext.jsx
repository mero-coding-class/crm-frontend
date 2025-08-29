import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the AuthContext. This is the actual context object that components will consume.
export const AuthContext = createContext(null);

// The AuthProvider component manages the authentication state and provides it to its children.
export const AuthProvider = ({ children }) => {
  // authToken state, initialized from localStorage to persist login across sessions.
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));

  // Function to handle user login. Stores the token and updates state.
  const login = (token) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
  };

  // Function to handle user logout. Removes the token and updates state.
  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
  };

  // useEffect to listen for changes in localStorage.
  // This is crucial for keeping authentication state in sync across different tabs/windows
  // of the same application. If one tab logs out, others will reflect this change.
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthToken(localStorage.getItem("authToken"));
    };
    // Attach the event listener for 'storage' events
    window.addEventListener("storage", handleStorageChange);
    // Cleanup function to remove the event listener when the component unmounts
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Provide the authToken, login, and logout functions to any component
  // that is a descendant of AuthProvider.
  return (
    <AuthContext.Provider value={{ authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook 'useAuth' to simplify consuming the AuthContext.
// Components can just call useAuth() instead of useContext(AuthContext).
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Optional: Add a check to ensure useAuth is used within an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
