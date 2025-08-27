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
  RefreshCw,
  Droplets,
  Thermometer,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WaterAnalysis = () => {
  const { user } = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [trends, setTrends] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [analysisType, setAnalysisType] = useState('cooling'); // 'cooling' or 'boiler'
  
  // Input data state - Core parameters for both cooling and boiler water
  const [inputData, setInputData] = useState({
    ph: 7.5,
    tds: 150,
    total_alkalinity: 120,
    hardness: 100,
    chloride: 60,
    temperature: 26,
    hot_temperature: 26,
    sulphate: 0,
    // Boiler water specific parameters
    m_alkalinity: 120,
    p_alkalinity: 0,
    oh_alkalinity: 0,
    sulfite: 0,
    chlorides: 0,
    iron: 0,
    analysis_name: 'Water Analysis',
    notes: ''
  });
  
  // Results state - Updated with all indices
  const [results, setResults] = useState({
    lsi: null,
    rsi: null,
    ls: null,
    psi: null,
    lr: null,
    stability_score: null,
    lsi_status: '',
    rsi_status: '',
    ls_status: '',
    psi_status: '',
    lr_status: '',
    overall_status: ''
  });
  
  // WaterS8 Suggested Actions Tables
  const coolingWaterActions = {
    ph: {
      target: '6.5 – 7.8',
      actions: {
        '< 6.5': 'Water is acidic — corrosion risk. Adjust chemical dosing to raise pH into range.',
        '> 7.8': 'Water is alkaline — scaling risk. Reduce pH using acid feed or adjust dosing.'
      }
    },
    tds: {
      target: '500 – 800',
      actions: {
        '< 500': 'TDS too low — may indicate over-blowdown. Optimize cycles and dosing.',
        '> 800': 'High TDS — scaling risk. Increase blowdown to reduce concentration.'
      }
    },
    hardness: {
      target: '≤ 300',
      actions: {
        '> 300': 'High hardness — risk of scaling. Check softener and adjust treatment chemicals.'
      }
    },
    m_alkalinity: {
      target: '≤ 300',
      actions: {
        '> 300': 'High alkalinity — scaling risk. Adjust chemical program and blowdown.'
      }
    },
    chloride: {
      target: '≤ 250',
      actions: {
        '> 250': 'Chloride level high — corrosion risk. Review makeup water and bleed-off.'
      }
    },
    cycle_of_concentration: {
      target: '5 – 8',
      actions: {
        '< 5': 'Low cycles — may be over-blowing down. Optimize for efficiency.',
        '> 8': 'High cycles — scaling risk. Increase blowdown.'
      }
    },
    iron: {
      target: '≤ 3',
      actions: {
        '> 3': 'High iron — possible corrosion or contamination. Inspect system and check inhibitor.'
      }
    },
    lsi: {
      target: '≈ 0',
      actions: {
        '> 0': 'Positive LSI — scaling tendency. Adjust pH or use scale inhibitor.',
        '< 0': 'Negative LSI — corrosive tendency. Increase pH or alkalinity.'
      }
    },
    rsi: {
      target: '6 – 8',
      actions: {
        '< 6': 'Low RSI — scaling tendency. Increase inhibitor dosage or adjust pH.',
        '> 8': 'High RSI — corrosion risk. Adjust pH and inhibitor dosage.'
      }
    }
  };

  const boilerWaterActions = {
    ph: {
      target: '10.5 – 11.5',
      actions: {
        '< 10.5': 'pH too low — corrosion risk. Adjust chemical feed to raise pH.',
        '> 11.5': 'pH too high — risk of caustic embrittlement. Reduce chemical feed.'
      }
    },
    tds: {
      target: '2500 – 3500',
      actions: {
        '< 2500': 'TDS too low — may indicate over-blowdown. Optimize cycles and dosing.',
        '> 3500': 'TDS too high — risk of carryover and foaming. Increase blowdown.'
      }
    },
    hardness: {
      target: '≤ 2',
      actions: {
        '3 – 5': 'Hardness detected — risk of scaling. Check softener and condensate contamination.',
        '> 5': 'High hardness — risk of scaling. Check softener and condensate contamination.'
      }
    },
    m_alkalinity: {
      target: '250 – 600',
      actions: {
        '< 250': 'M-Alkalinity too low — may lead to corrosion. Increase alkalinity through dosing.',
        '> 600': 'M-Alkalinity too high — may lead to scaling. Reduce alkalinity through blowdown.'
      }
    }
  };

  // Load trends and recommendations only when there are results
  useEffect(() => {
    if (results.overall_status) {
    loadTrends();
    loadRecommendations();
    }
  }, [results.overall_status]);

  // Clear results when analysis type changes
  useEffect(() => {
    // Clear results when switching analysis types
    setResults({
      lsi: null,
      rsi: null,
      ls: null,
      psi: null,
      lr: null,
      stability_score: null,
      lsi_status: '',
      rsi_status: '',
      ls_status: '',
      psi_status: '',
      lr_status: '',
      overall_status: ''
    });
    setTrends({});
    setRecommendations([]);
  }, [analysisType]);
  
  const loadTrends = async () => {
    try {
       const [phTrends, lsiTrends, rsiTrends, psiTrends, lrTrends] = await Promise.all([
        api.get('/water-trends/?parameter=ph'),
        api.get('/water-trends/?parameter=lsi'),
         api.get('/water-trends/?parameter=rsi'),
         api.get('/water-trends/?parameter=psi'),
         api.get('/water-trends/?parameter=lr')
      ]);
      
      setTrends({
        ph: phTrends.data,
        lsi: lsiTrends.data,
         rsi: rsiTrends.data,
         psi: psiTrends.data,
         lr: lrTrends.data
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

  // Clear results when switching analysis types
  const handleAnalysisTypeChange = (newType) => {
    setAnalysisType(newType);
    // Clear previous results when switching types
    setResults({
      lsi: null,
      rsi: null,
      ls: null,
      psi: null,
      lr: null,
      stability_score: null,
      lsi_status: '',
      rsi_status: '',
      ls_status: '',
      psi_status: '',
      lr_status: '',
      overall_status: ''
    });
    // Clear trends and recommendations
    setTrends({});
    setRecommendations([]);
  };

  // Get suggested action based on parameter value and analysis type
  const getSuggestedAction = (parameter, value) => {
    const actionsTable = analysisType === 'cooling' ? coolingWaterActions : boilerWaterActions;
    const parameterActions = actionsTable[parameter];
    
    if (!parameterActions) return null;
    
    for (const [condition, action] of Object.entries(parameterActions.actions)) {
      if (condition.startsWith('<') && value < parseFloat(condition.substring(2))) {
        return action;
      } else if (condition.startsWith('>') && value > parseFloat(condition.substring(2))) {
        return action;
      } else if (condition.startsWith('≥') && value >= parseFloat(condition.substring(2))) {
        return action;
      } else if (condition.startsWith('≤') && value <= parseFloat(condition.substring(2))) {
        return action;
      }
    }
    
    return null;
  };
  
  const calculateAnalysis = async () => {
    setCalculating(true);
    try {
      // Prepare request data based on analysis type
      let requestData = {
        analysis_type: analysisType
      };
      
      if (analysisType === 'boiler') {
        // For boiler water, only send the 4 required fields
        requestData = {
          ...requestData,
          ph: inputData.ph,
          tds: inputData.tds,
          hardness: inputData.hardness,
          m_alkalinity: inputData.m_alkalinity
        };
      } else {
        // For cooling water, send all required fields
        requestData = {
          ...requestData,
          ...inputData
        };
      }
      
      const response = await api.post('/calculate-water-analysis-with-recommendations/', requestData);
      
      console.log('API Response:', response.data);
      console.log('Analysis Type:', analysisType);
      
      // Handle different response structures for cooling vs boiler water
      if (analysisType === 'boiler') {
        // For boiler water, response has calculation and recommendations
        setResults({
          lsi: null,
          rsi: null,
          ls: null,
          psi: null,
          lr: null,
          stability_score: response.data.calculation.stability_score,
          lsi_status: '',
          ls_status: '',
          psi_status: '',
          lr_status: '',
          overall_status: response.data.calculation.overall_status
        });
        setRecommendations(response.data.recommendations || []); // Boiler water has recommendations
      } else {
        // For cooling water, response has calculation and recommendations
      setResults(response.data.calculation);
      setRecommendations(response.data.recommendations);
        // Only load trends for cooling water
        await loadTrends();
      }
      
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

  // Get status color based on exact status descriptions from images
  const getStatusColor = (status) => {
    if (status.includes('Near Balance') || status.includes('Little scale or corrosion') || 
        status.includes('Water is in optimal range') || status.includes('will not interfere')) {
        return 'text-green-600';
    } else if (status.includes('Corrosion') || status.includes('corrode') || 
               status.includes('Scale') || status.includes('scale') || 
               status.includes('interfere') || status.includes('high corrosion rates')) {
        return 'text-red-600';
    } else if (status.includes('Moderate') || status.includes('may interfere')) {
        return 'text-yellow-600';
    }
        return 'text-gray-600';
  };
  
  const getStatusIcon = (status) => {
    if (status.includes('Near Balance') || status.includes('Little scale or corrosion') || 
        status.includes('Water is in optimal range') || status.includes('will not interfere')) {
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status.includes('Corrosion') || status.includes('corrode') || 
               status.includes('Scale') || status.includes('scale') || 
               status.includes('interfere') || status.includes('high corrosion rates')) {
        return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (status.includes('Moderate') || status.includes('may interfere')) {
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
        return <Info className="w-5 h-5 text-gray-600" />;
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
          <p className="text-gray-600">Analyze water parameters and calculate stability indices using WaterS8 standards</p>
        </div>

        {/* Analysis Type Selector */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Analysis Type:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAnalysisTypeChange('cooling')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    analysisType === 'cooling'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Droplets className="w-4 h-4 inline mr-2" />
                  Cooling Water
                </button>
                <button
                  onClick={() => handleAnalysisTypeChange('boiler')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    analysisType === 'boiler'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Thermometer className="w-4 h-4 inline mr-2" />
                  Boiler Water
                </button>
              </div>
            </div>
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS (ppm)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={inputData.tds}
                  onChange={(e) => handleInputChange('tds', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {analysisType === 'cooling' && (
                <>
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
                </>
              )}
              
              {analysisType === 'boiler' && (
                <>
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
                </>
              )}
              
              {analysisType === 'cooling' && (
                <>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sulphate (ppm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={inputData.sulphate}
                      onChange={(e) => handleInputChange('sulphate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basin Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hot Side Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={inputData.hot_temperature || inputData.temperature}
                      onChange={(e) => handleInputChange('hot_temperature', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}



              {analysisType === 'boiler' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">M-Alkalinity as CaCO₃ (ppm)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={inputData.m_alkalinity}
                      onChange={(e) => handleInputChange('m_alkalinity', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
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
              {/* Show water indices only for cooling water */}
              {analysisType === 'cooling' && (
                <>
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">LSI (Langelier Saturation Index)</span>
                  {results.lsi_status && getStatusIcon(results.lsi_status)}
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-2xl font-bold">{results.lsi?.toFixed(1) || '--'}</span>
                  <span className={`text-sm font-medium ${getStatusColor(results.lsi_status)} leading-tight`}>
                    {results.lsi_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">RSI (Ryznar Stability Index)</span>
                  {results.rsi_status && getStatusIcon(results.rsi_status)}
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-2xl font-bold">{results.rsi?.toFixed(1) || '--'}</span>
                  <span className={`text-sm font-medium ${getStatusColor(results.rsi_status)} leading-tight`}>
                    {results.rsi_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              


              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">PSI (Puckorius Scaling Index)</span>
                  {results.psi_status && getStatusIcon(results.psi_status)}
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-2xl font-bold">{results.psi?.toFixed(1) || '--'}</span>
                  <span className={`text-sm font-medium ${getStatusColor(results.psi_status)} leading-tight`}>
                    {results.psi_status || 'Not calculated'}
                  </span>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">LR (Langelier Ratio)</span>
                  {results.lr_status && getStatusIcon(results.lr_status)}
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-2xl font-bold">
                    {results.lr ? 
                      (results.lr > 100 || results.lr < -100 ? 
                        'High Risk' : 
                        results.lr.toFixed(2)
                      ) : '--'
                    }
                  </span>
                  <span className={`text-sm font-medium ${getStatusColor(results.lr_status)} leading-tight`}>
                    {results.lr_status || 'Not calculated'}
                  </span>
                </div>
                </div>
                </>
              )}
              
              {/* Show boiler water specific message and status */}
              {analysisType === 'boiler' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-blue-700 block mb-2">Boiler Water Analysis</span>
                      <span className="text-sm text-blue-600">
                        Analysis completed using the simplified 4-parameter scoring system (pH, TDS, Hardness, M-Alkalinity)
                  </span>
                </div>
              </div>
                  
                  {/* Boiler Water Overall Status */}
                  {results.overall_status && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-700 block mb-2">Overall Status</span>
                        <span className={`text-2xl font-bold ${getStatusColor(results.overall_status)}`}>
                          {results.overall_status}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
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
          
          {/* Trends - Only show for cooling water when there are trends data */}
          {analysisType === 'cooling' && Object.keys(trends).length > 0 && (
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
          )}
        </div>

        {/* WaterS8 Suggested Actions Table - Show for both cooling and boiler water when there are results */}
        {results.overall_status && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    WaterS8 {analysisType === 'cooling' ? 'Cooling Water' : 'Boiler Water'} Suggested Actions
                  </h2>
          </div>
        </div>
        
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parameter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Suggested Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(analysisType === 'cooling' ? coolingWaterActions : boilerWaterActions).map(([param, config]) => {
                      const currentValue = inputData[param] || 0;
                      const suggestedAction = getSuggestedAction(param, currentValue);
                      const isOutOfRange = suggestedAction !== null;
                      
                      return (
                        <tr key={param} className={isOutOfRange ? 'bg-red-50' : 'bg-green-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {param.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {config.target}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {currentValue}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {suggestedAction ? (
                              <div className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                                <span className="text-red-700">{suggestedAction}</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-green-700">Within target range</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* AI-Generated Recommendations - Only show when there are recommendations */}
        {recommendations.length > 0 && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">AI-Generated Recommendations</h2>
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
              </div>
            </div>
                </div>
              )}
      </div>
    </div>
  );
};

export default WaterAnalysis; 