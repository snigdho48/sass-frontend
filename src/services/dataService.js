import api from './api';

export const dataService = {
  // Get data categories
  async getCategories() {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  },

  // Get data entries with optional filters
  async getDataEntries(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      
      const response = await api.get('/data/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch data entries');
    }
  },

  // Create new data entry
  async createDataEntry(entryData) {
    try {
      const response = await api.post('/data/', entryData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to create data entry');
    }
  },

  // Update data entry
  async updateDataEntry(id, entryData) {
    try {
      const response = await api.put(`/data/${id}/`, entryData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to update data entry');
    }
  },

  // Delete data entry
  async deleteDataEntry(id) {
    try {
      await api.delete(`/data/${id}/`);
    } catch (error) {
      throw new Error('Failed to delete data entry');
    }
  },

  // Get analytics data
  async getAnalytics(dateRange = '30') {
    try {
      const response = await api.get('/analytics/', { params: { range: dateRange } });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch analytics');
    }
  },

  // Get dashboard data
  async getDashboardData() {
    try {
      const response = await api.get('/dashboard/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch dashboard data');
    }
  },

  // Generate report
  async generateReport(reportData) {
    try {
      const response = await api.post('/reports/generate/', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate report');
    }
  },

  // Get reports list
  async getReports() {
    try {
      const response = await api.get('/reports/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch reports');
    }
  },

  // Download report
  async downloadReport(reportId) {
    try {
      const response = await api.get(`/reports/${reportId}/download/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to download report');
    }
  },

  // Admin: Get all users
  async getUsers() {
    try {
      const response = await api.get('/admin/users/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  },

  // Admin: Create user
  async createUser(userData) {
    try {
      const response = await api.post('/admin/users/', userData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to create user');
    }
  },

  // Admin: Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/admin/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to update user');
    }
  },

  // Admin: Delete user
  async deleteUser(userId) {
    try {
      await api.delete(`/admin/users/${userId}/`);
    } catch (error) {
      throw new Error('Failed to delete user');
    }
  },
}; 