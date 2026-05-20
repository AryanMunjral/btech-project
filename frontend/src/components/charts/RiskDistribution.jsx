/**
 * RiskDistribution — Donut chart showing LOW / MEDIUM / HIGH transaction breakdown.
 *
 * Features:
 *   - Animated donut with inner label
 *   - Color-coded risk levels
 *   - Custom legend with counts
 *
 * Usage:
 *   <RiskDistribution data={{ LOW: 150, MEDIUM: 30, HIGH: 12 }} />
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RISK_COLORS = {
  LOW: { fill: '#22c55e', bg: 'bg-success-50', text: 'text-success-600' },
  MEDIUM: { fill: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' },
  HIGH: { fill: '#ef4444', bg: 'bg-danger-50', text: 'text-danger-600' },
};

function RiskDistribution({ data = {}, height = 260 }) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height }}
      >
        No risk data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={RISK_COLORS[entry.name]?.fill || '#6b7280'}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: 8,
                fontSize: 13,
                border: '1px solid #e5e7eb',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex gap-4 mt-2">
        {chartData.map((entry) => {
          const colors = RISK_COLORS[entry.name] || {};
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.fill || '#6b7280' }}
              />
              <span className="text-xs text-gray-600">
                {entry.name}{' '}
                <span className="font-semibold text-gray-900">
                  {entry.value}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RiskDistribution;
