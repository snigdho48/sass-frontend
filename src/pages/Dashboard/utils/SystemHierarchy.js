import React from 'react';
import { Droplets, Factory } from 'lucide-react';

const SystemHierarchy = ({ systems, systemType, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      primary: 'bg-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      textLight: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      icon: 'text-blue-600'
    },
    purple: {
      primary: 'bg-purple-600',
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      textLight: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      icon: 'text-purple-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const systemName = systemType === 'cooling' ? 'Cooling Tower' : 'Boiler';
  const Icon = systemType === 'cooling' ? Droplets : Factory;

  if (!systems || systems.length === 0) {
    return (
      <div className={`card border-2 ${colors.border} ${colors.light}`}>
        <div className="card-body p-4 sm:p-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full ${colors.badge} mb-3 sm:mb-4`}>
            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${colors.icon}`} />
          </div>
          <h3 className={`text-lg sm:text-xl font-bold ${colors.text} mb-2`}>
            {systemName}
          </h3>
          <p className="text-sm sm:text-base font-medium text-gray-600 mb-1">Not Available</p>
          <p className="text-xs sm:text-sm text-gray-500">No water systems configured</p>
        </div>
      </div>
    );
  }

  // Group systems by plant
  const systemsByPlant = {};
  systems.forEach(system => {
    const plantName = system.plant_name || 'Unassigned';
    if (!systemsByPlant[plantName]) {
      systemsByPlant[plantName] = [];
    }
    systemsByPlant[plantName].push(system);
  });

  return (
    <div className={`card border-2 ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.primary} px-4 sm:px-6 py-3 sm:py-4 text-white`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">{systemName}</h3>
            <p className="text-xs text-white text-opacity-90 mt-0.5">
              {systems.length} {systems.length === 1 ? 'system' : 'systems'} configured
            </p>
          </div>
        </div>
      </div>

      {/* Systems List */}
      <div className="card-body p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(systemsByPlant).map(([plantName, plantSystems]) => (
            <div key={plantName} className="space-y-2">
              {plantName !== 'Unassigned' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-1 h-3 sm:h-4 ${colors.primary} rounded-full`}></div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                    {plantName}
                  </span>
                </div>
              )}
              {plantSystems.map((system) => (
                <div
                  key={system.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border ${colors.border} ${colors.light} hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${colors.primary} flex-shrink-0`}></div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                      {system.name}
                    </span>
                  </div>
                  {system.analysis_count > 0 && (
                    <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${colors.badge} flex-shrink-0 ml-2`}>
                      {system.analysis_count} {system.analysis_count === 1 ? 'analysis' : 'analyses'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHierarchy;
