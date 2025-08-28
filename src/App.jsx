import React, { useState, createContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import EnrolledStudents from "./pages/EnrolledStudents"; // Assuming you have this
import TrashPage from "./pages/TrashPage";
import Login from "./pages/Login";
import Reports from "./pages/Reports";

// Create AuthContext
export const AuthContext = createContext(null);

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));

  const login = (token) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ authToken, login, logout }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protected routes */}
          <Route
            element={authToken ? <MainLayout /> : <Navigate to="/login" />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/enrolled-students" element={<EnrolledStudents />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
            <Route path="report" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
