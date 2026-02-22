import axios from 'axios';

// Vite: use env var (e.g. VITE_API_URL=http://127.0.0.1:8000/api).
// In dev, default is /api so the Vite proxy forwards to the backend (no CORS). Set VITE_API_URL to hit backend directly.
const API_BASE_URL = 'https://sassbackend.reachableads.com'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

/**
 * Extract a single error message from API error response.
 * Handles: { error: "msg" }, { field: ["msg"] }, array, or string.
 * For network errors (no response), returns a helpful message.
 */
export function getApiErrorMessage(error, fallback = 'Request failed') {
  if (!error) return fallback;
  // No response = server unreachable (backend not running, CORS, or wrong URL)
  if (!error.response) {
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      const isDirect = API_BASE_URL.startsWith('http');
      return isDirect
        ? `Cannot reach server at ${API_BASE_URL}. Check backend is running and CORS allows your origin, or in dev remove VITE_API_URL so the proxy is used.`
        : `Cannot reach server at ${API_BASE_URL}. Make sure the backend is running and the Vite dev server is using the proxy.`;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The server may be slow or unreachable.';
    }
    return error.message || fallback;
  }
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.error) return data.error;
  if (Array.isArray(data)) return data.map(String).join(', ');
  if (data && typeof data === 'object') {
    const messages = Object.values(data).flat().filter(Boolean);
    if (messages.length) return messages.map(String).join(', ');
  }
  return error.message || fallback;
}


// Request interceptor: add auth token and ensure no caching
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers = [];
let authExpiredFired = false;

function fireAuthExpiredOnce() {
  if (authExpiredFired) return;
  authExpiredFired = true;
  if (typeof window !== 'undefined' && window.__onAuthExpired) {
    try {
      window.__onAuthExpired();
    } finally {
      setTimeout(() => {
        authExpiredFired = false;
      }, 2000);
    }
  }
}

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
        localStorage.removeItem('refresh');
        fireAuthExpiredOnce();
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
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        fireAuthExpiredOnce();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL }; 