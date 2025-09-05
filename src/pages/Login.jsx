import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

// Adjust if you have BASE_URL in config
const API_BASE = "https://crmmerocodingbackend.ktm.yetiappcloud.com/api";

async function fetchUserProfile(token, fallbackUsername) {
  const headers = { Authorization: `Token ${token}` };
  // Try /users/me/
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/`, { headers });
    return data; // { id, username, email, role }
  } catch (_) {}

  // Try /auth/user/
  try {
    const { data } = await axios.get(`${API_BASE}/auth/user/`, { headers });
    return data;
  } catch (_) {}

  // Fallback: /users/ (list) and match by username
  try {
    const { data } = await axios.get(`${API_BASE}/users/`, { headers });
    if (Array.isArray(data)) {
      const found =
        data.find((u) => u?.username === fallbackUsername) ?? data[0] ?? null;
      return found;
    }
    return data;
  } catch (_) {
    return { username: fallbackUsername }; // last resort
  }
}

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

  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.registrationSuccess && location.state?.username) {
      setFormData((prev) => ({ ...prev, username: location.state.username }));
      setError("Registration successful! Please log in.");
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
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
      // 1) Login to get token
      const { data } = await axios.post(
        `${API_BASE}/auth/login/`,
        {
          username: formData.username,
          password: formData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = data.key || data.token;
      if (!token) throw new Error("No token received from server.");

      // 2) Fetch profile (username + role)
      const me = await fetchUserProfile(token, formData.username);

      // 3) Persist token in context (existing behavior)
      //    If your AuthContext.login accepts only token, this is fine.
      //    (Your MainLayout reads username/role from localStorage too.)
      login(token);

      // 4) Save username/role so MainLayout can display them
      if (me?.username) localStorage.setItem("username", me.username);
      if (me?.role) localStorage.setItem("role", me.role);
      // optional: id/email
      if (me?.id) localStorage.setItem("userId", String(me.id));
      if (me?.email !== undefined)
        localStorage.setItem("email", me.email || "");

      // 5) Go to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Login failed. Please check your credentials."
      );
      console.error("Login error:", err.response?.data || err.message);
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
              type="button"
              onClick={() => console.log("Navigate to Forgot Password page")}
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
            Don&apos;t have an account?
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
