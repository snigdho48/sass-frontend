import axios from 'axios';

const API_BASE_URL = "https://sassbackend.reachableads.com/api";
 //const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

// Response interceptor to handle auth errors with refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh');

      if (!refreshToken) {
        localStorage.removeItem('token');
        // Avoid hard redirect loops; let router handle it
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests until refresh is done
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a separate axios call to avoid interceptor recursion
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data?.access || refreshResponse.data?.token || refreshResponse.data;
        if (!newAccessToken) throw new Error('Invalid refresh response');

        // Persist and update default header
        localStorage.setItem('token', newAccessToken);
        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null);
        // Clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 