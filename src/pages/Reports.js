import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { dataService } from '../services/dataService';
import { FileText, Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [reportParams, setReportParams] = useState({
    start_date: '',
    end_date: '',
    categories: [],
  });

  const { data: reports = [], error: reportsError, isLoading, refetch } = useQuery('reports', dataService.getReports, {
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Reports error:', error);
      toast.error('Failed to load reports');
    }
  });

  const generateReportMutation = useMutation(dataService.generateReport, {
    onSuccess: () => {
      toast.success('Report generated successfully');
      // Refetch reports to show the new report
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const downloadReportMutation = useMutation(dataService.downloadReport, {
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    generateReportMutation.mutate({
      report_type: selectedReport,
      parameters: reportParams,
    });
  };

  const handleDownloadReport = (reportId) => {
    downloadReportMutation.mutate(reportId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate and manage analytical reports for your technical data.
        </p>
      </div>

      {/* Report Generation */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Generate New Report</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="input"
              >
                <option value="">Select a report type</option>
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input"
                  value={reportParams.start_date}
                  onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="input"
                  value={reportParams.end_date}
                  onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isLoading}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : reportsError ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Failed to load reports. Please try again.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-primary-600 hover:text-primary-900"
              >
                Retry
              </button>
            </div>
          ) : !Array.isArray(reports) || reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports generated yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(reports) && reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {report.template?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.template?.report_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          Ready
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadReport(report.id)}
                          disabled={downloadReportMutation.isLoading}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports; 