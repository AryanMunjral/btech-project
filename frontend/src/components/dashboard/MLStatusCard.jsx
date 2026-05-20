/**
 * MLStatusCard — Visual indicator for ML service health.
 *
 * Shows:
 *   - Connection status (green dot = connected, red = offline)
 *   - Model type and version
 *   - Predictions served count
 *   - Feature count
 *
 * Usage:
 *   <MLStatusCard status={mlStatusData} />
 */

import { Cpu, Wifi, WifiOff, Brain, Activity } from 'lucide-react';

function MLStatusCard({ status }) {
  const isAvailable = status?.available || status?.ml_api_available;
  const health = status?.ml_api_health || status;
  const modelLoaded = health?.model_loaded;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="h-4 w-4 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">ML Engine</h3>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isAvailable
              ? 'bg-success-50 text-success-600'
              : 'bg-danger-50 text-danger-600'
          }`}
        >
          {isAvailable ? (
            <Wifi className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isAvailable ? 'Connected' : 'Offline'}
          </p>
          <p className="text-xs text-gray-500">
            {isAvailable
              ? modelLoaded
                ? 'XGBoost model active'
                : 'Rule-based fallback'
              : 'Start ML API on port 8000'}
          </p>
        </div>
        {/* Pulsing dot */}
        <div className="ml-auto">
          <span
            className={`flex h-3 w-3 ${isAvailable ? '' : ''}`}
          >
            <span
              className={`animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75 ${
                isAvailable ? 'bg-success-400' : 'bg-danger-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isAvailable ? 'bg-success-500' : 'bg-danger-500'
              }`}
            />
          </span>
        </div>
      </div>

      {/* Metrics */}
      {isAvailable && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="h-3.5 w-3.5 text-primary-500" />
              <span className="text-xs text-gray-500">Model</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              v{health?.model_version || '3.0'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-success-500" />
              <span className="text-xs text-gray-500">Predictions</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {(health?.predictions_served || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MLStatusCard;
