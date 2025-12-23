import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { dataService } from '../services/dataService';
import { ContentLoader } from '../components/Loader';
import KPICards from './Dashboard/utils/KPICards';
import SystemHierarchy from './Dashboard/utils/SystemHierarchy';
import PerformanceTrends from './Dashboard/utils/PerformanceTrends';
import ParameterList from './Dashboard/utils/ParameterList';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataService.getDashboardDataNew();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-6 px-2 sm:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 sm:p-6 rounded-lg border border-primary-200 dark:border-primary-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Welcome back! Here's what's happening with your technical data.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Real-time performance trend scores & area charts
        </p>
      </div>

      <ContentLoader loading={loading} error={error}>
        {dashboardData && (
          <>
            {/* KPI Cards */}
            <KPICards kpis={dashboardData.kpis} loading={loading} />

            {/* System Sections */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2">
              {/* Cooling Tower Section */}
              <div className="space-y-4 sm:space-y-6">
                <SystemHierarchy
                  systems={dashboardData.hierarchy?.cooling_tower?.systems || []}
                  systemType="cooling"
                  color="blue"
                />
                {/* Only show performance trends and parameters if systems exist */}
                {dashboardData.hierarchy?.cooling_tower?.systems?.length > 0 ? (
                  <>
                    <PerformanceTrends
                      data={dashboardData.performance_trends?.cooling_tower || []}
                      loading={loading}
                      systemType="cooling"
                    />
                    <div className="space-y-3 sm:space-y-4">
                      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 sm:pl-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Parameters</h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Parameter trend area charts</p>
                      </div>
                      <ParameterList
                        parameters={dashboardData.parameter_trends?.cooling_tower || {}}
                        systemType="cooling"
                        loading={loading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="card border-2 border-gray-200 dark:border-gray-700">
                    <div className="card-body p-8">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Configure water systems
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Add water systems to view performance trends and parameters
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boiler Section */}
              <div className="space-y-4 sm:space-y-6">
                <SystemHierarchy
                  systems={dashboardData.hierarchy?.boiler?.systems || []}
                  systemType="boiler"
                  color="purple"
                />
                {/* Only show performance trends and parameters if systems exist */}
                {dashboardData.hierarchy?.boiler?.systems?.length > 0 ? (
                  <>
                    <PerformanceTrends
                      data={dashboardData.performance_trends?.boiler || []}
                      loading={loading}
                      systemType="boiler"
                    />
                    <div className="space-y-3 sm:space-y-4">
                      <div className="border-l-4 border-purple-500 dark:border-purple-400 pl-3 sm:pl-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Parameters</h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Parameter trend area charts</p>
                      </div>
                      <ParameterList
                        parameters={dashboardData.parameter_trends?.boiler || {}}
                        systemType="boiler"
                        loading={loading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="card border-2 border-gray-200 dark:border-gray-700">
                    <div className="card-body p-8">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Configure water systems
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Add water systems to view performance trends and parameters
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </ContentLoader>
    </div>
  );
};

export default Dashboard;
