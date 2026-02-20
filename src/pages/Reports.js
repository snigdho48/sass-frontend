import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { dataService } from '../services/dataService';
import { FileText, Calendar, Droplet, Flame, CheckCircle, Download, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../components/SearchableSelect';

const Reports = () => {
  // Step 1: Analysis Type Selection
  const [analysisType, setAnalysisType] = useState(null); // 'cooling' or 'boiler'
  
  // Step 2: Water System Selection
  const [selectedWaterSystem, setSelectedWaterSystem] = useState(null);
  
  // Step 3: Report Type Selection
  const [reportType, setReportType] = useState(null); // 'daily', 'monthly', 'yearly'
  
  // Step 4: Date/Month/Year Selection
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Generated PDF state
  const [generatedPdf, setGeneratedPdf] = useState(null); // { blobUrl, filename }
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch water systems based on analysis type
  const { data: waterSystemsData, isLoading: waterSystemsLoading, error: waterSystemsError } = useQuery(
    ['water-systems', analysisType],
    () => {
      console.log('Fetching water systems with params:', { system_type: analysisType });
      return dataService.getWaterSystems({ system_type: analysisType });
    },
    {
      enabled: !!analysisType,
      onSuccess: (data) => {
        console.log('Water systems fetched successfully:', data);
        console.log('Number of water systems:', Array.isArray(data) ? data.length : 'Not an array');
      },
      onError: (error) => {
        console.error('Water systems error:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to load water systems');
      }
    }
  );

  // Ensure waterSystems is always an array
  const waterSystems = Array.isArray(waterSystemsData) ? waterSystemsData : [];
  
  // Format water systems for SearchableSelect: 'plant name - water system name'
  const waterSystemOptions = React.useMemo(() => {
    return waterSystems.map(ws => ({
      id: ws.id,
      name: `${ws.plant_name || 'Unknown Plant'} - ${ws.name}`,
      waterSystem: ws // Keep reference to original object
    }));
  }, [waterSystems]);
  
  // Debug logging
  React.useEffect(() => {
    if (analysisType) {
      console.log('Analysis type:', analysisType);
      console.log('Water systems data:', waterSystemsData);
      console.log('Water systems (processed):', waterSystems);
      console.log('Water system options:', waterSystemOptions);
      console.log('Is loading:', waterSystemsLoading);
      console.log('Error:', waterSystemsError);
    }
  }, [analysisType, waterSystemsData, waterSystems, waterSystemOptions, waterSystemsLoading, waterSystemsError]);

  // Generate report mutation
  const generateReportMutation = useMutation(
    (reportData) => dataService.generateReport(reportData),
    {
      onSuccess: (data) => {
        toast.success('Report generated successfully!');
        // Store PDF data for download/preview
        setGeneratedPdf({
          blobUrl: data.blobUrl,
          filename: data.filename
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to generate report');
      },
    }
  );
  
  // Download PDF function
  const handleDownloadPdf = () => {
    if (!generatedPdf) return;
    
    const link = document.createElement('a');
    link.href = generatedPdf.blobUrl;
    link.setAttribute('download', generatedPdf.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Report downloaded successfully!');
  };
  
  // Open preview modal
  const handlePreviewPdf = () => {
    if (!generatedPdf) return;
    setShowPreviewModal(true);
  };
  
  // Close preview modal and cleanup
  const handleClosePreview = () => {
    setShowPreviewModal(false);
  };
  
  // Cleanup blob URL when component unmounts or PDF changes
  React.useEffect(() => {
    return () => {
      if (generatedPdf?.blobUrl) {
        window.URL.revokeObjectURL(generatedPdf.blobUrl);
      }
    };
  }, [generatedPdf]);

  const resetForm = () => {
    setAnalysisType(null);
    setSelectedWaterSystem(null);
    setReportType(null);
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    // Clear generated PDF
    if (generatedPdf?.blobUrl) {
      window.URL.revokeObjectURL(generatedPdf.blobUrl);
    }
    setGeneratedPdf(null);
    setShowPreviewModal(false);
  };
  
  // Clear generated PDF when selections change
  React.useEffect(() => {
    if (generatedPdf) {
      if (generatedPdf.blobUrl) {
        window.URL.revokeObjectURL(generatedPdf.blobUrl);
      }
      setGeneratedPdf(null);
      setShowPreviewModal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisType, selectedWaterSystem, reportType, selectedDate, selectedMonth, selectedYear]);

  const handleGenerateReport = () => {
    // Validate all selections
    if (!analysisType) {
      toast.error('Please select analysis type (Cooling or Boiler)');
      return;
    }
    if (!selectedWaterSystem) {
      toast.error('Please select a water system');
      return;
    }
    if (!reportType) {
      toast.error('Please select report type (Daily, Monthly, or Yearly)');
      return;
    }

    // Validate date/month/year based on report type
    if (reportType === 'daily' && !selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (reportType === 'monthly' && !selectedMonth) {
      toast.error('Please select a month');
      return;
    }
    if (reportType === 'yearly' && !selectedYear) {
      toast.error('Please select a year');
      return;
    }

    // Prepare report data
    const reportData = {
      analysis_type: analysisType,
      water_system_id: selectedWaterSystem.id,
      report_type: reportType,
      ...(reportType === 'daily' && { date: selectedDate }),
      ...(reportType === 'monthly' && { month: selectedMonth }),
      ...(reportType === 'yearly' && { year: selectedYear }),
    };

    generateReportMutation.mutate(reportData);
  };

  // Get current year and generate year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Generate month options
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Water Analysis Reports</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Generate detailed reports for your water analysis data
        </p>
      </div>

      {/* Report Generation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Generate Report</h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Step 1: Analysis Type Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Step 1: Select Analysis Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setAnalysisType('cooling');
                  setSelectedWaterSystem(null); // Reset water system when changing type
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  analysisType === 'cooling'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Droplet className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${
                  analysisType === 'cooling' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
                <div className="text-center">
                  <div className={`text-sm sm:text-base font-medium ${
                    analysisType === 'cooling' ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Cooling Water
                  </div>
                  {analysisType === 'cooling' && (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mx-auto mt-1" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnalysisType('boiler');
                  setSelectedWaterSystem(null); // Reset water system when changing type
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  analysisType === 'boiler'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Flame className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${
                  analysisType === 'boiler' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
                <div className="text-center">
                  <div className={`text-sm sm:text-base font-medium ${
                    analysisType === 'boiler' ? 'text-orange-900 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Boiler Water
                  </div>
                  {analysisType === 'boiler' && (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 mx-auto mt-1" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Water System Selection */}
          {analysisType && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Step 2: Select Water System <span className="text-red-500">*</span>
              </label>
              {waterSystemsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !Array.isArray(waterSystems) || waterSystems.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                    No {analysisType === 'cooling' ? 'cooling' : 'boiler'} water systems available.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    {waterSystemsError 
                      ? 'Error loading water systems. Please try again or contact your administrator.'
                      : 'You may not have access to any ' + (analysisType === 'cooling' ? 'cooling' : 'boiler') + ' water systems, or none have been created yet. Please contact your administrator to create or assign a water system.'}
                  </p>
                  {waterSystemsError && (
                    <details className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      <summary className="cursor-pointer">Error details</summary>
                      <pre className="mt-1 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded overflow-auto text-gray-900 dark:text-gray-100">
                        {JSON.stringify(waterSystemsError.response?.data || waterSystemsError.message, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <SearchableSelect
                  options={waterSystemOptions}
                  value={selectedWaterSystem ? { id: selectedWaterSystem.id, name: waterSystemOptions.find(opt => opt.id === selectedWaterSystem.id)?.name || `${selectedWaterSystem.plant_name || 'Unknown Plant'} - ${selectedWaterSystem.name}` } : null}
                  onChange={(option) => {
                    if (option) {
                      // Find the original water system object
                      const system = waterSystems.find(ws => ws.id === option.id);
                      setSelectedWaterSystem(system);
                    } else {
                      setSelectedWaterSystem(null);
                    }
                  }}
                  placeholder="Search and select a water system..."
                  searchPlaceholder="Search by plant name or water system name..."
                  noOptionsMessage={`No ${analysisType === 'cooling' ? 'cooling' : 'boiler'} water systems found`}
                  loading={waterSystemsLoading}
                />
              )}
            </div>
          )}

          {/* Step 3: Report Type Selection */}
          {selectedWaterSystem && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Step 3: Select Report Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {['daily', 'monthly', 'yearly'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setReportType(type);
                      // Reset date selections when changing report type
                      setSelectedDate('');
                      setSelectedMonth('');
                      setSelectedYear('');
                    }}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      reportType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 ${
                      reportType === type ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className={`text-center text-sm sm:text-base font-medium ${
                      reportType === type ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Date/Month/Year Selection */}
          {reportType && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Step 4: Select {reportType === 'daily' ? 'Date' : reportType === 'monthly' ? 'Month' : 'Year'} <span className="text-red-500">*</span>
              </label>
              
              {reportType === 'daily' && (
                <div className="w-full sm:max-w-xs">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {reportType === 'monthly' && (
                <div className="w-full sm:max-w-xs">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    max={`${currentYear}-12`} // Don't allow future months
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {reportType === 'yearly' && (
                <div className="w-full sm:max-w-xs">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a year...</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Generate Button - Hidden when PDF is generated */}
          {selectedWaterSystem && reportType && 
           ((reportType === 'daily' && selectedDate) ||
            (reportType === 'monthly' && selectedMonth) ||
            (reportType === 'yearly' && selectedYear)) && (
            <div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
              {/* Generate Button - Only show when no PDF is generated */}
              {!generatedPdf && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isLoading}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {generateReportMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              )}
              
              {/* Download and Preview Buttons (shown after generation) */}
              {generatedPdf && !generateReportMutation.isLoading && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleDownloadPdf}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Download Report
                  </button>
                  <button
                    onClick={handlePreviewPdf}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Preview Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreviewModal && generatedPdf && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-2 sm:pt-4 px-2 sm:px-4 pb-2 sm:pb-4">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity z-40"
              onClick={handleClosePreview}
            ></div>

            {/* Modal panel */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl z-50 my-2 sm:my-8">
              {/* Modal header */}
              <div className="bg-white dark:bg-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 sticky top-0 z-10">
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center break-words flex-1 min-w-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span className="break-all truncate">{generatedPdf.filename}</span>
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center text-xs sm:text-sm md:text-base"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">DL</span>
                  </button>
                  <button
                    onClick={handleClosePreview}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1 sm:p-2"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Modal body with PDF preview */}
              <div className="bg-white dark:bg-gray-800 px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                <div className="w-full" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
                  <iframe
                    src={generatedPdf.blobUrl}
                    className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-md"
                    title="PDF Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
