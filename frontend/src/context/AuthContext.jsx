/**
 * Authentication Context
 * =======================
 *
 * Provides authentication state across the entire app.
 *
 * State:
 *   - user      — current logged-in user (or null)
 *   - token     — JWT access token (stored in localStorage)
 *   - isLoading — true while checking auth on app start
 *
 * Actions:
 *   - login(email, password)   — authenticate and store token
 *   - register(userData)       — create account and auto-login
 *   - logout()                 — clear token and redirect to login
 *   - updateUser(data)         — update user state after profile edits
 *
 * Usage:
 *   const { user, login, logout } = useAuth();
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: verify stored token ──────────────────────
  useEffect(() => {
    async function verifyToken() {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Set the token on the Axios instance
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        // Fetch current user profile
        const { data } = await api.get('/auth/me');
        setUser(data.user || data);
        setToken(storedToken);
      } catch (err) {
        // Token is invalid or expired — clear it
        console.warn('Token verification failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    const userData = data.user;

    // Store tokens
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    // Set Axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setToken(accessToken);
    setUser(userData);

    toast.success(`Welcome back, ${userData.name}!`);
    return userData;
  }, []);

  // ── Register ───────────────────────────────────────────
  const register = useCallback(async (userData) => {
    const { data } = await api.post('/auth/register', userData);

    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    const newUser = data.user;

    // Store tokens
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    // Set Axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setToken(accessToken);
    setUser(newUser);

    toast.success(`Welcome, ${newUser.name}! Account created.`);
    return newUser;
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore — we're logging out anyway
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];

    setUser(null);
    setToken(null);

    toast.success('Logged out successfully');
  }, []);

  // ── Update user state ──────────────────────────────────
  const updateUser = useCallback((data) => {
    setUser((prev) => ({ ...prev, ...data }));
  }, []);

  // ── Derived state ──────────────────────────────────────
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN';
  const isAnalyst = user?.role === 'ANALYST';
  const canManage = isAdmin || isAnalyst;

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    isAnalyst,
    canManage,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
