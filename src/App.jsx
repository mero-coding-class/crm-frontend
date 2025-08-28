import React, { useState, createContext, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- MOCK COMPONENTS FOR COMPILATION ---
// IMPORTANT: You MUST replace these with your actual components from your project
// once your project structure is correctly set up.
const MainLayout = ({ children }) => (
  <div
    style={{
      padding: "20px",
      border: "1px solid #ccc",
      margin: "10px",
      borderRadius: "8px",
    }}
  >
    <h3 style={{ color: "#333" }}>Mock MainLayout</h3>
    {children}
  </div>
);
const Dashboard = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#e0ffe0", borderRadius: "4px" }}
  >
    Mock Dashboard Content
  </div>
);
const Leads = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#e0f0ff", borderRadius: "4px" }}
  >
    Mock Leads Page Content
  </div>
);
const EnrolledStudents = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#ffffe0", borderRadius: "4px" }}
  >
    Mock Enrolled Students Page Content
  </div>
);
const TrashPage = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#ffe0e0", borderRadius: "4px" }}
  >
    Mock Trash Page Content
  </div>
);
const Login = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#f0e0ff", borderRadius: "4px" }}
  >
    Mock Login Page Content
  </div>
);
const Reports = () => (
  <div
    style={{ padding: "10px", backgroundColor: "#eff0e0", borderRadius: "4px" }}
  >
    Mock Reports Page Content
  </div>
);
// --- END MOCK COMPONENTS ---

// Create AuthContext
export const AuthContext = createContext(null);

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  ); // Initialize with token presence
  const [loading, setLoading] = useState(true); // Manages initial token check loading

  // Function to log in a user, wrapped in useCallback for performance
  const login = useCallback((token) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
    setIsAuthenticated(true);
  }, []);

  // Function to log out a user, wrapped in useCallback for performance
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setIsAuthenticated(false);
    // Optionally navigate to login here, but typically done by protected routes
  }, []);

  // Effect to check token on initial load and set authentication state
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // You can optionally add logic here to validate the token with your backend
      // if (isValid(token)) { // e.g., check token expiration or make an API call
      setAuthToken(token);
      setIsAuthenticated(true);
      // } else {
      //   logout(); // Log out if token is invalid or expired
      // }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false); // Authentication check is complete
  }, [logout]); // Include logout in dependencies if it's used within the effect

  // Show a loading spinner or screen while the authentication state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ authToken, isAuthenticated, login, logout, loading }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protected routes */}
          <Route
            element={
              isAuthenticated ? <MainLayout /> : <Navigate to="/login" />
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/enrolled-students" element={<EnrolledStudents />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
