import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PerformanceTrends = ({ data, loading, systemType }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Performance Trends</h3>
        </div>
        <div className="card-body">
          <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Performance Trends</h3>
        </div>
        <div className="card-body">
          <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm font-medium">Not Available</p>
            <p className="text-xs mt-1 text-gray-400">No performance data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for chart (ensure score is between 0-100)
  const chartData = data.map(item => ({
    name: item.name,
    score: Math.min(100, Math.max(0, item.score || 0))
  }));

  const color = systemType === 'cooling' ? '#3B82F6' : '#9333EA';

  return (
    <div className="card shadow-sm">
      <div className={`card-header bg-gradient-to-r ${
        systemType === 'cooling' 
          ? 'from-blue-50 to-blue-100' 
          : 'from-purple-50 to-purple-100'
      }`}>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Trends</h3>
        <p className="text-xs text-gray-600 mt-1">Real-time performance trend score & curves</p>
      </div>
      <div className="card-body p-3 sm:p-4">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorScore-${systemType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value.toFixed(1)}`, 'Performance Score']}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorScore-${systemType})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceTrends;

