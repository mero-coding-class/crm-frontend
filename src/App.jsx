import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


import { AuthContext, AuthProvider } from "./context/AuthContext.jsx"; // Adjusted path to assume App.js is in src/
import MainLayout from "./layouts/MainLayout"; // Adjusted path to assume App.js is in src/
import Dashboard from "./pages/Dashboard"; // Adjusted path to assume App.js is in src/
import Leads from "./pages/Leads"; // Adjusted path to assume App.js is in src/
import EnrolledStudents from "./pages/EnrolledStudents"; // Adjusted path to assume App.js is in src/
import TrashPage from "./pages/TrashPage"; // Adjusted path to assume App.js is in src/
import Login from "./pages/Login"; // Adjusted path to assume App.js is in src/
import Reports from "./pages/Reports"; // Adjusted path to assume App.js is in src/
import Register from "./pages/Register"; // Adjusted path to assume App.js is in src/
import CreateCourse from "./pages/CreateCourse"; // Adjusted path to assume App.js is in src/
import Settings from "./pages/Settings";
import Downloads from "./pages/Downloads";
function AppContent() {
  const { authToken } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Public route for login */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        {/* If authToken exists, render MainLayout and its children; otherwise, redirect to login */}
        <Route
          element={
            authToken ? <MainLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/enrolled-students" element={<EnrolledStudents />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/report" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/downloads" element={<Downloads />} />
          {/* Catch-all route within the protected area, redirects to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          {/* Legacy direct routes removed in favor of Settings */}
        </Route>

        {/* Fallback for unauthenticated users trying to access any route directly that isn't /login */}
        {/* This ensures that if no other route matches and there's no token, they go to login */}
        {!authToken && (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
