import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { fetchDashboardData, fetchAnalytics } from '../store/slices/dataSlice';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  FileText,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ContentLoader } from '../components/Loader';

const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }) => (
  <div className="card">
    <div className="flex items-center">
      <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center text-sm ${change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`card ${className}`}>
    <div className="card-header">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    </div>
    <div className="card-body">
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.data);

  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  // Mock data for demonstration
  const mockData = {
    stats: [
      { title: 'Total Entries', value: '1,234', change: 12, icon: Database, color: 'primary' },
      { title: 'Analytics Score', value: '85.2', change: 5.3, icon: BarChart3, color: 'success' },
      { title: 'Active Users', value: '89', change: -2.1, icon: Users, color: 'warning' },
      { title: 'Reports Generated', value: '45', change: 8.7, icon: FileText, color: 'danger' },
    ],
    chartData: [
      { name: 'Jan', entries: 65, score: 78 },
      { name: 'Feb', entries: 59, score: 82 },
      { name: 'Mar', entries: 80, score: 85 },
      { name: 'Apr', entries: 81, score: 88 },
      { name: 'May', entries: 56, score: 92 },
      { name: 'Jun', entries: 55, score: 89 },
    ],
    pieData: [
      { name: 'Temperature', value: 35, color: '#3B82F6' },
      { name: 'Pressure', value: 25, color: '#10B981' },
      { name: 'Flow Rate', value: 20, color: '#F59E0B' },
      { name: 'Quality', value: 20, color: '#EF4444' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your technical data.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {mockData.stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <ContentLoader loading={loading} error={error}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Line Chart */}
          <ChartCard title="Data Entries & Analytics Score">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="entries"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Entries"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Area Chart */}
          <ChartCard title="Performance Trends">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bar Chart */}
          <ChartCard title="Monthly Data Categories">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entries" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pie Chart */}
          <ChartCard title="Data Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Activity */}
        <ChartCard title="Recent Activity" className="lg:col-span-2">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    New data entry added for Temperature category
                  </p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </ContentLoader>
    </div>
  );
};

export default Dashboard; 