/**
 * AlertsFeed — Compact alerts panel for the Dashboard.
 *
 * Shows the latest 5 unread/recent alerts with severity indicators.
 * Links to the full Alerts page.
 *
 * Usage:
 *   <AlertsFeed alerts={[...]} />
 */

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Bell,
} from 'lucide-react';

const typeIcons = {
  FRAUD_DETECTED: ShieldAlert,
  SUSPICIOUS_ACTIVITY: AlertTriangle,
  HIGH_AMOUNT: Zap,
  RAPID_TRANSACTIONS: Zap,
  ACCOUNT_ANOMALY: AlertTriangle,
};

const severityDot = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-gray-400',
};

function AlertsFeed({ alerts = [] }) {
  if (alerts.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">
            Recent Alerts
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3">
            <Bell className="h-5 w-5 text-success-500" />
          </div>
          <p className="text-sm text-gray-500">All clear!</p>
          <p className="text-xs text-gray-400">No alerts at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900">
            Recent Alerts
          </h3>
          {alerts.filter((a) => !a.isRead).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-danger-500 text-white text-xs font-bold">
              {alerts.filter((a) => !a.isRead).length}
            </span>
          )}
        </div>
        <Link
          to="/alerts"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-gray-50">
        {alerts.slice(0, 5).map((alert) => {
          const TypeIcon = typeIcons[alert.type] || AlertTriangle;

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 px-6 py-3 transition-colors ${
                !alert.isRead ? 'bg-primary-50/30' : 'hover:bg-gray-50'
              }`}
            >
              {/* Severity dot */}
              <div className="pt-1.5 flex-shrink-0">
                <span
                  className={`block w-2 h-2 rounded-full ${
                    severityDot[alert.severity] || 'bg-gray-400'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {alert.severity} •{' '}
                  {alert.createdAt
                    ? new Date(alert.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>

              {/* Icon */}
              <TypeIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AlertsFeed;
