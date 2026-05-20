/**
 * Error Handler Utility
 * ======================
 *
 * Centralizes API error parsing so every page shows
 * consistent, human-friendly error messages.
 *
 * Handles:
 *   - Axios response errors (validation, auth, server)
 *   - Network errors (no internet, timeout)
 *   - Unknown / generic JS errors
 *
 * Usage:
 *   import { parseError, handleApiError } from '../utils/errorHandler';
 *
 *   try { ... }
 *   catch (err) { handleApiError(err); }
 */

import toast from 'react-hot-toast';

// ── Parse error into a user-friendly message ─────────────
export function parseError(error) {
  // 1. Axios response error (server returned an error status)
  if (error.response) {
    const { status, data } = error.response;

    // Zod validation errors (array of field-level issues)
    if (data?.details && Array.isArray(data.details)) {
      return data.details.map((d) => d.message).join(', ');
    }

    // Standard { error: '...' } response
    if (data?.error) {
      return data.error;
    }

    // Standard { message: '...' } response
    if (data?.message) {
      return data.message;
    }

    // Fallback by status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists or conflicts with another.';
      case 422:
        return 'Validation failed. Please check the form fields.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again.';
      default:
        return `Something went wrong (Error ${status}).`;
    }
  }

  // 2. Network error (no response received at all)
  if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection.';
    }
    return 'Network error. Is the backend server running?';
  }

  // 3. Generic JS error
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

// ── Show toast with parsed error ─────────────────────────
export function handleApiError(error, fallbackMessage) {
  // Always parse the real error first; only use fallback as last resort
  const parsed = parseError(error);
  const message = parsed || fallbackMessage || 'An unexpected error occurred.';
  toast.error(message);
  console.error('[API Error]', error);
  return message;
}

// ── Check if error is a specific status code ─────────────
export function isStatus(error, status) {
  return error?.response?.status === status;
}

// ── Check if error is a network/connectivity issue ───────
export function isNetworkError(error) {
  return !error.response && !!error.request;
}
