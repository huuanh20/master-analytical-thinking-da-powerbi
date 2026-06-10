import axios from 'axios';

// In development, Vite proxy handles /api → http://localhost:5030/api
// In production, set VITE_API_URL env var to point to the backend host
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: false,
});

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Add cache-busting timestamp for GET requests to prevent stale data
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor with Retry Logic ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network errors or 5xx server errors, max 2 retries
    if (!config || config._retryCount >= 2) {
      return Promise.reject(error);
    }

    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;

    if (isNetworkError || isServerError) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = config._retryCount * 1000; // 1s, 2s exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);
