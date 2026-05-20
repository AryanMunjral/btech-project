/**
 * Badge — Color-coded status/severity labels.
 *
 * Variants: success, danger, warning, info, neutral
 *
 * Usage:
 *   <Badge variant="danger">FRAUD</Badge>
 *   <Badge variant="success" icon={CheckCircle}>Legitimate</Badge>
 */

const variantMap = {
  success: 'bg-success-50 text-success-600 ring-success-500/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-500/20',
  info: 'bg-primary-50 text-primary-700 ring-primary-500/20',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  critical: 'bg-red-100 text-red-800 ring-red-500/20',
};

function Badge({ children, variant = 'neutral', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${variantMap[variant]}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

export default Badge;
