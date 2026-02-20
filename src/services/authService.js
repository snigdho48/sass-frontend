import api, { getApiErrorMessage } from './api';

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login/', { email, password });
      if (response.data?.refresh) {
        localStorage.setItem('refresh', response.data.refresh);
      }
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Login failed'));
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
      throw new Error(getApiErrorMessage(error, 'Registration failed'));
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to get user profile'));
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const isFormData = profileData instanceof FormData;
      const config = isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' },
      } : {};
      const response = await api.put('/auth/profile/', profileData, config);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Profile update failed'));
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
      throw new Error(getApiErrorMessage(error, 'Password change failed'));
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
      // Save theme before clearing
      const theme = localStorage.getItem('theme');
      
      // Clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore theme
      if (theme) {
        localStorage.setItem('theme', theme);
      }
    }
  },

  // Check authentication status
  async checkAuth() {
    try {
      const response = await api.get('/auth/check/');
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Authentication check failed'));
    }
  },

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh/', { refresh: refreshToken });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Token refresh failed'));
    }
  },
}; 