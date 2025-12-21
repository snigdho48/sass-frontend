import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import api from '../services/api';
import { dataService } from '../services/dataService';
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
import SearchableSelect from '../components/SearchableSelect';
import LoadingOverlay from '../components/LoadingOverlay';

const WaterAnalysis = () => {
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  // All hooks must be declared at the top level before any early returns
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [trends, setTrends] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [recommendations, setRecommendations] = useState([]);
  const [analysisType, setAnalysisType] = useState(null); // 'cooling' or 'boiler' - no default, must be selected
  const [plants, setPlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedWaterSystem, setSelectedWaterSystem] = useState(null);
  const [waterSystems, setWaterSystems] = useState([]);
  const [waterSystemsLoading, setWaterSystemsLoading] = useState(false);
  const [plantParameters, setPlantParameters] = useState(null);
  const [plantDetailsLoading, setPlantDetailsLoading] = useState(false);
  
  // Input data state - Core parameters for both cooling and boiler water
  const [inputData, setInputData] = useState({
    ph: '',
    tds: '',
    total_alkalinity: '',
    hardness: '',
    chloride: '',
    temperature: '',
    hot_temperature: '',
    cycle: '',
    iron: '',
    phosphate: '', // For cooling water
    // Boiler water specific parameters
    m_alkalinity: '',
    p_alkalinity: '',
    oh_alkalinity: '',
    sulphite: '',
    sodium_chloride: '',
    do: '', // Dissolved Oxygen
    boiler_phosphate: '', // For boiler water
    analysis_name: 'Water Analysis',
    notes: ''
  });
  
  // Results state - Updated with all indices
  const [results, setResults] = useState({
    lsi: null,
    rsi: null,
    stability_score: null,
    lsi_status: '',
    rsi_status: '',
    overall_status: ''
  });

  // Add error handling and loading state resets
  const resetLoadingStates = useCallback(() => {
    setPlantsLoading(false);
    setPlantDetailsLoading(false);
    setCalculating(false);
    setLoading(false);
  }, []);

  const resetAllData = useCallback(() => {
    setResults({});
    setTrends({});
    setRecommendations([]);
    setInputData({
      ph: '',
      tds: '',
      total_alkalinity: '',
      hardness: '',
      chloride: '',
      temperature: '',
      hot_temperature: '',
      cycle: '',
      iron: '',
      sulphate: '',
      m_alkalinity: '',
      p_alkalinity: '',
      oh_alkalinity: '',
      sulphite: '',
      sodium_chloride: ''
    });
  }, []);

  // Check if all trends data is empty
  const areAllTrendsEmpty = useCallback(() => {
    if (Object.keys(trends).length === 0) return true;
    
    return Object.values(trends).every(trendData => 
      !trendData || trendData.length === 0
    );
  }, [trends]);

  const handleError = useCallback((error, context) => {
    console.error(`${context} error:`, error);
    toast.error(`${context} failed. Please try again.`);
    resetLoadingStates();
  }, [resetLoadingStates]);

  // Check if all required fields are filled (only for parameters available for the selected water system)
  const areRequiredFieldsFilled = useCallback(() => {
    if (!selectedPlant || !analysisType || !selectedWaterSystem) return false;
    
    // Build required fields from plantParameters (only available fields)
    const requiredFields = [];
    if (analysisType === 'cooling') {
      if (plantParameters?.ph) requiredFields.push('ph');
      if (plantParameters?.tds) requiredFields.push('tds');
      if (plantParameters?.alkalinity) requiredFields.push('total_alkalinity');
      if (plantParameters?.hardness) requiredFields.push('hardness');
      // Temperature inputs are required only if we can compute indices (need all four above)
      const needsTemp = plantParameters?.ph && plantParameters?.tds && plantParameters?.alkalinity && plantParameters?.hardness;
      if (needsTemp) {
        requiredFields.push('temperature', 'hot_temperature');
      }
      if (plantParameters?.chloride) requiredFields.push('chloride');
      if (plantParameters?.cycle) requiredFields.push('cycle');
      if (plantParameters?.iron) requiredFields.push('iron');
    } else {
      if (plantParameters?.ph) requiredFields.push('ph');
      if (plantParameters?.tds) requiredFields.push('tds');
      if (plantParameters?.hardness) requiredFields.push('hardness');
      if (plantParameters?.alkalinity) requiredFields.push('m_alkalinity');
      if (plantParameters?.p_alkalinity) requiredFields.push('p_alkalinity');
      if (plantParameters?.oh_alkalinity) requiredFields.push('oh_alkalinity');
      if (plantParameters?.sulphite) requiredFields.push('sulphite');
      if (plantParameters?.sodium_chloride) requiredFields.push('sodium_chloride');
      if (plantParameters?.iron) requiredFields.push('iron');
      if (plantParameters?.do) requiredFields.push('do');
      if (plantParameters?.boiler_phosphate) requiredFields.push('boiler_phosphate');
    }
    if (requiredFields.length === 0) return false;
    return requiredFields.every(field => inputData[field] !== '' && inputData[field] !== null && inputData[field] !== undefined);
  }, [selectedPlant, selectedWaterSystem, analysisType, inputData, plantParameters]);

  const loadPlants = useCallback(async () => {
    try {
      setPlantsLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const plantsData = await Promise.race([
        dataService.getPlants(),
        timeoutPromise
      ]);
      
      // Ensure plantsData is an array
      if (Array.isArray(plantsData)) {
        setPlants(plantsData);
      } else if (plantsData && Array.isArray(plantsData.results)) {
        setPlants(plantsData.results);
      } else {
        console.warn('Plants data is not in expected format:', plantsData);
        setPlants([]);
      }
    } catch (error) {
      handleError(error, 'Loading plants');
      setPlants([]);
    } finally {
      setPlantsLoading(false);
    }
  }, [handleError]);

  const loadTrends = useCallback(async () => {
    if (!selectedPlant) {
      setTrends({});
      return;
    }
    
    try {
      const [phTrends, lsiTrends, rsiTrends] = await Promise.all([
        api.get(`/water-trends/?parameter=ph&plant_id=${selectedPlant.id}`),
        api.get(`/water-trends/?parameter=lsi&plant_id=${selectedPlant.id}`),
        api.get(`/water-trends/?parameter=rsi&plant_id=${selectedPlant.id}`),
      ]);
      
      setTrends({
        ph: phTrends.data,
        lsi: lsiTrends.data,
         rsi: rsiTrends.data,
       
      });
    } catch (error) {
      handleError(error, 'Loading trends');
    }
  }, [handleError, selectedPlant]);
  
  const loadRecommendations = useCallback(async () => {
    try {
      // const response = await api.get('/water-recommendations/');
      // setRecommendations(response.data);
      setRecommendations([]);
    } catch (error) {
      handleError(error, 'Loading recommendations');
    }
  }, [handleError]);

  // Check if user is inactive general user - show error and redirect
  useEffect(() => {
    if (user?.is_general_user && !user?.is_active) {
      toast.error('Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Load plants on component mount (only if user is authenticated)
  useEffect(() => {
    let isMounted = true;
    
    if (user?.id && isMounted) {
      loadPlants();
    } else if (!user?.id) {
      // Reset states when user is not authenticated
      resetLoadingStates();
      setPlants([]);
      setSelectedPlant(null);
      setPlantParameters(null);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, loadPlants, resetLoadingStates]); // Only trigger when user.id changes

  // Reset everything when plant selection changes
  useEffect(() => {
    resetAllData();
  }, [selectedPlant, resetAllData]);

  // Load trends and recommendations only when there are results
  useEffect(() => {
    if (results.overall_status) {
      loadTrends();
      loadRecommendations();
    }
  }, [results.overall_status, loadTrends, loadRecommendations]);

  // Clear results when analysis type changes
  useEffect(() => {
    resetAllData();
  }, [analysisType, resetAllData]);

  // Cleanup effect to reset loading states on unmount
  useEffect(() => {
    return () => {
      resetLoadingStates();
    };
  }, [resetLoadingStates]);

  // Recompute plantParameters when analysis type changes (if a plant is selected)
  useEffect(() => {
    if (!selectedPlant || !analysisType) return;
    try {
      const plantDetails = selectedPlant;
      const params = analysisType === 'cooling' ? {
        // Only include parameters that have values
        ...(plantDetails.cooling_ph_min != null && plantDetails.cooling_ph_max != null && { ph: { min: plantDetails.cooling_ph_min, max: plantDetails.cooling_ph_max } }),
        ...(plantDetails.cooling_tds_min != null && plantDetails.cooling_tds_max != null && { tds: { min: plantDetails.cooling_tds_min, max: plantDetails.cooling_tds_max } }),
        ...(plantDetails.cooling_hardness_max != null && { hardness: { max: plantDetails.cooling_hardness_max } }),
        ...(plantDetails.cooling_alkalinity_max != null && { alkalinity: { max: plantDetails.cooling_alkalinity_max } }),
        ...(plantDetails.cooling_chloride_enabled && plantDetails.cooling_chloride_max != null && { chloride: { max: plantDetails.cooling_chloride_max } }),
        ...(plantDetails.cooling_cycle_enabled && plantDetails.cooling_cycle_min != null && plantDetails.cooling_cycle_max != null && { cycle: { min: plantDetails.cooling_cycle_min, max: plantDetails.cooling_cycle_max } }),
        ...(plantDetails.cooling_iron_enabled && plantDetails.cooling_iron_max != null && { iron: { max: plantDetails.cooling_iron_max } }),
        ...(plantDetails.cooling_lsi_enabled && plantDetails.cooling_lsi_min != null && plantDetails.cooling_lsi_max != null && { lsi: { min: plantDetails.cooling_lsi_min, max: plantDetails.cooling_lsi_max } }),
        ...(plantDetails.cooling_rsi_enabled && plantDetails.cooling_rsi_min != null && plantDetails.cooling_rsi_max != null && { rsi: { min: plantDetails.cooling_rsi_min, max: plantDetails.cooling_rsi_max } })
      } : {
        // Only include parameters that have values
        ...(plantDetails.boiler_ph_min != null && plantDetails.boiler_ph_max != null && { ph: { min: plantDetails.boiler_ph_min, max: plantDetails.boiler_ph_max } }),
        ...(plantDetails.boiler_tds_min != null && plantDetails.boiler_tds_max != null && { tds: { min: plantDetails.boiler_tds_min, max: plantDetails.boiler_tds_max } }),
        ...(plantDetails.boiler_hardness_max != null && { hardness: { max: plantDetails.boiler_hardness_max } }),
        ...(plantDetails.boiler_alkalinity_min != null && plantDetails.boiler_alkalinity_max != null && { alkalinity: { min: plantDetails.boiler_alkalinity_min, max: plantDetails.boiler_alkalinity_max } }),
        ...(plantDetails.boiler_p_alkalinity_enabled && plantDetails.boiler_p_alkalinity_min != null && plantDetails.boiler_p_alkalinity_max != null && { p_alkalinity: { min: plantDetails.boiler_p_alkalinity_min, max: plantDetails.boiler_p_alkalinity_max } }),
        ...(plantDetails.boiler_oh_alkalinity_enabled && plantDetails.boiler_oh_alkalinity_min != null && plantDetails.boiler_oh_alkalinity_max != null && { oh_alkalinity: { min: plantDetails.boiler_oh_alkalinity_min, max: plantDetails.boiler_oh_alkalinity_max } }),
        ...(plantDetails.boiler_sulphite_enabled && plantDetails.boiler_sulphite_min != null && plantDetails.boiler_sulphite_max != null && { sulphite: { min: plantDetails.boiler_sulphite_min, max: plantDetails.boiler_sulphite_max } }),
        ...(plantDetails.boiler_sodium_chloride_enabled && plantDetails.boiler_sodium_chloride_max != null && { sodium_chloride: { max: plantDetails.boiler_sodium_chloride_max } }),
        ...(plantDetails.boiler_iron_enabled && plantDetails.boiler_iron_max != null && { iron: { max: plantDetails.boiler_iron_max } }),
        ...(plantDetails.boiler_do_enabled && plantDetails.boiler_do_min != null && plantDetails.boiler_do_max != null && { do: { max: plantDetails.boiler_do_max } }),
        ...(plantDetails.boiler_phosphate_enabled && plantDetails.boiler_phosphate_min != null && plantDetails.boiler_phosphate_max != null && { boiler_phosphate: { min: plantDetails.boiler_phosphate_min, max: plantDetails.boiler_phosphate_max } })
      };
      setPlantParameters(params);
    } catch (e) {
      // noop
    }
  }, [analysisType, selectedPlant]);

  // Early return if inactive general user (prevents rendering the component)
  if (user?.is_general_user && !user?.is_active) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Account Inactive</h2>
          <p className="text-red-700">
            Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.
          </p>
        </div>
      </div>
    );
  }
  
  // Get plant-specific actions or use defaults
  const getCoolingWaterActions = () => {
    // Default actions that are always included
    const defaultActions = {
      ph: {
        target: '6.5 – 7.8',
        actions: {
          '< 6.5': 'Adjust chemical dosing & blowdown to bring the pH into range.',
          '> 7.8': 'Reduce pH by blowdown or adjust chemical dosing.'
        }
      },
      tds: {
        target: '400 – 800',
        actions: {
          '< 400': 'TDS too low — may indicate over-blowdown. Optimize cycles and adjust chemical dosing.',
          '> 800': 'High TDS. Increase blowdown to reduce concentration.'
        }
      },
      hardness: {
        target: '≤ 300',
        actions: {
          '> 300': 'High hardness — Scaling tendency. Check incoming water and adjust chemical dosing.'
        }
      },
      m_alkalinity: {
        target: '≤ 300',
        actions: {
          '> 300': 'High alkalinity. Adjust chemical dosing and blowdown.'
        }
      },
      lsi: {
        target: "-2 < -0.5",
        actions: {
          "< -0.5": "Corrosion tendency.",
          "-0.5<0": "Slightly corrosion tendency but no scaling tendency.",
          "0": "Balanced.",
          "0<0.5": "Slightly scale forming.",
          ">2": "Heavy Scale forming but no corrosion tendency."
        }
      },
      rsi: {
        target: "4.0-5.0",
        actions: {
          "4.8": "Heavy Scale tendency.",
          "5.0-6.0": "Light Scale tendency.",
          "6.0-7.0": "Light Scale or corrosion tendency.",
          "7.0-7.5": "Corrosion tendency.",
          "7.5-9.0": "Heavy corrosion tendency.",
          ">9.0": "Intolerable corrosion tendency"
        }
      }
    };

    if (plantParameters) {
      return {
        ...defaultActions,
        // Override with plant-specific parameters if available
        ...(plantParameters.ph && {
          ph: {
            target: `${plantParameters.ph.min} – ${plantParameters.ph.max}`,
            actions: {
              [`< ${plantParameters.ph.min}`]:
                "Adjust chemical dosing & blowdown to bring the pH into range.",
              [`> ${plantParameters.ph.max}`]:
                "Reduce pH by blowdown or adjust chemical dosing.",
            },
          },
        }),
        ...(plantParameters.tds && {
          tds: {
            target: `${plantParameters.tds.min} – ${plantParameters.tds.max}`,
            actions: {
              [`< ${plantParameters.tds.min}`]:
                "TDS too low — may indicate over-blowdown. Optimize cycles and adjust chemical dosing.",
              [`> ${plantParameters.tds.max}`]:
                "High TDS. Increase blowdown to reduce concentration.",
            },
          },
        }),
        ...(plantParameters.hardness && {
          hardness: {
            target: `≤ ${plantParameters.hardness.max}`,
            actions: {
              [`> ${plantParameters.hardness.max}`]:
                "High hardness — Scaling tendency. Check incoming water and adjust chemical dosing.",
            },
          },
        }),
        ...(plantParameters.alkalinity && {
          m_alkalinity: {
            target: `≤ ${plantParameters.alkalinity.max}`,
            actions: {
              [`> ${plantParameters.alkalinity.max}`]:
                "High alkalinity. Adjust chemical dosing and blowdown.",
            },
          },
        }),
        // Add optional parameters only if enabled
        ...(plantParameters.chloride && {
          chloride: {
            target: `≤ ${plantParameters.chloride.max}`,
            actions: {
              [`> ${plantParameters.chloride.max}`]:
                "Chloride level high. Check make-up water and blowdown.",
            },
          },
        }),
        ...(plantParameters.cycle && {
          cycle: {
            target: `${plantParameters.cycle.min} – ${plantParameters.cycle.max}`,
            actions: {
              [`< ${plantParameters.cycle.min}`]: 'Low cycles — may be over-blowing down. Optimize for efficiency.',
              [`> ${plantParameters.cycle.max}`]: 'High cycles. Increase blowdown.'
            }
          }
        }),
        ...(plantParameters.iron && {
          iron: {
            target: `≤ ${plantParameters.iron.max}`,
            actions: {
              [`> ${plantParameters.iron.max}`]: 'High iron — possible corrosion or contamination. Inspect system and adjust chemical dosing.'
            }
          }
        }),
        ...(plantParameters.lsi && {
          lsi: {
            target: `${plantParameters.lsi.min} – ${plantParameters.lsi.max}`,
            actions: {
              [`< ${plantParameters.lsi.min}`]: "Corrosion tendency.",
              [`${plantParameters.lsi.min}-0`]: "Slightly corrosion tendency but no scaling tendency.",
              "0": "Balanced.",
              [`0-${plantParameters.lsi.max}`]: "Slightly scale forming.",
              [`>${plantParameters.lsi.max}`]: "Heavy Scale forming but no corrosion tendency."
            }
          }
        }),
        ...(plantParameters.rsi && (() => {
          const rsiMinNum = parseFloat(plantParameters.rsi.min);
          const rsiMaxNum = parseFloat(plantParameters.rsi.max);
          if (!Number.isFinite(rsiMinNum) || !Number.isFinite(rsiMaxNum)) return {};
          return {
            rsi: {
              target: `${rsiMinNum} – ${rsiMaxNum}`,
              actions: {
                [`<${rsiMinNum}`]: "Heavy Scale tendency.",
                [`${rsiMinNum}-${rsiMaxNum}`]: "Light Scale or corrosion tendency.",
                [`>${rsiMaxNum}`]: "Heavy corrosion tendency.",
                [`>${rsiMaxNum + 2}`]: "Intolerable corrosion tendency"
              }
            }
          };
        })())
      };
    }
    
    // Return default actions when no plant parameters
    return defaultActions;
  };

  const getBoilerWaterActions = () => {
    // Default actions that are always included
    const defaultActions = {
      ph: {
        target: '11.0 – 12.0',
        actions: {
          '< 11.0': 'Low pH. Adjust chemical dosing to raise pH.',
          '> 12.0': 'High pH — Reduce chemical dosing & Increase blowdown.'
        }
      },
      tds: {
        target: '< 3500',
        actions: {
          '> 3500': 'TDS too high — risk of carryover and foaming. Increase blowdown.'
        }
      },
      hardness: {
        target: '< 5',
        actions: {
          '≥ 5': 'Hardness detected — risk of scaling. Check softener and condensate contamination.'
        }
      },
      m_alkalinity: {
        target: '≥ 600',
        actions: {
          '< 600': 'M-Alkalinity too low — Increase alkalinity through chemical dosing.'
        }
      }
    };

    if (plantParameters) {
      return {
        ...defaultActions,
        // Override with plant-specific parameters if available
        ph: {
          target: `${plantParameters.ph.min} – ${plantParameters.ph.max}`,
          actions: {
            [`< ${plantParameters.ph.min}`]: 'Low pH. Adjust chemical dosing to raise pH.',
            [`> ${plantParameters.ph.max}`]: 'High pH — Reduce chemical dosing & Increase blowdown.'
          }
        },
        tds: {
          target: `< ${plantParameters.tds.max}`,
          actions: {
            [`> ${plantParameters.tds.max}`]: 'TDS too high — risk of carryover and foaming. Increase blowdown.'
          }
        },
        hardness: {
          target: `< ${plantParameters.hardness.max}`,
          actions: {
            [`≥ ${plantParameters.hardness.max}`]: 'Hardness detected — risk of scaling. Check softener and condensate contamination.'
          }
        },
        m_alkalinity: {
          target: `≥ ${plantParameters.alkalinity.min}`,
          actions: {
            [`< ${plantParameters.alkalinity.min}`]: 'M-Alkalinity too low — Increase alkalinity through chemical dosing.'
          }
        },
        // Add optional parameters only if enabled
        ...(plantParameters.p_alkalinity && {
          p_alkalinity: {
            target: `≥ ${plantParameters.p_alkalinity.min}`,
            actions: {
              [`< ${plantParameters.p_alkalinity.min}`]: 'P-Alkalinity too low — risk of under-treatment. Increase chemical dosing.'
            }
          }
        }),
        ...(plantParameters.oh_alkalinity && {
          oh_alkalinity: {
            target: `≥ ${plantParameters.oh_alkalinity.min}`,
            actions: {
              [`< ${plantParameters.oh_alkalinity.min}`]: 'OH-Alkalinity too low — insufficient alkalinity reserve. Increase chemical dosing.'
            }
          }
        }),
        ...(plantParameters.sulphite && {
          sulphite: {
            target: `${plantParameters.sulphite.min} – ${plantParameters.sulphite.max}`,
            actions: {
              [`< ${plantParameters.sulphite.min}`]: 'sulphite too low — oxygen scavenging inadequate. Increase chemical dosing.',
              [`> ${plantParameters.sulphite.max}`]: 'sulphite too high — may cause excess solids. Reduce chemical dosing.'
            }
          }
        }),
        ...(plantParameters.sodium_chloride && {
          sodium_chloride: {
            target: `≤ ${plantParameters.sodium_chloride.max}`,
            actions: {
              [`> ${plantParameters.sodium_chloride.max}`]: 'sodium_chloride high — possible contamination. Investigate feedwater.'
            }
          }
        }),
        ...(plantParameters.iron && {
          iron: {
            target: `< ${plantParameters.iron.max}`,
            actions: {
              [`≥ ${plantParameters.iron.max}`]: 'High iron — possible active corrosion. Inspect system.'
            }
          }
        }),
        ...(plantParameters.do && {
          do: {
            target: `< ${plantParameters.do.max}`,
            actions: {
              [`> ${plantParameters.do.max}`]: 'DO (Dissolved Oxygen) too high — risk of corrosion. Check deaerator and oxygen scavenger dosing.'
            }
          }
        }),
        ...(plantParameters.boiler_phosphate && {
          boiler_phosphate: {
            target: `${plantParameters.boiler_phosphate.min} – ${plantParameters.boiler_phosphate.max}`,
            actions: {
              [`< ${plantParameters.boiler_phosphate.min}`]: 'Phosphate too low — insufficient scale prevention. Increase chemical dosing.',
              [`> ${plantParameters.boiler_phosphate.max}`]: 'Phosphate too high — may cause excess solids. Reduce chemical dosing.'
            }
          }
        })
      };
    }
    
    // Return default actions when no plant parameters
    return defaultActions;
  };
  
  const handleInputChange = (field, value) => {
    // Handle empty string values properly
    const finalValue = value === '' ? '' : value;
    setInputData(prev => ({
      ...prev,
      [field]: finalValue
    }));
  };

  const handlePlantChange = async (plant) => {
    if (!plant) {
      setSelectedPlant(null);
      setAnalysisType(null);
      setSelectedWaterSystem(null);
      setWaterSystems([]);
      setPlantParameters(null);
      return;
    }

    try {
      setPlantDetailsLoading(true);
      setWaterSystemsLoading(true);
      
      // Get full plant details from API
      const plantDetails = await dataService.getPlant(plant.id);
      setSelectedPlant(plantDetails);
      
      // Reset analysis type and water system when plant changes
      setAnalysisType(null);
      setSelectedWaterSystem(null);
      setPlantParameters(null);
      
      // Load water systems for this plant (don't filter yet - wait for analysis type selection)
      try {
        const systems = await dataService.getWaterSystemsByPlant(plant.id);
        setWaterSystems(systems);
      } catch (error) {
        console.error('Error loading water systems:', error);
        setWaterSystems([]);
      }
    } catch (error) {
      handleError(error, 'Loading plant details');
      setSelectedPlant(null);
      setAnalysisType(null);
      setSelectedWaterSystem(null);
      setPlantParameters(null);
    } finally {
      setPlantDetailsLoading(false);
      setWaterSystemsLoading(false);
    }
  };

  const handleWaterSystemChange = async (waterSystem) => {
    if (!waterSystem) {
      setSelectedWaterSystem(null);
      setPlantParameters(null);
      return;
    }

    try {
      setPlantDetailsLoading(true);
      setSelectedWaterSystem(waterSystem);
      
      // Get parameters from the water system based on system type
      const params = waterSystem.system_type === 'cooling' 
        ? waterSystem.get_cooling_parameters?.() || {
            ...(waterSystem.cooling_ph_min != null && waterSystem.cooling_ph_max != null && { ph: { min: waterSystem.cooling_ph_min, max: waterSystem.cooling_ph_max } }),
            ...(waterSystem.cooling_tds_min != null && waterSystem.cooling_tds_max != null && { tds: { min: waterSystem.cooling_tds_min, max: waterSystem.cooling_tds_max } }),
            ...(waterSystem.cooling_hardness_max != null && { hardness: { max: waterSystem.cooling_hardness_max } }),
            ...(waterSystem.cooling_alkalinity_max != null && { alkalinity: { max: waterSystem.cooling_alkalinity_max } }),
            ...(waterSystem.cooling_chloride_enabled && waterSystem.cooling_chloride_max != null && { chloride: { max: waterSystem.cooling_chloride_max } }),
            ...(waterSystem.cooling_cycle_enabled && waterSystem.cooling_cycle_min != null && waterSystem.cooling_cycle_max != null && { cycle: { min: waterSystem.cooling_cycle_min, max: waterSystem.cooling_cycle_max } }),
            ...(waterSystem.cooling_iron_enabled && waterSystem.cooling_iron_max != null && { iron: { max: waterSystem.cooling_iron_max } }),
            ...(waterSystem.cooling_phosphate_enabled && waterSystem.cooling_phosphate_max != null && { phosphate: { max: waterSystem.cooling_phosphate_max } }),
            ...(waterSystem.cooling_lsi_enabled && waterSystem.cooling_lsi_min != null && waterSystem.cooling_lsi_max != null && { lsi: { min: waterSystem.cooling_lsi_min, max: waterSystem.cooling_lsi_max } }),
            ...(waterSystem.cooling_rsi_enabled && waterSystem.cooling_rsi_min != null && waterSystem.cooling_rsi_max != null && { rsi: { min: waterSystem.cooling_rsi_min, max: waterSystem.cooling_rsi_max } })
          }
        : waterSystem.get_boiler_parameters?.() || {
            ...(waterSystem.boiler_ph_min != null && waterSystem.boiler_ph_max != null && { ph: { min: waterSystem.boiler_ph_min, max: waterSystem.boiler_ph_max } }),
            ...(waterSystem.boiler_tds_min != null && waterSystem.boiler_tds_max != null && { tds: { min: waterSystem.boiler_tds_min, max: waterSystem.boiler_tds_max } }),
            ...(waterSystem.boiler_hardness_max != null && { hardness: { max: waterSystem.boiler_hardness_max } }),
            ...(waterSystem.boiler_alkalinity_min != null && waterSystem.boiler_alkalinity_max != null && { alkalinity: { min: waterSystem.boiler_alkalinity_min, max: waterSystem.boiler_alkalinity_max } }),
            ...(waterSystem.boiler_p_alkalinity_enabled && waterSystem.boiler_p_alkalinity_min != null && waterSystem.boiler_p_alkalinity_max != null && { p_alkalinity: { min: waterSystem.boiler_p_alkalinity_min, max: waterSystem.boiler_p_alkalinity_max } }),
            ...(waterSystem.boiler_oh_alkalinity_enabled && waterSystem.boiler_oh_alkalinity_min != null && waterSystem.boiler_oh_alkalinity_max != null && { oh_alkalinity: { min: waterSystem.boiler_oh_alkalinity_min, max: waterSystem.boiler_oh_alkalinity_max } }),
            ...(waterSystem.boiler_sulphite_enabled && waterSystem.boiler_sulphite_min != null && waterSystem.boiler_sulphite_max != null && { sulphite: { min: waterSystem.boiler_sulphite_min, max: waterSystem.boiler_sulphite_max } }),
            ...(waterSystem.boiler_sodium_chloride_enabled && waterSystem.boiler_sodium_chloride_max != null && { sodium_chloride: { max: waterSystem.boiler_sodium_chloride_max } }),
            ...(waterSystem.boiler_iron_enabled && waterSystem.boiler_iron_max != null && { iron: { max: waterSystem.boiler_iron_max } }),
            ...(waterSystem.boiler_do_enabled && waterSystem.boiler_do_min != null && waterSystem.boiler_do_max != null && { do: { min: waterSystem.boiler_do_min, max: waterSystem.boiler_do_max } }),
            ...(waterSystem.boiler_phosphate_enabled && waterSystem.boiler_phosphate_min != null && waterSystem.boiler_phosphate_max != null && { boiler_phosphate: { min: waterSystem.boiler_phosphate_min, max: waterSystem.boiler_phosphate_max } })
          };
      
      setPlantParameters(params);
      // Update analysis type based on water system type
      if (waterSystem.system_type !== analysisType) {
        setAnalysisType(waterSystem.system_type);
      }
    } catch (error) {
      handleError(error, 'Loading water system details');
      setSelectedWaterSystem(null);
      setPlantParameters(null);
    } finally {
      setPlantDetailsLoading(false);
    }
  };

  // Clear results when switching analysis types
  const handleAnalysisTypeChange = (newType) => {
    setAnalysisType(newType);
    // Clear water system selection when switching types
    setSelectedWaterSystem(null);
    setPlantParameters(null);
    // Clear input data when switching types
    setInputData({
      ph: '',
      tds: '',
      total_alkalinity: '',
      hardness: '',
      chloride: '',
      temperature: '',
      hot_temperature: '',
      cycle: '',
      iron: '',
      sulphate: '',
      phosphate: '',
      // Boiler water specific parameters
      m_alkalinity: '',
      p_alkalinity: '',
      oh_alkalinity: '',
      sulphite: '',
      sodium_chloride: '',
      do: '',
      boiler_phosphate: '',
      analysis_name: 'Water Analysis',
      notes: ''
    });
    // Clear previous results when switching types
    setResults({
      lsi: null,
      rsi: null,
      lr: null,
      stability_score: null,
      lsi_status: '',
      rsi_status: '',
      lr_status: '',
      overall_status: ''
    });
    // Clear trends and recommendations
    setTrends({});
    setRecommendations([]);
  };

  // Get suggested action based on parameter value and analysis type
  const getSuggestedAction = (parameter, value) => {
    const actionsTable = analysisType === 'cooling' ? getCoolingWaterActions() : getBoilerWaterActions();
    const parameterActions = actionsTable[parameter];
    
    if (!parameterActions) return null;
    if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(Number(value))) return null;
    
    // Special handling for LSI and RSI with complex range conditions
    if (parameter === 'lsi') {
      const numValue = parseFloat(value);
      // If plant-specific LSI bounds exist, evaluate against them
      const plantLsi = plantParameters?.lsi;
      if (plantLsi && plantLsi.min != null && plantLsi.max != null) {
        const min = parseFloat(plantLsi.min);
        const max = parseFloat(plantLsi.max);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          if (numValue < min) return parameterActions.actions[`< ${min}`];
          // within plant target range → no action
          if (numValue >= min && numValue <= max) return null;
          if (numValue > max) return parameterActions.actions[`>${max}`];
          // Handle shape around 0 if target spans it
          if (numValue >= min && numValue < 0 && parameterActions.actions[`${min}-0`]) {
            return parameterActions.actions[`${min}-0`];
          }
          if (numValue === 0 && parameterActions.actions["0"]) {
            return parameterActions.actions["0"];
          }
          if (numValue > 0 && numValue <= max && parameterActions.actions[`0-${max}`]) {
            return parameterActions.actions[`0-${max}`];
          }
          return null;
        }
      }
      // Default banding if no plant-specific bounds provided
      // if (numValue < -0.5) return parameterActions.actions["< -0.5"];
      // if (numValue >= -0.5 && numValue < 0) return parameterActions.actions["-0.5<0"];
      // if (numValue === 0) return parameterActions.actions["0"];
      // if (numValue > 0 && numValue <= 0.5) return parameterActions.actions["0<0.5"];
      // if (numValue > 2) return parameterActions.actions[">2"];
      return null; // Within balanced range
    }
    
    if (parameter === 'rsi') {
      const numValue = parseFloat(value);
      // If plant-specific RSI bounds exist, use them for decision and keys
      const plantRsi = plantParameters?.rsi;
      if (plantRsi && plantRsi.min != null && plantRsi.max != null) {
        const min = parseFloat(plantRsi.min);
        const max = parseFloat(plantRsi.max);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          if (numValue < min) return parameterActions.actions[`<${min}`];
          // within plant target range → no action
          if (numValue >= min && numValue <= max) return null;
          if (numValue > max + 2) return parameterActions.actions[`>${max + 2}`];
          if (numValue > max) return parameterActions.actions[`>${max}`];
          return null; // default to no action
        }
      }
      // Fallback to default RSI bands if no plant-specific bounds
      if (numValue <= 4.8) return parameterActions.actions["4.8"];
      if (numValue > 4.8 && numValue <= 6.0) return parameterActions.actions["5.0-6.0"];
      if (numValue > 6.0 && numValue <= 7.0) return parameterActions.actions["6.0-7.0"];
      if (numValue > 7.0 && numValue <= 7.5) return parameterActions.actions["7.0-7.5"];
      if (numValue > 7.5 && numValue <= 9.0) return parameterActions.actions["7.5-9.0"];
      if (numValue > 9.0) return parameterActions.actions[">9.0"];
      return null; // Within target range
    }
    
    // Standard handling for other parameters
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
      // Handle exact matches for conditions like "0" or specific values
      else if (condition === value.toString()) {
        return action;
      }
    }
    
    return null;
  };
  
  const calculateAnalysis = async () => {
    // Validate that a plant, analysis type, and water system are selected
    if (!selectedPlant) {
      toast.error('Please select a plant before calculating analysis');
      return;
    }
    if (!analysisType) {
      toast.error('Please select an analysis type (Cooling or Boiler Water) before calculating analysis');
      return;
    }
    if (!selectedWaterSystem) {
      toast.error('Please select a water system before calculating analysis');
      return;
    }
    
    setCalculating(true);
    try {
      // Prepare request data based on analysis type
      let requestData = {
        analysis_type: analysisType,
        plant_id: selectedPlant.id,
        water_system_id: selectedWaterSystem.id
      };
      
      if (analysisType === 'boiler') {
        // For boiler water, send core fields and only enabled optional fields
        requestData = {
          ...requestData,
          ph: inputData.ph || 0,
          tds: inputData.tds || 0,
          hardness: inputData.hardness || 0,
          m_alkalinity: inputData.m_alkalinity || 0
        };
        
        // Only include optional fields if they're enabled for this water system
        if (selectedWaterSystem?.boiler_p_alkalinity_enabled) {
          requestData.p_alkalinity = inputData.p_alkalinity || 0;
        }
        if (selectedWaterSystem?.boiler_oh_alkalinity_enabled) {
          requestData.oh_alkalinity = inputData.oh_alkalinity || 0;
        }
        if (selectedWaterSystem?.boiler_sulphite_enabled) {
          requestData.sulphite = inputData.sulphite || 0;
        }
        if (selectedWaterSystem?.boiler_sodium_chloride_enabled) {
          requestData.sodium_chloride = inputData.sodium_chloride || 0;
        }
        if (selectedWaterSystem?.boiler_do_enabled) {
          requestData.do = inputData.do || 0;
        }
        if (selectedWaterSystem?.boiler_phosphate_enabled) {
          requestData.boiler_phosphate = inputData.boiler_phosphate || 0;
        }
        if (selectedWaterSystem?.boiler_iron_enabled) {
          requestData.iron = inputData.iron || 0;
        }
      } else {
        // For cooling water, send all required fields
        // Use null instead of 0 for empty values to allow backend to properly check for missing data
        const coolingData = {
          ph: inputData.ph !== '' && inputData.ph != null ? parseFloat(inputData.ph) : null,
          tds: inputData.tds !== '' && inputData.tds != null ? parseFloat(inputData.tds) : null,
          total_alkalinity: inputData.total_alkalinity !== '' && inputData.total_alkalinity != null ? parseFloat(inputData.total_alkalinity) : null,
          hardness: inputData.hardness !== '' && inputData.hardness != null ? parseFloat(inputData.hardness) : null,
          temperature: inputData.temperature !== '' && inputData.temperature != null ? parseFloat(inputData.temperature) : (inputData.hot_temperature !== '' && inputData.hot_temperature != null ? parseFloat(inputData.hot_temperature) : null),
          hot_temperature: inputData.hot_temperature !== '' && inputData.hot_temperature != null ? parseFloat(inputData.hot_temperature) : null,
          sulphate: inputData.sulphate !== '' && inputData.sulphate != null ? parseFloat(inputData.sulphate) : null
        };
        
        // Add optional fields only if they're enabled for this water system
        if (selectedWaterSystem?.cooling_chloride_enabled) {
          coolingData.chloride = inputData.chloride || 0;
        }
        if (selectedWaterSystem?.cooling_cycle_enabled) {
          coolingData.cycle = inputData.cycle || 0;
        }
        if (selectedWaterSystem?.cooling_iron_enabled) {
          coolingData.iron = inputData.iron || 0;
        }
        if (selectedWaterSystem?.cooling_phosphate_enabled) {
          coolingData.phosphate = inputData.phosphate || 0;
        }
        
        requestData = {
          ...requestData,
          ...coolingData
        };
      }
      
      const response = await api.post('/calculate-water-analysis-with-recommendations/', requestData);
      
      
      // Handle different response structures for cooling vs boiler water
      if (analysisType === 'boiler') {
        // For boiler water, response has calculation and recommendations
        setResults({
          lsi: null,
          rsi: null,
          lr: null,
          stability_score: response.data.calculation.stability_score,
          lsi_status: '',
          lr_status: '',
          overall_status: response.data.calculation.overall_status
        });
        setRecommendations(response.data.recommendations || []); // Boiler water has recommendations
      } else {
        // For cooling water, response has calculation and recommendations
        // Filter out any invalid fields that might come from the API
        const validResults = {};
        const validFields = ['lsi', 'rsi', 'lr', 'stability_score', 'lsi_status', 'rsi_status', 'lr_status', 'overall_status'];
        
        Object.keys(response.data.calculation).forEach(key => {
          if (validFields.includes(key)) {
            validResults[key] = response.data.calculation[key];
          }
        });
        
        setResults(validResults);
        setRecommendations(response.data.recommendations);
        // Only load trends for cooling water
        await loadTrends();
        
        // Check if LSI/RSI are missing and show a helpful message
        if (analysisType === 'cooling' && (!validResults.lsi || !validResults.rsi)) {
          const missingFields = [];
          if (!inputData.total_alkalinity || inputData.total_alkalinity === '') {
            missingFields.push('Total Alkalinity');
          }
          if ((!inputData.temperature || inputData.temperature === '') && 
              (!inputData.hot_temperature || inputData.hot_temperature === '')) {
            missingFields.push('Temperature (Basin or Hot Side)');
          }
          if (missingFields.length > 0) {
            toast.warning(`LSI and RSI cannot be calculated. Missing: ${missingFields.join(', ')}`);
          }
        }
      }
      
      toast.success('Analysis calculated successfully!');
    } catch (error) {
      handleError(error, 'Calculating analysis');
    } finally {
      setCalculating(false);
    }
  };
  
  const saveAnalysis = async () => {
    // Validate that a plant, analysis type, and water system are selected
    if (!selectedPlant) {
      toast.error('Please select a plant before saving analysis');
      return;
    }
    if (!analysisType) {
      toast.error('Please select an analysis type (Cooling or Boiler Water) before saving analysis');
      return;
    }
    if (!selectedWaterSystem) {
      toast.error('Please select a water system before saving analysis');
      return;
    }
    
    setLoading(true);
    try {
      // Validate pH range before processing
      if (inputData.ph !== '' && inputData.ph != null) {
        const phValue = parseFloat(inputData.ph);
        if (isNaN(phValue) || phValue < 0 || phValue > 14) {
          toast.error('pH must be between 0 and 14');
          setLoading(false);
          return;
        }
      }
      
      // Clean the data - convert empty strings to null and ensure proper types
      const cleanInputData = {};
      Object.keys(inputData).forEach(key => {
        const value = inputData[key];
        if (value === '' || value === null || value === undefined) {
          cleanInputData[key] = null;
        } else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
          cleanInputData[key] = parseFloat(value);
        } else {
          cleanInputData[key] = value;
        }
      });

      // Validate required fields for the analysis type
      if (analysisType === 'cooling') {
        // For cooling water, check core required fields
        let requiredFields = ['ph', 'tds', 'total_alkalinity', 'hardness', 'temperature', 'hot_temperature'];
        
        // Add optional fields only if they're enabled for this water system
        if (selectedWaterSystem?.cooling_chloride_enabled) {
          requiredFields.push('chloride');
        }
        if (selectedWaterSystem?.cooling_cycle_enabled) {
          requiredFields.push('cycle');
        }
        if (selectedWaterSystem?.cooling_iron_enabled) {
          requiredFields.push('iron');
        }
        if (selectedWaterSystem?.cooling_phosphate_enabled) {
          requiredFields.push('phosphate');
        }
        
        for (const field of requiredFields) {
          if (cleanInputData[field] === null || cleanInputData[field] === undefined) {
            toast.error(`Please fill in all required fields. Missing: ${field}`);
            setLoading(false);
            return;
          }
        }
              } else {
          // For boiler water, check core required fields
          let requiredFields = ['ph', 'tds', 'hardness', 'm_alkalinity'];
          
          // Add optional fields only if they're enabled for this water system
          if (selectedWaterSystem?.boiler_p_alkalinity_enabled) {
            requiredFields.push('p_alkalinity');
          }
          if (selectedWaterSystem?.boiler_oh_alkalinity_enabled) {
            requiredFields.push('oh_alkalinity');
          }
          if (selectedWaterSystem?.boiler_sulphite_enabled) {
            requiredFields.push('sulphite');
          }
          if (selectedWaterSystem?.boiler_sodium_chloride_enabled) {
            requiredFields.push('sodium_chloride');
          }
          if (selectedWaterSystem?.boiler_iron_enabled) {
            requiredFields.push('iron');
          }
          if (selectedWaterSystem?.boiler_do_enabled) {
            requiredFields.push('do');
          }
          if (selectedWaterSystem?.boiler_phosphate_enabled) {
            requiredFields.push('boiler_phosphate');
          }
          
          for (const field of requiredFields) {
            if (cleanInputData[field] === null || cleanInputData[field] === undefined) {
              toast.error(`Please fill in all required fields. Missing: ${field}`);
              setLoading(false);
              return;
            }
          }
        }

      // Recalculate the analysis to get fresh calculated values
      // Convert null values to 0 for calculation API
      const calculationData = {};
      Object.keys(cleanInputData).forEach(key => {
        calculationData[key] = cleanInputData[key] === null ? 0 : cleanInputData[key];
      });
      
      const calculationResponse = await api.post('/calculate-water-analysis-with-recommendations/', {
        ...calculationData,
        analysis_type: analysisType,
        plant_id: selectedPlant.id,
        water_system_id: selectedWaterSystem.id
      });

      let calculatedResults = {};
      if (analysisType === 'boiler') {
        calculatedResults = {
          lsi: null,
          rsi: null,
          lr: null,
          stability_score: calculationResponse.data.calculation.stability_score,
          lsi_status: '',
          rsi_status: '',
          lr_status: '',
          overall_status: calculationResponse.data.calculation.overall_status
        };
      } else {
        // For cooling water, use the calculated values directly
        calculatedResults = {
          lsi: calculationResponse.data.calculation.lsi,
          rsi: calculationResponse.data.calculation.rsi,
          lr: calculationResponse.data.calculation.lr,
          stability_score: calculationResponse.data.calculation.stability_score,
          lsi_status: calculationResponse.data.calculation.lsi_status,
          rsi_status: calculationResponse.data.calculation.rsi_status,
          lr_status: calculationResponse.data.calculation.lr_status,
          overall_status: calculationResponse.data.calculation.overall_status
        };
      }

      const analysisData = {
        ...cleanInputData,
        ...calculatedResults,
        analysis_type: analysisType,
        water_system: selectedWaterSystem.id,
        analysis_date: new Date().toISOString().split('T')[0], // Add current date
        analysis_name: 'Water Analysis', // Add analysis name
        notes: '', // Add empty notes field
        // Map frontend field names to model field names
        basin_temperature: cleanInputData.temperature, // Basin Temperature
        temperature: cleanInputData.hot_temperature,    // Hot Side Temperature
        // Add missing fields that exist in the model
        sulphate: cleanInputData.sulphate || null,
        m_alkalinity: cleanInputData.m_alkalinity || null,
        psi: null, // PSI is not calculated anymore
        psi_status: '', // PSI status is not calculated anymore
      };
      
      // Remove the old field names to avoid confusion
      delete analysisData.hot_temperature;
      
      
      await api.post('/water-analysis/', analysisData);
      toast.success('Analysis saved successfully!');
      
      // Reload trends and recommendations dynamically
      await Promise.all([loadTrends()]);
    } catch (error) {
      console.error('Save analysis error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data) {
        // Show specific validation errors
        const errorData = error.response.data;
        
        // Handle field-specific validation errors
        if (errorData.ph) {
          const phErrors = Array.isArray(errorData.ph) ? errorData.ph : [errorData.ph];
          phErrors.forEach(err => {
            if (typeof err === 'string' && err.includes('less than or equal to 14')) {
              toast.error('pH must be between 0 and 14. Please correct the value and try again.');
            } else if (typeof err === 'string') {
              toast.error(`pH Error: ${err}`);
            }
          });
        } else if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat();
          const errorText = errorMessages.join(', ');
          // Check if it's a pH validation error
          if (errorText.includes('less than or equal to 14') || errorText.includes('pH')) {
            toast.error('pH must be between 0 and 14. Please correct the value and try again.');
          } else {
            toast.error(`Validation Error: ${errorText}`);
          }
        } else {
          toast.error(`Error: ${errorData}`);
        }
      } else {
        toast.error('Failed to save analysis. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status color based on exact status descriptions from images
  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    
    if (status.includes('Near Balance') || status.includes('Little scale or corrosion') || 
        status.includes('Water is in optimal range') || status.includes('will not interfere') ||
        status.includes('Within target range')) {
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
  
  // Map current value to display in Suggested Actions table
  const getCurrentValueForParam = (parameter) => {
    // Use computed indices from results for these
    if (['lsi', 'rsi', 'lr'].includes(parameter)) {
      return results[parameter];
    }
    // Cycle is not a direct input; show '-' instead of 0
    // if (parameter === 'cycle') {
    //   return null;
    // }
    // Fallback to input
    return inputData[parameter];
  };
  
  const getStatusIcon = (status) => {
    if (status.includes('Near Balance') || status.includes('Little scale or corrosion') || 
        status.includes('Water is in optimal range') || status.includes('will not interfere') ||
        status.includes('Within target range')) {
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

  // Prefer plant targets for index display status when available
  const getDisplayedIndexStatus = (parameter, value, industryStatus) => {
    if (parameter === 'rsi' && plantParameters?.rsi && value != null) {
      const min = parseFloat(plantParameters.rsi.min);
      const max = parseFloat(plantParameters.rsi.max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        if (value >= min && value <= max) return 'Within target range';
      }
    }
    if (parameter === 'lsi' && plantParameters?.lsi && value != null) {
      const min = parseFloat(plantParameters.lsi.min);
      const max = parseFloat(plantParameters.lsi.max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        if (value >= min && value <= max) return 'Within target range';
      }
    }
    return industryStatus || 'Not calculated';
  };
  
  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='relative max-w-7xl mx-auto'>
        <LoadingOverlay
          show={plantsLoading || plantDetailsLoading || calculating || loading}
        />
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Water Stability Analysis
          </h1>
          <p className='text-gray-600'>
            Analyze water parameters and calculate stability indices using
            WaterS8 standards
          </p>
        </div>

        {/* Plant Selection */}
        <div className='mb-6'>
          <div className='bg-white rounded-lg shadow-md p-4'>
            <div className='flex items-center space-x-4'>
              <span className='text-sm font-medium text-gray-700'>
                Select Plant: <span className='text-red-500'>*</span>
              </span>
              <div className='flex-1 max-w-md'>
                <SearchableSelect
                  options={plants}
                  value={selectedPlant}
                  onChange={handlePlantChange}
                  placeholder='Search and select a plant...'
                  loading={plantsLoading}
                  searchPlaceholder='Type to search plants...'
                  noOptionsMessage='No plants found'
                />
              </div>
            </div>
            {plantDetailsLoading && (
              <div className='mt-2 text-sm text-gray-600'>
                <p>Loading plant details...</p>
              </div>
            )}
            {selectedPlant && !plantDetailsLoading && (
              <div className='mt-4 space-y-4'>
                {/* <div className='text-sm text-gray-600'>
                  <p>
                    Selected Plant: <strong>{selectedPlant.name}</strong>
                  </p>
                </div> */}
                
                {/* Analysis Type Selector - Only shown after plant is selected */}
                <div className='flex items-center space-x-4'>
                  <span className='text-sm font-medium text-gray-700'>
                    Analysis Type: <span className='text-red-500'>*</span>
                  </span>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handleAnalysisTypeChange("cooling")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        analysisType === "cooling"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <Droplets className='w-4 h-4 inline mr-2' />
                      Cooling Water
                    </button>
                    <button
                      onClick={() => handleAnalysisTypeChange("boiler")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        analysisType === "boiler"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <Thermometer className='w-4 h-4 inline mr-2' />
                      Boiler Water
                    </button>
                  </div>
                </div>
                
                {/* Water System Selection - Only shown after analysis type is selected */}
                {analysisType && (
                  <>
                    {waterSystemsLoading ? (
                      <div className='text-sm text-gray-500'>Loading water systems...</div>
                    ) : waterSystems.length > 0 ? (
                      <div className='flex items-center space-x-4'>
                        <span className='text-sm font-medium text-gray-700'>
                          Select Water System: <span className='text-red-500'>*</span>
                        </span>
                        <div className='flex-1 max-w-md'>
                          <SearchableSelect
                            options={waterSystems
                              .filter(ws => ws.system_type === analysisType)
                              .map(ws => ({
                                ...ws,
                                name: `${ws.name} (${ws.system_type_display || (ws.system_type === 'cooling' ? 'Cooling Water' : 'Boiler Water')})`
                              }))}
                            value={selectedWaterSystem ? {
                              ...selectedWaterSystem,
                              name: `${selectedWaterSystem.name} (${selectedWaterSystem.system_type_display || (selectedWaterSystem.system_type === 'cooling' ? 'Cooling Water' : 'Boiler Water')})`
                            } : null}
                            onChange={handleWaterSystemChange}
                            placeholder='Search and select a water system...'
                            loading={waterSystemsLoading}
                            searchPlaceholder='Type to search water systems...'
                            noOptionsMessage={`No ${analysisType} water systems found for this plant`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm text-yellow-600'>
                        <p>⚠️ No water systems found for this plant. Please add water systems in Plant Management.</p>
                      </div>
                    )}
                    
                    {/* {selectedWaterSystem && (
                      <div className='text-sm text-gray-600'>
                        <p>
                          Selected: <strong>{selectedWaterSystem.name}</strong> ({selectedWaterSystem.system_type_display || (selectedWaterSystem.system_type === 'cooling' ? 'Cooling Water' : 'Boiler Water')})
                        </p>
                      </div>
                    )} */}
                  </>
                )}
              </div>
            )}
            {!selectedPlant && !plantDetailsLoading && (
              <div className='mt-2 text-sm text-red-600'>
                <p>⚠️ Please select a plant to continue</p>
              </div>
            )}
            {selectedPlant && !analysisType && (
              <div className='mt-2 text-sm text-red-600'>
                <p>⚠️ Please select an analysis type (Cooling or Boiler Water)</p>
              </div>
            )}
            {selectedPlant && analysisType && !selectedWaterSystem && !waterSystemsLoading && waterSystems.length > 0 && (
              <div className='mt-2 text-sm text-red-600'>
                <p>⚠️ Please select a water system to calculate water analysis</p>
              </div>
            )}
          </div>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Input Data */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center mb-4'>
              <Calculator className='w-5 h-5 text-blue-600 mr-2' />
              <h2 className='text-xl font-semibold text-gray-900'>
                Input Data
              </h2>
            </div>
            
            <div className='space-y-4'>
              {plantParameters?.ph && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  pH <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  step='0.1'
                  min='0'
                  max='14'
                  value={inputData.ph}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                    // Validate pH range
                    if (value !== "" && (value < 0 || value > 14)) {
                      toast.error('pH must be between 0 and 14');
                      return;
                    }
                    handleInputChange("ph", value);
                  }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='0-14'
                />
                {inputData.ph !== '' && inputData.ph != null && (inputData.ph < 0 || inputData.ph > 14) && (
                  <p className='text-red-500 text-xs mt-1'>pH must be between 0 and 14</p>
                )}
              </div>
              )}
              
              {plantParameters?.tds && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  TDS (ppm)
                </label>
                <input
                  type='number'
                  step='1'
                  min='0'
                  value={inputData.tds}
                  onChange={(e) =>
                    handleInputChange(
                      "tds",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              )}
              
              {analysisType === "cooling" && (
                <>
              {plantParameters?.alkalinity && (
              <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Total Alkalinity as CaCO₃ (ppm)
                    </label>
                <input
                      type='number'
                      step='1'
                      min='0'
                  value={inputData.total_alkalinity}
                      onChange={(e) =>
                        handleInputChange(
                          "total_alkalinity",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              )}
              
              {plantParameters?.hardness && (
              <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Hardness as CaCO₃ (ppm)
                    </label>
                <input
                      type='number'
                      step='1'
                      min='0'
                  value={inputData.hardness}
                      onChange={(e) =>
                        handleInputChange(
                          "hardness",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              )}
                </>
              )}
              
              {analysisType === "boiler" && (
                <>
                  {plantParameters?.hardness && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Hardness as CaCO₃ (ppm)
                    </label>
                    <input
                      type='number'
                      step='1'
                      min='0'
                      value={inputData.hardness}
                      onChange={(e) =>
                        handleInputChange(
                          "hardness",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  )}
                  
                  {plantParameters?.p_alkalinity && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        P-Alkalinity as CaCO₃ (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        min='0'
                        value={inputData.p_alkalinity}
                        onChange={(e) =>
                          handleInputChange(
                            "p_alkalinity",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.oh_alkalinity && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        OH-Alkalinity as CaCO₃ (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        min='0'
                        value={inputData.oh_alkalinity}
                        onChange={(e) =>
                          handleInputChange(
                            "oh_alkalinity",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.sulphite && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Sulphite as SO₃ (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        min='0'
                        value={inputData.sulphite}
                        onChange={(e) =>
                          handleInputChange(
                            "sulphite",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.sodium_chloride && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Sodium Chloride (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        min='0'
                        value={inputData.sodium_chloride}
                        onChange={(e) =>
                          handleInputChange(
                            "sodium_chloride",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.do && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        DO (Dissolved Oxygen) (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.001'
                        min='0'
                        value={inputData.do}
                        onChange={(e) =>
                          handleInputChange(
                            "do",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.boiler_phosphate && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Phosphate (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        value={inputData.boiler_phosphate}
                        onChange={(e) =>
                          handleInputChange(
                            "boiler_phosphate",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.iron && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Iron as Fe (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        min='0'
                        value={inputData.iron}
                        onChange={(e) =>
                          handleInputChange(
                            "iron",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                </>
              )}
              
              {analysisType === "cooling" && (
                <>
              {plantParameters?.chloride && (
                <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Chloride as NaCl (ppm)
                      </label>
                  <input
                        type='number'
                        step='1'
                        min='0'
                    value={inputData.chloride}
                        onChange={(e) =>
                          handleInputChange(
                            "chloride",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              )}
                  
                  {plantParameters?.ph && plantParameters?.tds && plantParameters?.alkalinity && plantParameters?.hardness && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Basin Temperature (°C)
                    </label>
                <input
                      type='number'
                      step='0.1'
                      min='0'
                  value={inputData.temperature}
                      onChange={(e) =>
                        handleInputChange(
                          "temperature",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
                  )}
                  
                  {plantParameters?.ph && plantParameters?.tds && plantParameters?.alkalinity && plantParameters?.hardness && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Hot Side Temperature (°C)
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      min='0'
                      value={inputData.hot_temperature}
                      onChange={(e) =>
                        handleInputChange(
                          "hot_temperature",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  )}
                  
                  {plantParameters?.cycle && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Cycle of Concentration (as Cl)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        min='0'
                        value={inputData.cycle}
                        onChange={(e) =>
                          handleInputChange(
                            "cycle",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.iron && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Iron as Fe (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        min='0'
                        value={inputData.iron}
                        onChange={(e) =>
                          handleInputChange(
                            "iron",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                  
                  {plantParameters?.phosphate && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Phosphate (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        value={inputData.phosphate}
                        onChange={(e) =>
                          handleInputChange(
                            "phosphate",
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                </>
              )}

              {analysisType === "boiler" && (
                <>
                  {plantParameters?.alkalinity && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      M-Alkalinity as CaCO₃ (ppm)
                    </label>
                    <input
                      type='number'
                      step='1'
                      min='0'
                      value={inputData.m_alkalinity}
                      onChange={(e) =>
                        handleInputChange(
                          "m_alkalinity",
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  )}
                </>
              )}
              
              <button
                onClick={calculateAnalysis}
                disabled={
                  calculating || !selectedPlant || !areRequiredFieldsFilled()
                }
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                  !selectedPlant || !areRequiredFieldsFilled()
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {calculating ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    Calculating...
                  </>
                ) : !selectedPlant ? (
                  <>
                    <AlertTriangle className='w-4 h-4 mr-2' />
                    Select Plant First
                  </>
                ) : !areRequiredFieldsFilled() ? (
                  <>
                    <AlertTriangle className='w-4 h-4 mr-2' />
                    Fill All Required Fields
                  </>
                ) : (
                  <>
                    <Calculator className='w-4 h-4 mr-2' />
                    Calculate
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center mb-4'>
              <TrendingUp className='w-5 h-5 text-green-600 mr-2' />
              <h2 className='text-xl font-semibold text-gray-900'>Results</h2>
            </div>
            
            <div className='space-y-4'>
              {/* Show water indices only for cooling water */}
              {analysisType === "cooling" && (
                <>
                  <div className='border-b pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-700'>
                        LSI (Langelier Saturation Index)
                      </span>
                  {results.lsi_status && getStatusIcon(results.lsi_status)}
                </div>
                    <div className='flex flex-col space-y-2'>
                      <span className='text-2xl font-bold'>
                        {results.lsi?.toFixed(1) || "--"}
                      </span>
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          getDisplayedIndexStatus('lsi', results.lsi, results.lsi_status)
                        )} leading-tight`}
                      >
                        {getDisplayedIndexStatus('lsi', results.lsi, results.lsi_status)}
                  </span>
                </div>
              </div>
              
                  <div className='border-b pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-700'>
                        RSI (Ryznar Stability Index)
                      </span>
                  {results.rsi_status && getStatusIcon(results.rsi_status)}
                </div>
                    <div className='flex flex-col space-y-2'>
                      <span className='text-2xl font-bold'>
                        {results.rsi?.toFixed(1) || "--"}
                      </span>
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          getDisplayedIndexStatus('rsi', results.rsi, results.rsi_status)
                        )} leading-tight`}
                      >
                        {getDisplayedIndexStatus('rsi', results.rsi, results.rsi_status)}
                  </span>
                </div>
              </div>
              
                  {/* 
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
              </div> */}
              
              {/* Only show LR if chloride monitoring is enabled */}
              {selectedPlant?.cooling_chloride_enabled && (
                    <div className='border-b pb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium text-gray-700'>
                          LR (Langelier Ratio)
                        </span>
                    {results.lr_status && getStatusIcon(results.lr_status)}
                  </div>
                      <div className='flex flex-col space-y-2'>
                        <span className='text-2xl font-bold'>
                          {results.lr
                            ? results.lr > 100 || results.lr < -100
                              ? "High Risk"
                              : results.lr.toFixed(2)
                            : "--"}
                    </span>
                        <span
                          className={`text-sm font-medium ${getStatusColor(
                            results.lr_status
                          )} leading-tight`}
                        >
                          {results.lr_status || "Not calculated"}
                    </span>
                  </div>
                </div>
              )}
                </>
              )}
              
              {/* Show boiler water specific message and status */}
              {analysisType === "boiler" && (
                <>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='text-center'>
                      <span className='text-sm font-medium text-blue-700 block mb-2'>
                        Boiler Water Analysis
                      </span>
                      <span className='text-sm text-blue-600'>
                        Analysis completed using the simplified 4-parameter
                        scoring system (pH, TDS, Hardness, M-Alkalinity)
                  </span>
                </div>
              </div>
                  
                  {/* Boiler Water Overall Status */}
                  {results.overall_status && (
                    <div className='bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4'>
                      <div className='text-center'>
                        <span className='text-sm font-medium text-gray-700 block mb-2'>
                          Overall Status
                        </span>
                        <span
                          className={`text-2xl font-bold ${getStatusColor(
                            results.overall_status
                          )}`}
                        >
                          {results.overall_status}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Stability Score */}
              <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg'>
                <div className='text-center'>
                  <span className='text-sm font-medium text-gray-700 block mb-1'>
                    Stability Score
                  </span>
                  <span
                    className={`text-4xl font-bold ${getStabilityScoreColor(
                      results.stability_score
                    )}`}
                  >
                    {results.stability_score?.toFixed(0) || "--"}%
                  </span>
                </div>
              </div>
              
              {results.stability_score && (
                <button
                  onClick={saveAnalysis}
                  disabled={loading}
                  className='w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                >
                  {loading ? (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      Save Analysis
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Trends - Only show for cooling water when there are trends data */}
            {analysisType === "cooling" && !areAllTrendsEmpty() && (
              <div className='bg-white rounded-lg shadow-md p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center'>
                    <TrendingUp className='w-5 h-5 text-purple-600 mr-2' />
                    <h2 className='text-xl font-semibold text-gray-900'>
                      Trends
                    </h2>
              </div>
            </div>
            
                {!selectedPlant ? (
                  <div className='text-center py-8'>
                    <TrendingUp className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Select a Plant
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Please select a plant and calculate an analysis to view historical trends.
                    </p>
                  </div>
                ) : Object.keys(trends).length > 0 ? (
                  <div className='space-y-4'>
                    {Object.keys(trends).map((parameter) => (
                      <div key={parameter} className='border rounded-lg p-3'>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">
                            {parameter.toUpperCase() === "PH"
                              ? "pH"
                              : parameter.toUpperCase()}
                          </h3>
                          <div className="flex items-center space-x-3 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-0.5 bg-blue-500 mr-1" style={{borderTop: '2px dashed #3B82F6'}}></div>
                              <span className="text-gray-600">Min</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-0.5 bg-blue-700 mr-1"></div>
                              <span className="text-gray-600">Max</span>
                            </div>
                          </div>
                        </div>
                        <div className='h-32'>
                          <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={trends[parameter]}>
                              <CartesianGrid strokeDasharray='3 3' />
                        <XAxis 
                                dataKey='date'
                          tick={{ fontSize: 10 }}
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                }
                              />
                              <YAxis
                                tick={{ fontSize: 10 }}
                                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                              />
                        <Tooltip 
                                labelFormatter={(value) => {
                                  return new Date(value).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    }
                                  )
                                }}
                                formatter={(value, name) => {
                                  if (name === 'Min') return [value, 'Min'];
                                  if (name === 'Max') return [value, 'Max'];
                                  return [value, parameter.toUpperCase()];
                                }}
                              />
                              {/* Min value line */}
                        <Line 
                                type='monotone'
                                dataKey='min_value'
                                stroke={
                                  parameter === "ph"
                                    ? "#3B82F6"
                                    : parameter === "lsi"
                                    ? "#EF4444"
                                    : "#10B981"
                                }
                          strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 3 }}
                                name="Min"
                              />
                              {/* Max value line */}
                              <Line
                                type='monotone'
                                dataKey='max_value'
                                stroke={
                                  parameter === "ph"
                                    ? "#1D4ED8"
                                    : parameter === "lsi"
                                    ? "#DC2626"
                                    : "#059669"
                                }
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name="Max"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
                ) : (
                  <div className='text-center py-8'>
                    <TrendingUp className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No Historical Data
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Calculate and save an analysis to start tracking trends for this plant.
                    </p>
                    <div className='text-sm text-gray-500'>
                      Trends will appear here after you save analyses for this plant.
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* WaterS8 Suggested Actions Table - Show for both cooling and boiler water when there are results */}
        {results.overall_status && (
          <div className='mt-8'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center'>
                  <Zap className='w-5 h-5 text-yellow-600 mr-2' />
                  <h2 className='text-xl font-semibold text-gray-900'>
                    WaterS8{" "}
                    {analysisType === "cooling"
                      ? "Cooling Water"
                      : "Boiler Water"}{" "}
                    Suggested Actions
                  </h2>
          </div>
        </div>
        
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Parameter
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Target Range
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Current Value
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Suggested Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {Object.entries(
                      analysisType === "cooling"
                        ? getCoolingWaterActions()
                        : getBoilerWaterActions()
                    )
                    .filter(([param, config]) => {
                      const currentValue = getCurrentValueForParam(param);
                      // Only show if value exists (not null, undefined, or empty string)
                      return currentValue !== null && currentValue !== undefined && currentValue !== '';
                    })
                    .map(([param, config]) => {
                      const currentValue = getCurrentValueForParam(param);
                      const suggestedAction = getSuggestedAction(
                        param,
                        currentValue
                      );
                      const isOutOfRange = suggestedAction !== null;
                      
                      return (
                        <tr
                          key={param}
                          className={isOutOfRange ? "bg-red-50" : "bg-green-50"}
                        >
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                              param === "ph" ? "" : "capitalize"
                            }`}
                          >
                            {param === "ph"
                              ? "pH"
                              : ["tds", "lsi", "rsi"].includes(param)
                              ? param.toUpperCase()
                              : param.replace(/_/g, " ")}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {config.target}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {currentValue === null || currentValue === undefined
                              ? "-"
                              : currentValue}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900'>
                            {suggestedAction ? (
                              <div className='flex items-center'>
                                <AlertTriangle className='w-4 h-4 text-red-500 mr-2' />
                                <span className='text-red-700'>
                                  {suggestedAction}
                                </span>
                              </div>
                            ) : (
                              <div className='flex items-center'>
                                <CheckCircle className='w-4 h-4 text-green-500 mr-2' />
                                <span className='text-green-700'>
                                  Within target range
                                </span>
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
        {/* {recommendations.length > 0 && (
          <div className='mt-8'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center'>
                  <AlertTriangle className='w-5 h-5 text-orange-600 mr-2' />
                  <h2 className='text-xl font-semibold text-gray-900'>
                    AI-Generated Recommendations
                  </h2>
              </div>
            </div>
            
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {recommendations.map((rec, index) => (
                  <div
                    key={rec.id || index}
                    className={`border rounded-lg p-4 ${
                      rec.source === "dynamic"
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center'>
                        <h3 className='font-medium text-gray-900'>
                          {rec.title}
                        </h3>
                        {rec.source === "dynamic" && (
                          <span className='ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                          Dynamic
                        </span>
                      )}
                    </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : rec.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                      {rec.priority}
                    </span>
                  </div>
                    <p className='text-sm text-gray-600'>{rec.description}</p>
                    <div className='mt-2 flex items-center justify-between'>
                      <span className='text-xs text-gray-500 capitalize'>
                        {rec.type}
                      </span>
                      {rec.source === "dynamic" && (
                        <span className='text-xs text-blue-600'>
                          Based on latest analysis
                        </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
                </div>
              )} */}
      </div>
    </div>
  );
};

export default WaterAnalysis; 
