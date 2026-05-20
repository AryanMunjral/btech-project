/**
 * Route Guards
 * =============
 *
 * ProtectedRoute — requires authentication (redirects to /login)
 * GuestRoute     — only for non-authenticated users (redirects to /)
 * AdminRoute     — requires ADMIN or ANALYST role
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
 *   <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

// ── Requires login ───────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ── Only for guests (logged-in users go to dashboard) ────
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── Requires ADMIN or ANALYST role ───────────────────────
export function AdminRoute({ children }) {
  const { isAuthenticated, canManage, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">
          You need ADMIN or ANALYST role to view this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}
