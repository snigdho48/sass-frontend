import React from 'react';
import ParameterTrendChart from './ParameterTrendChart';

const ParameterList = ({ parameters, systemType, loading }) => {
  const parameterConfig = {
    cooling: [
      { key: 'ph', label: 'pH' },
      { key: 'tds', label: 'TDS' },
      { key: 'hardness', label: 'Hardness' },
      { key: 'm_alkalinity', label: 'M-Alkalinity' },
      { key: 'lsi', label: 'LSI' },
      { key: 'rsi', label: 'RSI' }
    ],
    boiler: [
      { key: 'ph', label: 'pH' },
      { key: 'tds', label: 'TDS' },
      { key: 'hardness', label: 'Hardness' },
      { key: 'm_alkalinity', label: 'M-Alkalinity' },
      { key: 'p_alkalinity', label: 'P-Alkalinity' },
      { key: 'oh_alkalinity', label: 'OH-Alkalinity' }
    ]
  };

  const paramList = parameterConfig[systemType] || [];

  return (
    <div className="space-y-3 sm:space-y-4">
      {paramList.map((param) => {
        const paramData = parameters && parameters[param.key] ? parameters[param.key] : [];
        const hasData = paramData && paramData.length > 0;
        
        return (
          <div key={param.key} className="card shadow-sm">
            <div className={`card-header bg-gradient-to-r ${
              systemType === 'cooling' 
                ? 'from-blue-50 to-blue-100' 
                : 'from-purple-50 to-purple-100'
            }`}>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900">{param.label}</h4>
              <p className="text-xs text-gray-600 mt-1">Parameter trend area chart</p>
            </div>
            <div className="card-body p-3 sm:p-4">
              {hasData ? (
                <ParameterTrendChart
                  data={paramData}
                  parameterName={param.label}
                  systemType={systemType}
                  loading={loading}
                />
              ) : (
                <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium">Not Available</p>
                  <p className="text-xs mt-1 text-gray-400">No data available for this parameter</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParameterList;

