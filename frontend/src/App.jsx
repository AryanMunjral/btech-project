/**
 * App Root (v6.0) — Full Routing with ErrorBoundary
 * ===================================================
 *
 * Wraps the entire app in an ErrorBoundary to prevent
 * white screens on unexpected render errors.
 *
 * Routes:
 *   Guest (no auth required):
 *     /login     → Login page
 *     /register  → Register page
 *
 *   Protected (requires auth):
 *     /                → Dashboard
 *     /transactions    → Transactions list
 *     /check           → Submit transaction (fraud check)
 *     /alerts          → Fraud alerts
 *
 *   Admin (requires ADMIN or ANALYST role):
 *     /analytics  → Admin analytics dashboard
 *
 *   Fallback:
 *     *           → Redirect to dashboard
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Navbar from './components/Navbar';

// Route Guards
import {
  ProtectedRoute,
  GuestRoute,
  AdminRoute,
} from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CheckTransaction from './pages/CheckTransaction';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        {/* Navbar (auto-hides on guest pages) */}
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* ── Guest Routes (login/register only) ────────── */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />

            {/* ── Protected Routes (any authenticated user) ─── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/check"
              element={
                <ProtectedRoute>
                  <CheckTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            {/* ── Admin Routes (ADMIN + ANALYST only) ────────── */}
            <Route
              path="/analytics"
              element={
                <AdminRoute>
                  <Analytics />
                </AdminRoute>
              }
            />

            {/* ── Catch-all: redirect to dashboard ─────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
