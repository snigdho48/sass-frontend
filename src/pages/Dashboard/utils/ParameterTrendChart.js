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
import { useTheme } from '../../../contexts/ThemeContext';

const ParameterTrendChart = ({ data, parameterName, systemType, loading }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  if (loading) {
    return (
      <div className="h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg"></div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
  
  // Theme-aware colors
  const gridStroke = isDark ? '#374151' : '#e5e7eb';
  const axisStroke = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#fff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#374151';

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`colorParam-${systemType}-${parameterName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis 
          dataKey="name" 
          stroke={axisStroke}
          style={{ fontSize: '10px' }}
          tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: axisStroke }}
        />
        <YAxis 
          stroke={axisStroke}
          style={{ fontSize: '10px' }}
          tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: axisStroke }}
        />
        <Tooltip
          formatter={(value) => [value.toFixed(2), parameterName.toUpperCase()]}
          labelStyle={{ color: tooltipText, fontWeight: '600' }}
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: isDark 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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

