/**
 * Formatters Utility
 * ===================
 *
 * Consistent formatting for dates, currency, numbers, and UPI IDs
 * used throughout the application.
 *
 * Usage:
 *   import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
 *
 *   formatCurrency(50000)       → '₹50,000'
 *   formatDate(isoString)       → '16 May, 02:30 PM'
 *   formatPercent(0.8745)       → '87.5%'
 */

// ── Currency (INR) ───────────────────────────────────────
export function formatCurrency(amount, options = {}) {
  const num = Number(amount) || 0;
  const { compact = false } = options;

  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  }

  return `₹${num.toLocaleString('en-IN')}`;
}

// ── Date / Time ──────────────────────────────────────────
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const {
    includeTime = true,
    includeYear = false,
    relative = false,
  } = options;

  // Relative time (e.g., "2 hours ago")
  if (relative) {
    return formatRelativeTime(date);
  }

  const formatOptions = {
    day: '2-digit',
    month: 'short',
  };

  if (includeYear) {
    formatOptions.year = 'numeric';
  }

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return date.toLocaleString('en-IN', formatOptions);
}

// ── Relative Time ────────────────────────────────────────
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return formatDate(date, { relative: false });
}

// ── Percentage ───────────────────────────────────────────
export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0;
  // If value is already 0-100, use as-is; if 0-1, multiply by 100
  const pct = num > 1 ? num : num * 100;
  return `${pct.toFixed(decimals)}%`;
}

// ── Numbers ──────────────────────────────────────────────
export function formatNumber(num) {
  return (Number(num) || 0).toLocaleString('en-IN');
}

// ── UPI ID truncation ────────────────────────────────────
export function truncateUPI(upiId, maxLen = 20) {
  if (!upiId) return '—';
  if (upiId.length <= maxLen) return upiId;
  return `${upiId.slice(0, maxLen - 3)}...`;
}

// ── Transaction ID truncation ────────────────────────────
export function truncateTxnId(txnId, chars = 16) {
  if (!txnId) return '—';
  if (txnId.length <= chars) return txnId;
  return `${txnId.slice(0, chars)}...`;
}

// ── Risk level color helpers ─────────────────────────────
export function getRiskColor(level) {
  switch (level?.toUpperCase()) {
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'neutral';
  }
}

// ── Status color helpers ─────────────────────────────────
export function getStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'BLOCKED':
      return 'critical';
    case 'FLAGGED':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'PENDING':
      return 'info';
    default:
      return 'neutral';
  }
}
