/**
 * StatusBreakdown — Horizontal progress bars showing transaction status distribution.
 *
 * Cleaner than a bar chart for small datasets (4-5 categories).
 * Each bar is proportional to the total, with the count on the right.
 *
 * Usage:
 *   <StatusBreakdown data={{ COMPLETED: 120, FLAGGED: 15, BLOCKED: 5, FAILED: 2 }} />
 */

const STATUS_CONFIG = {
  COMPLETED: { color: 'bg-success-500', label: 'Completed', icon: '✓' },
  FLAGGED: { color: 'bg-amber-500', label: 'Flagged', icon: '⚠' },
  BLOCKED: { color: 'bg-danger-500', label: 'Blocked', icon: '✕' },
  FAILED: { color: 'bg-gray-400', label: 'Failed', icon: '–' },
  PENDING: { color: 'bg-primary-400', label: 'Pending', icon: '◷' },
};

function StatusBreakdown({ data = {} }) {
  const entries = Object.entries(data)
    .map(([status, count]) => ({
      status,
      count,
      config: STATUS_CONFIG[status] || { color: 'bg-gray-300', label: status, icon: '?' },
    }))
    .sort((a, b) => b.count - a.count);

  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-8">
        No status data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(({ status, count, config }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 flex items-center gap-1.5">
                <span className="text-xs">{config.icon}</span>
                {config.label}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {count}{' '}
                <span className="text-xs font-normal text-gray-400">
                  ({pct.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${config.color} transition-all duration-700 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase">
          Total
        </span>
        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
}

export default StatusBreakdown;
