/**
 * RiskGauge — Semi-circular gauge showing fraud rate percentage.
 *
 * Renders a SVG donut arc that fills from 0% to the given value.
 * Color transitions: green (0-30%) → amber (30-60%) → red (60-100%)
 *
 * Usage:
 *   <RiskGauge value={3.45} label="Fraud Rate" />
 */

const RADIUS = 80;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = Math.PI * RADIUS; // Half circle

function getColor(value) {
  if (value < 3) return { stroke: '#22c55e', bg: '#f0fdf4', text: '#15803d' };
  if (value < 10) return { stroke: '#f59e0b', bg: '#fffbeb', text: '#b45309' };
  return { stroke: '#ef4444', bg: '#fef2f2', text: '#b91c1c' };
}

function RiskGauge({ value = 0, label = 'Fraud Rate', maxValue = 100 }) {
  const normalizedValue = Math.min(Math.max(value, 0), maxValue);
  const percentage = normalizedValue / maxValue;
  const dashOffset = CIRCUMFERENCE * (1 - percentage);
  const colors = getColor(normalizedValue);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="text-3xl font-bold"
            style={{ color: colors.text }}
          >
            {normalizedValue.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default RiskGauge;
