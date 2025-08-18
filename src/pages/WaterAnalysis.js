import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Save,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WaterAnalysis = () => {
  const { user } = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [trends, setTrends] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  
  // Input data state
  const [inputData, setInputData] = useState({
    ph: 7.5,
    tds: 150,
    total_alkalinity: 120,
    hardness: 100,
    chloride: 60,
    temperature: 26,
    analysis_name: 'Water Analysis',
    notes: ''
  });
  
  // Results state
  const [results, setResults] = useState({
    lsi: null,
    rsi: null,
    ls: null,
    stability_score: null,
    lsi_status: '',
    rsi_status: '',
    ls_status: '',
    overall_status: ''
  });
  
  // Load trends on component mount
  useEffect(() => {
    loadTrends();
    loadRecommendations();
  }, []);
  
  const loadTrends = async () => {
    try {
      const [phTrends, lsiTrends, rsiTrends] = await Promise.all([
        api.get('/water-trends/?parameter=ph'),
        api.get('/water-trends/?parameter=lsi'),
        api.get('/water-trends/?parameter=rsi')
      ]);
      
      setTrends({
        ph: phTrends.data,
        lsi: lsiTrends.data,
        rsi: rsiTrends.data
      });
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };
  
  const loadRecommendations = async () => {
    try {
      const response = await api.get('/water-recommendations/');
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };
  
  const handleInputChange = (field, value) => {
    setInputData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const calculateAnalysis = async () => {
    setCalculating(true);
    try {
      const response = await api.post('/calculate-water-analysis-with-recommendations/', inputData);
      await Promise.all([loadTrends()]);

      // Set calculation results
      setResults(response.data.calculation);
      
      // Set recommendations
      setRecommendations(response.data.recommendations);
      
      
      toast.success('Analysis calculated successfully!');
    } catch (error) {
      toast.error('Error calculating analysis');
      console.error('Calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };
  
  const saveAnalysis = async () => {
    setLoading(true);
    try {
      const analysisData = {
        ...inputData,
        ...results,
        analysis_date: new Date().toISOString().split('T')[0] // Add current date
      };
      
      await api.post('/water-analysis/', analysisData);
      toast.success('Analysis saved successfully!');
      
      
      // Reload trends and recommendations dynamically
      await Promise.all([loadTrends()]);
    } catch (error) {
      toast.error('Error saving analysis');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data periodically and after calculations



  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Stable':
      case 'Acceptable':
        return 'text-green-600';
      case 'Scaling Likely':
      case 'Corrosion Likely':
        return 'text-red-600';
      case 'Moderate':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Stable':
      case 'Acceptable':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Scaling Likely':
      case 'Corrosion Likely':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Moderate':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const getStabilityScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Stability Analysis</h1>
          <p className="text-gray-600">Analyze water parameters and calculate stability indices</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Calculator className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Input Data</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={inputData.ph}
                  onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS (Total Dissolved Solids) (ppm)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={inputData.tds}
                  onChange={(e) => handleInputChange('tds', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Alkalinity as CaCO₃ (ppm)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={inputData.total_alkalinity}
                  onChange={(e) => handleInputChange('total_alkalinity', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hardness as CaCO₃ (ppm)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={inputData.hardness}
                  onChange={(e) => handleInputChange('hardness', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chloride as NaCl (ppm)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={inputData.chloride}
                  onChange={(e) => handleInputChange('chloride', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hot Side Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={calculateAnalysis}
                disabled={calculating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {calculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">LSI (Langelier Saturation Index)</span>
                  {results.lsi_status && getStatusIcon(results.lsi_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.lsi?.toFixed(1) || '--'}</span>
                  <span className={`font-medium ${getStatusColor(results.lsi_status)}`}>
                    {results.lsi_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">RSI (Ryznar Stability Index)</span>
                  {results.rsi_status && getStatusIcon(results.rsi_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.rsi?.toFixed(1) || '--'}</span>
                  <span className={`font-medium ${getStatusColor(results.rsi_status)}`}>
                    {results.rsi_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">LS (Larson-Skold Index)</span>
                  {results.ls_status && getStatusIcon(results.ls_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.ls?.toFixed(1) || '--'}</span>
                  <span className={`font-medium ${getStatusColor(results.ls_status)}`}>
                    {results.ls_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              
              {/* Stability Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-700 block mb-1">Stability Score</span>
                  <span className={`text-4xl font-bold ${getStabilityScoreColor(results.stability_score)}`}>
                    {results.stability_score?.toFixed(0) || '--'}%
                  </span>
                </div>
              </div>
              
              {results.stability_score && (
                <button
                  onClick={saveAnalysis}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Analysis
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Trends</h2>
              </div>
           
            </div>
            
            <div className="space-y-4">
              {Object.keys(trends).map(parameter => (
                <div key={parameter} className="border rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {parameter.toUpperCase()}
                  </h3>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends[parameter]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [value, parameter.toUpperCase()]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={parameter === 'ph' ? '#3B82F6' : parameter === 'lsi' ? '#EF4444' : '#10B981'} 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Suggested Actions</h2>
              </div>
          
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <div key={rec.id || index} className={`border rounded-lg p-4 ${
                  rec.source === 'dynamic' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900">{rec.title}</h3>
                      {rec.source === 'dynamic' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Dynamic
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{rec.type}</span>
                    {rec.source === 'dynamic' && (
                      <span className="text-xs text-blue-600">Based on latest analysis</span>
                    )}
                  </div>
                </div>
              ))}
              
              {recommendations.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No recommendations available. Calculate an analysis to generate recommendations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterAnalysis; 