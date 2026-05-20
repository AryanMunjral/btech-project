/**
 * FraudTrendChart — Area chart showing daily transaction volume + fraud overlay.
 *
 * Features:
 *   - Gradient-filled area for total transactions
 *   - Red area overlay for fraud count
 *   - Custom tooltip with daily breakdown
 *   - Responsive container
 *
 * Usage:
 *   <FraudTrendChart data={[{ date: 'Mon', total: 180, fraud: 6 }, ...]} />
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const total = payload.find((p) => p.dataKey === 'total')?.value || 0;
  const fraud = payload.find((p) => p.dataKey === 'fraud')?.value || 0;
  const legit = total - fraud;
  const rate = total > 0 ? ((fraud / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Total
          </span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Fraud
          </span>
          <span className="font-medium text-danger-600">{fraud}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Legitimate
          </span>
          <span className="font-medium text-success-600">{legit}</span>
        </div>
        <div className="border-t border-gray-100 pt-1 mt-1">
          <span className="text-gray-500">Fraud Rate: </span>
          <span className="font-medium">{rate}%</span>
        </div>
      </div>
    </div>
  );
}

function FraudTrendChart({ data = [], height = 300 }) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height }}
      >
        No daily trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#gradTotal)"
          name="Total"
        />
        <Area
          type="monotone"
          dataKey="fraud"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#gradFraud)"
          name="Fraud"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default FraudTrendChart;
