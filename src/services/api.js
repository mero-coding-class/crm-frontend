const BASE_URL = 'http://localhost:3000/api'; // <<< IMPORTANT: REPLACE WITH YOUR ACTUAL BACKEND URL

const api = {
  // --- Auth Endpoints ---
  login: async (credentials) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return response.json();
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      return response.json();
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  confirmOtp: async (otpData) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/confirm-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OTP confirmation failed');
      }
      return response.json();
    } catch (error) {
      console.error('OTP confirmation API error:', error);
      throw error;
    }
  },

  // --- Leads Endpoints ---
  getLeads: async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include token for protected routes
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch leads');
      }
      return response.json();
    } catch (error) {
      console.error('Get Leads API error:', error);
      throw error;
    }
  },

  createLead: async (leadData, token) => {
    try {
      const response = await fetch(`${BASE_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(leadData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lead');
      }
      return response.json();
    } catch (error) {
      console.error('Create Lead API error:', error);
      throw error;
    }
  },

  updateLead: async (id, leadData, token) => {
    try {
      const response = await fetch(`${BASE_URL}/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(leadData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lead');
      }
      return response.json();
    } catch (error) {
      console.error('Update Lead API error:', error);
      throw error;
    }
  },

  deleteLead: async (id, token) => {
    try {
      const response = await fetch(`${BASE_URL}/leads/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lead');
      }
      return response.json(); // Or simply return true/false for success
    } catch (error) {
      console.error('Delete Lead API error:', error);
      throw error;
    }
  },

  // --- File Upload (Example) ---
  uploadFile: async (file, token) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is typically set automatically by fetch when using FormData
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }
      return response.json();
    } catch (error) {
      console.error('File Upload API error:', error);
      throw error;
    }
  },

  // Add more API calls as needed for other modules (e.g., users, products, tasks)
};

export default api;