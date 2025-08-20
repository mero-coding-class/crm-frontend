// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/Register.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import api from '../services/api'; // <--- COMMENT OUT OR REMOVE THIS LINE for now

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // --- TEMPORARY MOCK REGISTRATION LOGIC ---
    try {
      console.log('Simulating registration for:', formData.email);
      // Simulate an asynchronous operation (like an API call)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

      // Simulate a successful response
      console.log('Simulated registration successful.');

      // Instead of calling api.register, we directly navigate
      navigate('/confirm-otp', { state: { email: formData.email } });

    } catch (err) {
      // This catch block might not be hit if no actual API call is made
      console.error('Simulated registration error:', err);
      setError('Simulated registration failed. (This should not happen)');
    } finally {
      setLoading(false);
    }
    // --- END TEMPORARY MOCK REGISTRATION LOGIC ---

    /*
    // --- ORIGINAL API CALL (KEEP THIS COMMENTED OUT FOR NOW) ---
    // try {
    //   const response = await api.register({
    //     fullName: formData.fullName,
    //     email: formData.email,
    //     password: formData.password,
    //   });
    //   console.log('Registration successful:', response);
    //   navigate('/confirm-otp', { state: { email: formData.email } });
    // } catch (err) {
    //   console.error('Registration error:', err);
    //   setError(err.message || 'Registration failed. Please try again.');
    // } finally {
    //   setLoading(false);
    // }
    */
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">Create an Account</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">Already have an account? <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => navigate('/login')}>Sign In</span></p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;6