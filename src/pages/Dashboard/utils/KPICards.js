import React from 'react';
import { Database, BarChart3 } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badgePositive: 'bg-green-100 text-green-700',
      badgeNegative: 'bg-red-100 text-red-700'
    },
    success: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
      badgePositive: 'bg-green-100 text-green-700',
      badgeNegative: 'bg-red-100 text-red-700'
    }
  };
  
  const colors = colorClasses[color] || colorClasses.primary;
  
  return (
    <div className="card border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} px-4 sm:px-6 py-3 sm:py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`p-2 sm:p-2.5 rounded-lg ${colors.iconBg} bg-white bg-opacity-20 backdrop-blur-sm`}>
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-white`} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-white text-opacity-90 uppercase tracking-wide">
                {title}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-end justify-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {value}
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

const KPICards = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="card border-2 animate-pulse">
            <div className="h-16 bg-gray-200"></div>
            <div className="card-body p-6">
              <div className="h-10 bg-gray-200 rounded mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Entries',
      value: kpis?.total_entries?.toLocaleString() || '0',
      change: kpis?.total_entries_change || 0,
      icon: Database,
      color: 'primary'
    },
    {
      title: 'Analytics Score',
      value: kpis?.analytics_score?.toFixed(1) || '0.0',
      change: kpis?.analytics_score_change || 0,
      icon: BarChart3,
      color: 'success'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default KPICards;
