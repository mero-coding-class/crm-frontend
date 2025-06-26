// C:/Users/aryal/Desktop/EDU_CRM/client/src/App.jsx

import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import Register from './pages/Register';
import OTPConfirm from './pages/OTPConfirm';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from "./pages/Leads";

// Import Layout
import MainLayout from './layouts/MainLayout';
import EnrolledStudents from "./pages/EnrolledStudents";
import AddLeadModal from "./components/AddLeadModal";

// Create Auth Context
export const AuthContext = createContext(null);

const App = () => {
  // Initialize authToken from localStorage
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));

  // Effect to manage localStorage when authToken changes
  useEffect(() => {
    if (authToken) {
      localStorage.setItem("authToken", authToken);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [authToken]);

  const login = (token) => {
    setAuthToken(token);
  };

  const logout = () => {
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ authToken, login, logout }}>
      <Router>
        <Routes>
          {/* Public Routes - Accessible without authentication */}
          <Route path="/register" element={<Register />} />
          <Route path="/otp-confirm" element={<OTPConfirm />} />
          <Route path="/login" element={<Login />} />

          {/* Private Routes - Require authentication */}
          <Route
            path="/"
            element={
              authToken ? <MainLayout /> : <Navigate to="/login" replace />
            }
          >
            {/* Nested routes for authenticated users within MainLayout */}
            {/* The 'element' of the parent route (MainLayout) will render the <Outlet> for these children */}
            <Route index element={<Dashboard />} />{" "}
            {/* Default route for "/" when logged in */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="enrolled-students" element={<EnrolledStudents />} />
            <Route path="add-leads" element={<AddLeadModal />} />
            {/* Add more private routes here */}
          </Route>

          {/* Fallback for unmatched routes */}
          <Route
            path="*"
            element={
              <Navigate to={authToken ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;