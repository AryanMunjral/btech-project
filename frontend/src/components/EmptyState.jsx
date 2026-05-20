/**
 * EmptyState — Shown when a list/section has no data.
 *
 * Usage:
 *   <EmptyState
 *     icon={AlertTriangle}
 *     title="No alerts"
 *     description="All clear — no fraud alerts at the moment."
 *     action={{ label: "Refresh", onClick: () => refetch() }}
 *   />
 */

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card text-center py-16">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4 inline-flex"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
