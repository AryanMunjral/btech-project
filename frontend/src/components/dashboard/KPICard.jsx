/**
 * KPICard — Enhanced stat card with icon, large value, and description.
 *
 * Supports:
 *   - Color variants (primary, danger, success, amber)
 *   - Large value with optional prefix/suffix
 *   - Description line below
 *   - Hover animation
 *
 * Usage:
 *   <KPICard
 *     title="Fraud Detected"
 *     value={43}
 *     description="3.45% fraud rate"
 *     icon={AlertTriangle}
 *     color="danger"
 *   />
 */

const colorConfig = {
  primary: {
    iconBg: 'bg-primary-100',
    iconText: 'text-primary-600',
    border: 'hover:border-primary-200',
    glow: 'hover:shadow-primary-100/50',
  },
  danger: {
    iconBg: 'bg-danger-100',
    iconText: 'text-danger-600',
    border: 'hover:border-danger-200',
    glow: 'hover:shadow-danger-100/50',
  },
  success: {
    iconBg: 'bg-success-100',
    iconText: 'text-success-600',
    border: 'hover:border-success-200',
    glow: 'hover:shadow-success-100/50',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    border: 'hover:border-amber-200',
    glow: 'hover:shadow-amber-100/50',
  },
};

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  color = 'primary',
  prefix = '',
  suffix = '',
}) {
  const cfg = colorConfig[color] || colorConfig.primary;

  return (
    <div
      className={`card group transition-all duration-300 ${cfg.border} hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {description && (
            <p className="text-xs text-gray-400 mt-1.5">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-xl ${cfg.iconBg} ${cfg.iconText} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default KPICard;
