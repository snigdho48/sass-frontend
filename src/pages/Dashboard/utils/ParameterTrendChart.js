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

const ParameterTrendChart = ({ data, parameterName, systemType, loading }) => {
  if (loading) {
    return (
      <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <p className="text-xs sm:text-sm">No data available for this parameter</p>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value || 0
  }));

  const color = systemType === 'cooling' ? '#3B82F6' : '#9333EA';

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`colorParam-${systemType}-${parameterName}`} x1="0" y1="0" x2="0" y2="1">
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
          stroke="#6b7280"
          style={{ fontSize: '10px' }}
          tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
        />
        <Tooltip
          formatter={(value) => [value.toFixed(2), parameterName.toUpperCase()]}
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
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fillOpacity={1}
          fill={`url(#colorParam-${systemType}-${parameterName})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ParameterTrendChart;

