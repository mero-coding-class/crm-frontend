import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios"; // Import axios for consistent API calls

// IMPORTANT: The "Could not resolve" error for this path indicates that
// the specified location of 'AuthContext.jsx' is incorrect RELATIVE TO THIS 'Login.jsx' file.
//
// Based on the error path: C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Login.jsx
// And the presumed location of AuthContext: C:/Users/aryal/Desktop/EDU_CRM/client/src/context/AuthContext.jsx
//
// The path "../context/AuthContext.jsx" is the standard and logically correct relative path:
// 1. ".." goes up one directory from 'pages/' to 'src/'.
// 2. "context/" then navigates into the 'context' folder.
// 3. "AuthContext.jsx" specifies the file.
//
// IF THIS ERROR PERSISTS, YOU MUST:
// 1. DOUBLE-CHECK THE EXACT SPELLING AND CASE (e.g., 'context' vs 'Context')
//    OF YOUR FOLDERS AND 'AuthContext.jsx' FILE ON YOUR SYSTEM.
// 2. CONFIRM THAT 'Login.jsx' IS INDEED IN 'src/pages/' and 'AuthContext.jsx' is in 'src/context/'.
// 3. If your 'client' directory is not the root, your build tool might have a different base.
//    However, for typical React setups, this relative path is correct.

import { useAuth } from "../context/AuthContext.jsx"; // Verify this path on your system!

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Use the useAuth hook to get the login function
  const { login } = useAuth();

  // Pre-fill username if coming from successful registration
  useEffect(() => {
    if (location.state?.registrationSuccess && location.state?.username) {
      setFormData((prev) => ({ ...prev, username: location.state.username }));
      // Inform user about successful registration, clear after some time
      setError("Registration successful! Please log in.");
      const timer = setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(
        // Using axios for API call
        "https://crmmerocodingbackend.ktm.yetiappcloud.com/api/auth/login/",
        {
          username: formData.username,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data; // Axios automatically parses JSON
      const token = data.key || data.token; // Backend might send 'key' or 'token'

      if (!token) {
        throw new Error("No token received from server.");
      }

      login(token); // Use the login function from AuthContext to store token and update state
      navigate("/dashboard", { replace: true }); // Navigate to dashboard on successful login
    } catch (err) {
      // Improved error handling for axios responses
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Login failed. Please check your credentials."
      );
      console.error("Login error:", err.response?.data || err.message); // Log detailed error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
          Sign In to Your Account
        </h2>

        {error && (
          <p className="text-red-600 text-center mb-4 text-sm bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-700">
                Remember me
              </label>
            </div>
            <button
              type="button" // Use type="button" to prevent form submission
              onClick={() => console.log("Navigate to Forgot Password page")} // Placeholder
              className="text-blue-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1 py-0.5"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>
            Don't have an account?
            <button
              onClick={() => navigate("/register")}
              disabled={loading}
              className="text-blue-600 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1 py-0.5"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
