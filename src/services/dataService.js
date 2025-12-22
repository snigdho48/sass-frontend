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

  // Get new dashboard data with performance trends
  async getDashboardDataNew() {
    try {
      const response = await api.get('/dashboard/data/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch dashboard data');
    }
  },

  // Get parameter trends
  async getParameterTrends(systemType, parameterName, months = 6) {
    try {
      const response = await api.get('/dashboard/parameter-trends/', {
        params: { system_type: systemType, parameter_name: parameterName, months }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch parameter trends');
    }
  },

  // Generate report
  async generateReport(reportData) {
    try {
      const response = await api.post('/reports/generate/', reportData, {
        responseType: 'blob', // Expect PDF blob response
      });
      
      // Create blob URL (don't auto-download)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'report.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      return { success: true, filename, blobUrl: url, blob: blob };
    } catch (error) {
      // Try to parse error message from blob if it's a JSON error response
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to generate report');
        } catch (parseError) {
          throw new Error('Failed to generate report');
        }
      }
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
  async getUsers(page = 1, pageSize = 10) {
    try {
      const response = await api.get('/admin/users/', {
        params: {
          page,
          page_size: pageSize
        }
      });
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

  // Plant services
  async getPlants(params = {}) {
    try {
      const response = await api.get('/plants/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plants');
    }
  },

  async getPlantsManagement(params = {}) {
    try {
      const response = await api.get('/plants-management/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plants for management');
    }
  },

  async getPlant(plantId) {
    try {
      const response = await api.get(`/plants/${plantId}/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch plant');
    }
  },

  async createPlant(plantData) {
    try {
      const response = await api.post('/plants-management/', plantData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to create plant');
    }
  },

  async updatePlant(plantId, plantData) {
    try {
      const response = await api.patch(`/plants-management/${plantId}/`, plantData);
      return response.data;
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      throw new Error('Failed to update plant');
    }
  },

  async deletePlant(plantId) {
    try {
      await api.delete(`/plants-management/${plantId}/`);
    } catch (error) {
      throw new Error('Failed to delete plant');
    }
  },

  // Get users for plant owner assignment (admin only)
  async getUsersForPlantAccess() {
    try {
      const response = await api.get('/plants-management/users/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users for plant owner assignment');
    }
  },

  // Get admin users only for plant creation (Super Admin only)
  async getAdminUsersForPlantCreation() {
    try {
      const response = await api.get('/plants-management/admin-users/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch admin users for plant creation');
    }
  },

  // Water System services
  async getWaterSystems(params = {}) {
    try {
      const response = await api.get('/water-systems/', { params });
      // Handle paginated response (if API returns {results: [...], count: ...})
      // or direct array response
      return Array.isArray(response.data) ? response.data : (response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching water systems:', error);
      throw new Error('Failed to fetch water systems');
    }
  },

  async getWaterSystemsByPlant(plantId) {
    try {
      const response = await api.get('/water-systems/', { params: { plant_id: plantId } });
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error('Failed to fetch water systems for plant');
    }
  },

  async createWaterSystem(waterSystemData) {
    try {
      const response = await api.post('/water-systems/', waterSystemData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create water system');
    }
  },

  async updateWaterSystem(waterSystemId, waterSystemData) {
    try {
      const response = await api.patch(`/water-systems/${waterSystemId}/`, waterSystemData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update water system');
    }
  },

  async deleteWaterSystem(waterSystemId) {
    try {
      const response = await api.delete(`/water-systems/${waterSystemId}/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete water system');
    }
  },

  async assignUsersToWaterSystem(waterSystemId, userIds) {
    try {
      const response = await api.post(`/water-systems/${waterSystemId}/assign-users/`, { user_ids: userIds });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to assign users to water system');
    }
  },
}; 