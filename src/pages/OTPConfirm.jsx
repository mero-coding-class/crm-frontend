// C:/Users/aryal/Desktop/EDU_CRM/client/src/pages/OTPConfirm.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import api from '../services/api'; // <--- COMMENT OUT OR REMOVE THIS LINE for now

const OTPConfirm = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get email from registration state or localStorage/sessionStorage
  const email = location.state?.email || localStorage.getItem('registrationEmail'); // You might save it after register

  // If email is not available, redirect to register or login
  useEffect(() => {
    if (!email) {
      // You might want to navigate to a registration page if email isn't present
      navigate('/register', { replace: true });
    }
    // Optionally save email to localStorage in case of page refresh
    if (email) {
      localStorage.setItem('registrationEmail', email);
    }
    // Cleanup localStorage item if user navigates away or confirms
    return () => {
      // localStorage.removeItem('registrationEmail'); // Uncomment if you want to clear it after component unmounts
    };
  }, [email, navigate]);


  const handleChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (otp.trim() === '') {
      setError('Please enter the OTP.');
      setLoading(false);
      return;
    }

    // --- TEMPORARY MOCK OTP CONFIRMATION LOGIC ---
    try {
      console.log(`Simulating OTP confirmation for email: ${email} with OTP: ${otp}`);
      // Simulate an asynchronous operation (like an API call)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 seconds

      // Simulate a successful response
      console.log('Simulated OTP confirmation successful.');
      // After successful OTP, typically navigate to login or directly set token and go to dashboard
      // For now, let's go to login, assuming they'll log in after confirming
      navigate('/login', { replace: true, state: { registrationSuccess: true, email: email } });

    } catch (err) {
      console.error('Simulated OTP confirmation error:', err);
      setError('Simulated OTP confirmation failed. (This should not happen)');
    } finally {
      setLoading(false);
    }
    // --- END TEMPORARY MOCK OTP CONFIRMATION LOGIC ---


    /*
    // --- ORIGINAL API CALL (KEEP THIS COMMENTED OUT FOR NOW) ---
    // try {
    //   const response = await api.confirmOtp({ email: email, otp: otp });
    //   console.log('OTP confirmation successful:', response);
    //   // If successful, you might want to automatically log them in or redirect to login
    //   navigate('/login', { replace: true });
    // } catch (err) {
    //   console.error('OTP confirmation error:', err);
    //   setError(err.message || 'Invalid OTP or an error occurred. Please try again.');
    // } finally {
    //   setLoading(false);
    // }
    */
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200"> {/* Enhanced UI classes */}
        <h2 className="text-4xl font-extrabold text-center mb-8 text-gray-800">Confirm Your OTP</h2> {/* Stronger heading */}

        <p className="text-center text-gray-600 mb-6 text-lg">
          Enter OTP sent to <span className="font-semibold text-blue-600">{email}</span>
        </p>

        {error && <p className="text-red-600 text-center mb-4 text-sm bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6"> {/* Added space-y for vertical spacing */}
          <div>
            <label htmlFor="otp" className="block text-gray-700 text-sm font-bold mb-2 sr-only">Enter OTP</label>
            <input
              type="text" // Use "text" for OTP for better flexibility, but validate length
              id="otp"
              name="otp"
              value={otp}
              onChange={handleChange}
              // pattern="\d{6}" // Optional: HTML5 pattern for 6 digits, but JS validation is better
              // maxLength="6" // Optional: Limit input length
              placeholder="Enter 6-digit OTP" // Improved placeholder
              className="w-full p-3 border border-gray-300 rounded-md text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300" // Enhanced input styling
              required // Keep required for initial browser validation
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl" // Enhanced button styling
          >
            {loading ? 'Confirming...' : 'Confirm OTP'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600 space-y-2"> {/* Added space-y */}
          <p className="text-sm">Didn't receive the OTP?
            <button
              onClick={() => console.log('Resend OTP logic here')} // Placeholder for resend logic
              disabled={loading}
              className="text-blue-600 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              Resend
            </button>
          </p>
          <p className="text-sm">Wrong email or need to sign in?
            <button
              onClick={() => navigate('/login')}
              disabled={loading}
              className="text-blue-600 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              Go to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPConfirm;