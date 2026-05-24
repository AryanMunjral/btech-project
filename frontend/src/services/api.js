/**
 * API Service (v4.0) — Axios Clients with JWT Auth
 * ===================================================
 *
 * Two Axios instances:
 *   1. api   — Express backend (port 5000) with JWT auth
 *   2. mlApi — FastAPI ML service (port 8000) — no auth
 *
 * Features:
 *   - Auto-attaches JWT token from localStorage
 *   - Auto-refreshes expired tokens
 *   - Auto-redirects to /login on 401
 *   - Request/response logging in development
 *
 * All API functions are organized by domain:
 *   - Auth (login, register, logout, profile)
 *   - Transactions (CRUD + fraud check)
 *   - Dashboard (stats)
 *   - Alerts (CRUD + actions)
 *   - Users (admin management)
 *   - ML (model health, info)
 */

import axios from 'axios';

// Production URLs (Render-deployed services)
const PROD_API_URL = 'https://upi-fraud-backend-pk2g.onrender.com/api';
const PROD_ML_API_URL = 'https://upi-fraud-ml-api.onrender.com';

const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';

const API_BASE = import.meta.env.VITE_API_URL || (isProd ? PROD_API_URL : 'http://localhost:5000/api');
const ML_API_BASE = import.meta.env.VITE_ML_API_URL || (isProd ? PROD_ML_API_URL : 'http://localhost:8000');

// ═══════════════════════════════════════════════════════════
// AXIOS INSTANCES
// ═══════════════════════════════════════════════════════════

// Backend API client (with JWT auth)
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ML API client (no auth needed)
export const mlApi = axios.create({
  baseURL: ML_API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ═══════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR — Attach JWT Token
// ═══════════════════════════════════════════════════════════

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — Handle 401 (Auto-logout)
// ═══════════════════════════════════════════════════════════

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Try to refresh the token
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken,
          });

          const newToken = data.accessToken || data.token;
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request with new token
          return api(originalRequest);
        } catch (refreshErr) {
          // Refresh also failed — force logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];

          // Redirect to login (only if not already on login page)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }

          // Mark as auth redirect so callers don't show confusing toasts
          const redirectError = new Error('Session expired. Redirecting to login…');
          redirectError._authRedirect = true;
          return Promise.reject(redirectError);
        }
      } else {
        // No refresh token — force logout
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        // Mark as auth redirect so callers don't show confusing toasts
        const redirectError = new Error('Session expired. Please log in again.');
        redirectError._authRedirect = true;
        return Promise.reject(redirectError);
      }
    }

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// AUTH APIs
// ═══════════════════════════════════════════════════════════

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),
};

// ═══════════════════════════════════════════════════════════
// TRANSACTION APIs
// ═══════════════════════════════════════════════════════════

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  createBatch: (transactions) =>
    api.post('/transactions/batch', { transactions }),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  recheck: (id) => api.post(`/transactions/${id}/recheck`),
  getMLStatus: () => api.get('/transactions/ml-status'),
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD APIs
// ═══════════════════════════════════════════════════════════

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ═══════════════════════════════════════════════════════════
// ALERT APIs
// ═══════════════════════════════════════════════════════════

export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  getStats: () => api.get('/alerts/stats'),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// ═══════════════════════════════════════════════════════════
// USER APIs (Admin)
// ═══════════════════════════════════════════════════════════

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getByUpiId: (upiId) => api.get(`/users/upi/${upiId}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getTransactions: (id) => api.get(`/users/${id}/transactions`),
};

// ═══════════════════════════════════════════════════════════
// ML API (Direct access — no auth)
// ═══════════════════════════════════════════════════════════

export const mlDirectAPI = {
  predict: (data) => mlApi.post('/predict', data),
  getHealth: () => mlApi.get('/health'),
  getModelInfo: () => mlApi.get('/model/info'),
};

// ═══════════════════════════════════════════════════════════
// LEGACY EXPORTS (backward compatibility with existing pages)
// ═══════════════════════════════════════════════════════════

export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransactionById = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);
export const getDashboardStats = () => api.get('/dashboard/stats');
export const predictFraud = (data) => mlApi.post('/predict', data);
export const getModelHealth = () => mlApi.get('/health');
