import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { dataService } from '../services/dataService';
import { useAppSelector } from '../hooks/useAppSelector';
import AnalysisEditModal from '../components/AnalysisEditModal';
import SearchableSelect from '../components/SearchableSelect';
import {
  FileText,
  Calendar,
  Droplet,
  Flame,
  CheckCircle,
  Download,
  Eye,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '--:--';
  try {
    return format(parseISO(`1970-01-01T${timeStr.slice(0, 8)}`), 'h:mm a');
  } catch {
    return timeStr.slice(0, 5);
  }
};

const formatDisplayDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

const formatDisplayPeriod = (period, periodType) => {
  if (periodType === 'yearly') return period;
  try {
    return format(parseISO(`${period}-01`), 'MMMM yyyy');
  } catch {
    return period;
  }
};

const Reports = () => {
  const { user } = useAppSelector((state) => state.auth);
  // Match backend report-period/daily-groups gates (role SUPER_ADMIN via can_create_plants)
  const isSuperAdmin = !!user?.can_create_plants;
  const queryClient = useQueryClient();

  const [analysisType, setAnalysisType] = useState(null);
  const [selectedWaterSystem, setSelectedWaterSystem] = useState(null);
  const [reportType, setReportType] = useState(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [generatedPdf, setGeneratedPdf] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAnalysisId, setEditingAnalysisId] = useState(null);

  const showDailyWorkspace = reportType === 'daily' && !!selectedWaterSystem;
  const showPeriodWorkspace =
    (reportType === 'monthly' || reportType === 'yearly') &&
    !!selectedWaterSystem;
  const showReportWorkspace = showDailyWorkspace || showPeriodWorkspace;

  const {
    data: waterSystemsData,
    isLoading: waterSystemsLoading,
    error: waterSystemsError,
  } = useQuery(
    ['water-systems', analysisType],
    () => dataService.getWaterSystems({ system_type: analysisType }),
    {
      enabled: !!analysisType,
      onError: () => toast.error('Failed to load water systems'),
    }
  );

  const waterSystems = Array.isArray(waterSystemsData) ? waterSystemsData : [];
  const waterSystemOptions = useMemo(
    () =>
      waterSystems.map((ws) => ({
        id: ws.id,
        name: `${ws.plant_name || 'Unknown Plant'} - ${ws.name}`,
        waterSystem: ws,
      })),
    [waterSystems]
  );

  const {
    data: dailyGroupsData,
    isLoading: dailyGroupsLoading,
    isFetching: dailyGroupsFetching,
    error: dailyGroupsError,
    refetch: refetchDailyGroups,
  } = useQuery(
    [
      'daily-analysis-groups',
      analysisType,
      selectedWaterSystem?.id,
      currentPage,
      pageSize,
    ],
    () =>
      dataService.getDailyAnalysisGroups({
        analysisType,
        waterSystemId: selectedWaterSystem.id,
        page: currentPage,
        pageSize,
      }),
    {
      enabled: showDailyWorkspace,
      keepPreviousData: true,
      onError: (error) => {
        toast.error(error.message || 'Failed to load daily analyses');
      },
    }
  );

  const dailyResults = dailyGroupsData?.results || [];
  const totalPages = dailyGroupsData?.total_pages || 1;
  const totalCount = dailyGroupsData?.count || 0;

  const {
    data: reportPeriodsData,
    isLoading: reportPeriodsLoading,
    isFetching: reportPeriodsFetching,
    error: reportPeriodsError,
    refetch: refetchReportPeriods,
  } = useQuery(
    [
      'report-periods',
      analysisType,
      selectedWaterSystem?.id,
      reportType,
      currentPage,
      pageSize,
    ],
    () =>
      dataService.getReportPeriods({
        analysisType,
        waterSystemId: selectedWaterSystem.id,
        periodType: reportType,
        page: currentPage,
        pageSize,
      }),
    {
      enabled: showPeriodWorkspace,
      keepPreviousData: true,
      onError: (error) => {
        toast.error(error.message || 'Failed to load available reports');
      },
    }
  );

  const reportPeriodResults = reportPeriodsData?.results || [];
  const reportPeriodTotalPages = reportPeriodsData?.total_pages || 1;
  const reportPeriodTotalCount = reportPeriodsData?.count || 0;

  useEffect(() => {
    const activeData = showDailyWorkspace ? dailyGroupsData : reportPeriodsData;
    if (
      showReportWorkspace &&
      activeData &&
      currentPage > (activeData.total_pages || 1)
    ) {
      setCurrentPage(Math.max(1, activeData.total_pages || 1));
    }
  }, [
    showDailyWorkspace,
    showReportWorkspace,
    dailyGroupsData,
    reportPeriodsData,
    currentPage,
  ]);

  const generateReportMutation = useMutation(
    (reportData) => {
      const { __preview, __autoDownload, ...payload } = reportData;
      return dataService.generateReport(payload);
    },
    {
      onSuccess: (data, variables) => {
        if (!variables.__autoDownload) {
          toast.success('Report generated successfully!');
        }
        setGeneratedPdf({
          blobUrl: data.blobUrl,
          filename: data.filename,
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to generate report');
      },
    }
  );

  const deleteDayMutation = useMutation(
    ({ date }) =>
      dataService.deleteAnalysisDay({
        analysisType,
        waterSystemId: selectedWaterSystem.id,
        date,
      }),
    {
      onSuccess: (data) => {
        toast.success(
          `Deleted ${data.deleted_count} analysis record${
            data.deleted_count === 1 ? '' : 's'
          }`
        );
        queryClient.invalidateQueries(['daily-analysis-groups']);
        if (generatedPdf?.blobUrl) {
          window.URL.revokeObjectURL(generatedPdf.blobUrl);
        }
        setGeneratedPdf(null);
        setShowPreviewModal(false);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete day');
      },
    }
  );

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

  const handlePreviewPdf = () => {
    if (!generatedPdf) return;
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
  };

  useEffect(() => {
    return () => {
      if (generatedPdf?.blobUrl) {
        window.URL.revokeObjectURL(generatedPdf.blobUrl);
      }
    };
  }, [generatedPdf]);

  useEffect(() => {
    if (generatedPdf) {
      if (generatedPdf.blobUrl) {
        window.URL.revokeObjectURL(generatedPdf.blobUrl);
      }
      setGeneratedPdf(null);
      setShowPreviewModal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    analysisType,
    selectedWaterSystem,
    reportType,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);

  const generateForDate = (date, { preview = false } = {}) => {
    if (!analysisType || !selectedWaterSystem) return;
    if (generateReportMutation.isLoading || deleteDayMutation.isLoading) return;
    generateReportMutation.mutate(
      {
        analysis_type: analysisType,
        water_system_id: selectedWaterSystem.id,
        report_type: 'daily',
        date,
        __preview: preview,
        __autoDownload: !preview,
      },
      {
        onSuccess: (data, variables) => {
          if (variables.__preview) {
            setShowPreviewModal(true);
          }
          if (variables.__autoDownload) {
            const link = document.createElement('a');
            link.href = data.blobUrl;
            link.setAttribute('download', data.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded successfully!');
          }
        },
      }
    );
  };

  const generateForPeriod = (period, { preview = false } = {}) => {
    if (
      !analysisType ||
      !selectedWaterSystem ||
      !['monthly', 'yearly'].includes(reportType)
    ) {
      return;
    }
    if (generateReportMutation.isLoading || deleteDayMutation.isLoading) return;

    generateReportMutation.mutate(
      {
        analysis_type: analysisType,
        water_system_id: selectedWaterSystem.id,
        report_type: reportType,
        ...(reportType === 'monthly'
          ? { month: period }
          : { year: period }),
        __preview: preview,
        __autoDownload: !preview,
      },
      {
        onSuccess: (data, variables) => {
          if (variables.__preview) {
            setShowPreviewModal(true);
          }
          if (variables.__autoDownload) {
            const link = document.createElement('a');
            link.href = data.blobUrl;
            link.setAttribute('download', data.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded successfully!');
          }
        },
      }
    );
  };

  const handleGenerateReport = () => {
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

  const handleDeleteDay = (date) => {
    if (!isSuperAdmin) return;
    if (generateReportMutation.isLoading || deleteDayMutation.isLoading) return;
    const confirmed = window.confirm(
      `Delete ALL analysis records for ${formatDisplayDate(
        date
      )}? This cannot be undone.`
    );
    if (!confirmed) return;
    deleteDayMutation.mutate({ date });
  };

  const getRowActionState = (date) => {
    const genVars = generateReportMutation.variables;
    const delVars = deleteDayMutation.variables;
    const generating =
      generateReportMutation.isLoading && genVars?.date === date;
    const previewing = generating && !!genVars?.__preview;
    const downloading = generating && !!genVars?.__autoDownload;
    const deleting =
      deleteDayMutation.isLoading && delVars?.date === date;
    const busy =
      generateReportMutation.isLoading || deleteDayMutation.isLoading;
    return { previewing, downloading, deleting, busy };
  };

  const getPeriodActionState = (period) => {
    const variables = generateReportMutation.variables;
    const requestedPeriod =
      variables?.report_type === 'monthly' ? variables.month : variables?.year;
    const generating =
      generateReportMutation.isLoading && requestedPeriod === period;
    return {
      previewing: generating && !!variables?.__preview,
      downloading: generating && !!variables?.__autoDownload,
      busy: generateReportMutation.isLoading || deleteDayMutation.isLoading,
    };
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Water Analysis Reports
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Generate detailed reports for your water analysis data
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
          Generate Report
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Step 1 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Step 1: Select Analysis Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setAnalysisType('cooling');
                  setSelectedWaterSystem(null);
                  setReportType(null);
                  setCurrentPage(1);
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  analysisType === 'cooling'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Droplet
                  className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${
                    analysisType === 'cooling'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <div className="text-center">
                  <div
                    className={`text-sm sm:text-base font-medium ${
                      analysisType === 'cooling'
                        ? 'text-blue-900 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
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
                  setSelectedWaterSystem(null);
                  setReportType(null);
                  setCurrentPage(1);
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  analysisType === 'boiler'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Flame
                  className={`h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 ${
                    analysisType === 'boiler'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <div className="text-center">
                  <div
                    className={`text-sm sm:text-base font-medium ${
                      analysisType === 'boiler'
                        ? 'text-orange-900 dark:text-orange-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Boiler Water
                  </div>
                  {analysisType === 'boiler' && (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 mx-auto mt-1" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          {analysisType && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Step 2: Select Water System <span className="text-red-500">*</span>
              </label>
              {waterSystemsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : !Array.isArray(waterSystems) || waterSystems.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                    No {analysisType === 'cooling' ? 'cooling' : 'boiler'} water
                    systems available.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    {waterSystemsError
                      ? 'Error loading water systems. Please try again or contact your administrator.'
                      : `You may not have access to any ${
                          analysisType === 'cooling' ? 'cooling' : 'boiler'
                        } water systems, or none have been created yet.`}
                  </p>
                </div>
              ) : (
                <SearchableSelect
                  options={waterSystemOptions}
                  value={
                    selectedWaterSystem
                      ? {
                          id: selectedWaterSystem.id,
                          name:
                            waterSystemOptions.find(
                              (opt) => opt.id === selectedWaterSystem.id
                            )?.name ||
                            `${selectedWaterSystem.plant_name || 'Unknown Plant'} - ${
                              selectedWaterSystem.name
                            }`,
                        }
                      : null
                  }
                  onChange={(option) => {
                    if (option) {
                      const system = waterSystems.find((ws) => ws.id === option.id);
                      setSelectedWaterSystem(system);
                      setCurrentPage(1);
                    } else {
                      setSelectedWaterSystem(null);
                    }
                  }}
                  placeholder="Search and select a water system..."
                  searchPlaceholder="Search by plant name or water system name..."
                  noOptionsMessage={`No ${
                    analysisType === 'cooling' ? 'cooling' : 'boiler'
                  } water systems found`}
                  loading={waterSystemsLoading}
                />
              )}
            </div>
          )}

          {/* Step 3 */}
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
                      setSelectedDate('');
                      setSelectedMonth('');
                      setSelectedYear('');
                      setCurrentPage(1);
                    }}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      reportType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Calendar
                      className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 ${
                        reportType === type
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    <div
                      className={`text-center text-sm sm:text-base font-medium ${
                        reportType === type
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: manual selectors for users without the availability workspace */}
          {reportType && !showReportWorkspace && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Step 4: Select{' '}
                {reportType === 'daily'
                  ? 'Date'
                  : reportType === 'monthly'
                  ? 'Month'
                  : 'Year'}{' '}
                <span className="text-red-500">*</span>
              </label>

              {reportType === 'daily' && (
                <div className="w-full sm:max-w-xs">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
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
                    max={`${currentYear}-12`}
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

          {/* Classic generate UI (users without the availability workspace) */}
          {!showReportWorkspace &&
            selectedWaterSystem &&
            reportType &&
            ((reportType === 'daily' && selectedDate) ||
              (reportType === 'monthly' && selectedMonth) ||
              (reportType === 'yearly' && selectedYear)) && (
              <div className="pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
                {!generatedPdf && (
                  <button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isLoading}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generateReportMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2" />
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

      {/* Daily availability workspace */}
      {showDailyWorkspace && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isSuperAdmin ? 'Daily Analyses' : 'Available Daily Reports'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isSuperAdmin
                  ? 'One row per date. Click a time to edit or delete that sample. Preview/Download includes every time for that day.'
                  : 'Only dates containing analysis data are shown. Preview or download the report for a date.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Rows
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dailyGroupsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : dailyGroupsError ? (
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
              {dailyGroupsError.message || 'Failed to load daily analyses.'}
              <button
                type="button"
                onClick={() => refetchDailyGroups()}
                className="ml-3 underline"
              >
                Retry
              </button>
            </div>
          ) : dailyResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              No analysis data found for this water system yet.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      {isSuperAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Times
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Records
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dailyResults.map((row) => {
                      const { previewing, downloading, deleting, busy } =
                        getRowActionState(row.date);
                      return (
                        <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatDisplayDate(row.date)}
                          </td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {row.entries.map((entry) => (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => setEditingAnalysisId(entry.id)}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                    title="Edit or delete this sample"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {formatDisplayTime(entry.analysis_time)}
                                  </button>
                                ))}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.record_count}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  generateForDate(row.date, { preview: true })
                                }
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                              >
                                {previewing ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                )}
                                {previewing ? 'Loading…' : 'Preview'}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  generateForDate(row.date, { preview: false })
                                }
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {downloading ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                )}
                                {downloading ? 'Loading…' : 'Download'}
                              </button>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleDeleteDay(row.date)}
                                  className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deleting ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  {deleting ? 'Deleting…' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {dailyResults.map((row) => {
                  const { previewing, downloading, deleting, busy } =
                    getRowActionState(row.date);
                  return (
                    <div
                      key={row.date}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatDisplayDate(row.date)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.record_count} record
                            {row.record_count === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.entries.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => setEditingAnalysisId(entry.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 disabled:opacity-50"
                            >
                              <Clock className="h-3 w-3" />
                              {formatDisplayTime(entry.analysis_time)}
                            </button>
                          ))}
                        </div>
                      )}
                      <div
                        className={`grid gap-2 ${
                          isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            generateForDate(row.date, { preview: true })
                          }
                          className="inline-flex items-center justify-center px-2 py-2 text-xs rounded-md bg-purple-600 text-white disabled:opacity-50"
                        >
                          {previewing ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 mr-1" />
                          )}
                          {previewing ? '…' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            generateForDate(row.date, { preview: false })
                          }
                          className="inline-flex items-center justify-center px-2 py-2 text-xs rounded-md bg-green-600 text-white disabled:opacity-50"
                        >
                          {downloading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1" />
                          )}
                          {downloading ? '…' : 'DL'}
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteDay(row.date)}
                            className="inline-flex items-center justify-center px-2 py-2 text-xs rounded-md bg-red-600 text-white disabled:opacity-50"
                          >
                            {deleting ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            {deleting ? '…' : 'Del'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> dates
                    {dailyGroupsFetching ? ' · Updating…' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || dailyGroupsLoading}
                      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || dailyGroupsLoading}
                      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Monthly/yearly availability workspace */}
      {showPeriodWorkspace && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Available {reportType === 'monthly' ? 'Monthly' : 'Yearly'} Reports
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Only periods containing analysis data are shown. Preview or
                download the complete report for a period.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Rows
              </label>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportPeriodsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : reportPeriodsError ? (
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
              {reportPeriodsError.message || 'Failed to load available reports.'}
              <button
                type="button"
                onClick={() => refetchReportPeriods()}
                className="ml-3 underline"
              >
                Retry
              </button>
            </div>
          ) : reportPeriodResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              No {reportType === 'monthly' ? 'monthly' : 'yearly'} reports are
              available for this water system yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {reportType === 'monthly' ? 'Month' : 'Year'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Days with data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Records
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportPeriodResults.map((row) => {
                      const { previewing, downloading, busy } =
                        getPeriodActionState(row.period);
                      return (
                        <tr
                          key={row.period}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatDisplayPeriod(row.period, reportType)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.day_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.record_count}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  generateForPeriod(row.period, { preview: true })
                                }
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                              >
                                {previewing ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                )}
                                {previewing ? 'Loading…' : 'Preview'}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  generateForPeriod(row.period, { preview: false })
                                }
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {downloading ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                )}
                                {downloading ? 'Loading…' : 'Download'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {reportPeriodResults.map((row) => {
                  const { previewing, downloading, busy } =
                    getPeriodActionState(row.period);
                  return (
                    <div
                      key={row.period}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatDisplayPeriod(row.period, reportType)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {row.day_count} day{row.day_count === 1 ? '' : 's'} with
                          data · {row.record_count} record
                          {row.record_count === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            generateForPeriod(row.period, { preview: true })
                          }
                          className="inline-flex items-center justify-center px-2 py-2 text-xs rounded-md bg-purple-600 text-white disabled:opacity-50"
                        >
                          {previewing ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 mr-1" />
                          )}
                          {previewing ? 'Loading…' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            generateForPeriod(row.period, { preview: false })
                          }
                          className="inline-flex items-center justify-center px-2 py-2 text-xs rounded-md bg-green-600 text-white disabled:opacity-50"
                        >
                          {downloading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1" />
                          )}
                          {downloading ? 'Loading…' : 'Download'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {reportPeriodTotalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * pageSize,
                        reportPeriodTotalCount
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{reportPeriodTotalCount}</span>{' '}
                    periods
                    {reportPeriodsFetching ? ' · Updating…' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1 || reportPeriodsLoading}
                      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {reportPeriodTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(reportPeriodTotalPages, page + 1)
                        )
                      }
                      disabled={
                        currentPage === reportPeriodTotalPages ||
                        reportPeriodsLoading
                      }
                      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreviewModal && generatedPdf && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen pt-2 sm:pt-4 px-2 sm:px-4 pb-2 sm:pb-4">
            <div
              className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity z-40"
              onClick={handleClosePreview}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl z-50 my-2 sm:my-8">
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
              <div className="bg-white dark:bg-gray-800 px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                <div
                  className="w-full"
                  style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
                >
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

      {isSuperAdmin && editingAnalysisId && (
        <AnalysisEditModal
          analysisId={editingAnalysisId}
          onClose={() => setEditingAnalysisId(null)}
          onSaved={() => {
            queryClient.invalidateQueries(['daily-analysis-groups']);
          }}
          onDeleted={() => {
            queryClient.invalidateQueries(['daily-analysis-groups']);
          }}
        />
      )}
    </div>
  );
};

export default Reports;
