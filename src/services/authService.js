import api from './api';

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login/', { email, password });
      // Persist both tokens for refresh flow
      if (response.data?.refresh) {
        localStorage.setItem('refresh', response.data.refresh);
      }
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register/', userData);
      if (response.data?.refresh) {
        localStorage.setItem('refresh', response.data.refresh);
      }
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Registration failed');
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user profile');
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      // Check if profileData is FormData (for file uploads)
      const isFormData = profileData instanceof FormData;
      const config = isFormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      } : {};
      
      const response = await api.put('/auth/profile/', profileData, config);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Profile update failed');
    }
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Password change failed');
    }
  },

  // Logout user
  async logout(refreshToken) {
    try {
      const refresh = refreshToken || localStorage.getItem('refresh');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('persist:root');
      sessionStorage.clear();
      
      // Clear all persist-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('persist:') || key === 'token' || key === 'refresh') {
          localStorage.removeItem(key);
        }
      });
    }
  },

  // Check authentication status
  async checkAuth() {
    try {
      const response = await api.get('/auth/check/');
      return response.data;
    } catch (error) {
      throw new Error('Authentication check failed');
    }
  },

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh/', { refresh: refreshToken });
      return response.data;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  },
}; 