// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Login.jsx

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
// import api from '../services/api'; // <--- COMMENT OUT OR REMOVE THIS LINE for now

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // Get the login function from AuthContext

  // Pre-fill email if coming from successful registration
  useEffect(() => {
    if (location.state?.registrationSuccess && location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
      setError('Registration successful! Please log in.'); // Inform user
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // --- TEMPORARY MOCK LOGIN LOGIC ---
    try {
      console.log('Simulating login for:', formData.email);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Simulate a token. In a real app, you'd get this from the backend response.
      const simulatedToken = 'mock_jwt_token_12345';
      login(simulatedToken); // Use the login function from AuthContext

      console.log('Simulated login successful.');
      navigate('/dashboard', { replace: true }); // Navigate to dashboard on successful login

    } catch (err) {
      console.error('Simulated login error:', err);
      setError('Simulated login failed. (This should not happen)');
    } finally {
      setLoading(false);
    }
    // --- END TEMPORARY MOCK LOGIN LOGIC ---

    /*
    // --- ORIGINAL API CALL (KEEP THIS COMMENTED OUT FOR NOW) ---
    // try {
    //   const response = await api.login({
    //     email: formData.email,
    //     password: formData.password,
    //   });
    //   login(response.token); // Assuming backend returns { token: '...' }
    //   navigate('/dashboard', { replace: true });
    // } catch (err) {
    //   console.error('Login error:', err);
    //   setError(err.message || 'Login failed. Please check your credentials.');
    // } finally {
    //   setLoading(false);
    // }
    */
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center mb-8 text-gray-800">Sign In to Your Account</h2>

        {error && (
          <p className="text-red-600 text-center mb-4 text-sm bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6"> {/* Added space-y for consistent vertical spacing */}
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
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
              <label htmlFor="rememberMe" className="ml-2 text-gray-700">Remember me</label>
            </div>
            <button
              type="button" // Use type="button" to prevent form submission
              onClick={() => console.log('Navigate to Forgot Password page')} // Placeholder
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>Don't have an account?
            <button
              onClick={() => navigate('/register')}
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