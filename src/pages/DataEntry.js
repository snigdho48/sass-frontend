import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAppSelector } from '../hooks/useAppSelector';
import { dataService } from '../services/dataService';
import { Plus, Edit, Trash2, Save, X, Database, Building2, UserPlus, UserMinus, Droplets, Thermometer } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import SearchableUserSelect from '../components/SearchableUserSelect';
import SearchableMultiUserSelect from '../components/SearchableMultiUserSelect';
import toast from 'react-hot-toast';

const DataEntry = () => {
  const { user } = useAppSelector(state => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    entry_date: new Date().toISOString().split('T')[0],
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Plant management state
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [assignUserOwnerIds, setAssignUserOwnerIds] = useState([]);
  const [plantFormData, setPlantFormData] = useState({
    name: '',
    is_active: true,
    owner_id: null,
  });

  // Water System management state
  const [showWaterSystemForm, setShowWaterSystemForm] = useState(false);
  const [editingWaterSystem, setEditingWaterSystem] = useState(null);
  const [selectedPlantForWaterSystem, setSelectedPlantForWaterSystem] = useState(null);
  const [assigningUsersToWaterSystem, setAssigningUsersToWaterSystem] = useState(null);
  const [managingWaterSystems, setManagingWaterSystems] = useState(null); // { plant, systemType } for which we're managing water systems
  const [assignWaterSystemUserIds, setAssignWaterSystemUserIds] = useState([]);
  const [selectedUsersToDelete, setSelectedUsersToDelete] = useState([]);
  const [waterSystemFormData, setWaterSystemFormData] = useState({
    plant: null,
    name: '',
    system_type: 'cooling', // 'cooling' or 'boiler'
    is_active: true,
    // Cooling water parameters (all optional)
    cooling_ph_min: '',
    cooling_ph_max: '',
    cooling_tds_min: '',
    cooling_tds_max: '',
    cooling_hardness_max: '',
    cooling_alkalinity_max: '',
    cooling_total_alkalinity_min: '',
    cooling_total_alkalinity_max: '',
    cooling_chloride_max: '',
    cooling_chloride_enabled: false,
    cooling_temperature_min: '',
    cooling_temperature_max: '',
    cooling_temperature_enabled: false,
    cooling_hot_temperature_min: '',
    cooling_hot_temperature_max: '',
    cooling_hot_temperature_enabled: false,
    cooling_cycle_min: '',
    cooling_cycle_max: '',
    cooling_cycle_enabled: false,
    cooling_iron_max: '',
    cooling_iron_enabled: false,
    cooling_phosphate_max: '',
    cooling_phosphate_enabled: false,
    cooling_lsi_min: '',
    cooling_lsi_max: '',
    cooling_lsi_enabled: false,
    cooling_rsi_min: '',
    cooling_rsi_max: '',
    cooling_rsi_enabled: false,
    // Boiler water parameters (all optional)
    boiler_ph_min: '',
    boiler_ph_max: '',
    boiler_tds_min: '',
    boiler_tds_max: '',
    boiler_hardness_max: '',
    boiler_alkalinity_min: '',
    boiler_alkalinity_max: '',
    boiler_p_alkalinity_min: '',
    boiler_p_alkalinity_max: '',
    boiler_p_alkalinity_enabled: false,
    boiler_oh_alkalinity_min: '',
    boiler_oh_alkalinity_max: '',
    boiler_oh_alkalinity_enabled: false,
    boiler_sulphite_min: '',
    boiler_sulphite_max: '',
    boiler_sulphite_enabled: false,
    boiler_sodium_chloride_max: '',
    boiler_sodium_chloride_enabled: false,
    boiler_do_min: '',
    boiler_do_max: '',
    boiler_do_enabled: false,
    boiler_phosphate_min: '',
    boiler_phosphate_max: '',
    boiler_phosphate_enabled: false,
    boiler_iron_max: '',
    boiler_iron_enabled: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState([]);
  const [expandedPlants, setExpandedPlants] = useState(new Set()); // Track which plants have expanded water systems

  const queryClient = useQueryClient();

  const { data: categories = [], error: categoriesError, isLoading: categoriesLoading } = useQuery('categories', dataService.getCategories, {
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Categories error:', error);
      toast.error('Failed to load categories');
    },
    onSuccess: () => {
      // Reset any error states when data loads successfully
      if (categoriesError) {
        console.log('Categories loaded successfully');
      }
    }
  });
  const { data: entries = [], isLoading, error: entriesError } = useQuery(
    ['entries', selectedCategory],
    () => dataService.getDataEntries({ category: selectedCategory }),
    { 
      enabled: !!selectedCategory,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Entries error:', error);
        toast.error('Failed to load data entries');
      },
      onSuccess: () => {
        // Reset error state when data loads successfully
        if (entriesError) {
          console.log('Entries loaded successfully');
        }
      }
    }
  );

  // Plant queries
  const { data: plantsData = { results: [], count: 0 }, isLoading: plantsLoading } = useQuery(
    ['plants-management', currentPage, searchTerm, ownerFilter],
    () => dataService.getPlantsManagement({ page: currentPage, search: searchTerm, owners: ownerFilter.join(','), page_size: 10 }),
    { 
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Plants error:', error);
        toast.error('Failed to load plants');
      }
    }
  );

  // Admin users query for plant creation (Super Admin only - for assigning plant to single admin)
  const { data: adminUsers = [], isLoading: adminUsersLoading, error: adminUsersError } = useQuery(
    'admin-users-for-plant-creation',
    dataService.getAdminUsersForPlantCreation,
    { 
      enabled: user?.can_create_plants, // Super Admin only
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Admin users error:', error);
        toast.error('Failed to load admin users for plant creation');
      }
    }
  );

  // Users query for plant owner assignment (admin only - for Admin users to add General Users to plants)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery(
    'users-for-plant-access',
    dataService.getUsersForPlantAccess,
    { 
      enabled: user?.is_admin && !user?.can_create_plants, // Admin users only (not Super Admin)
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Users error:', error);
        toast.error('Failed to load users for plant owner assignment');
      }
    }
  );

  const createEntryMutation = useMutation(dataService.createDataEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      setFormData({ value: '', notes: '', entry_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      toast.success('Data entry created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateEntryMutation = useMutation(
    ({ id, data }) => dataService.updateDataEntry(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['entries']);
        setEditingEntry(null);
        toast.success('Data entry updated successfully');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  const deleteEntryMutation = useMutation(dataService.deleteDataEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      toast.success('Data entry deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Plant mutations
  const createPlantMutation = useMutation(dataService.createPlant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['plants-management']);
      setPlantFormData({
        name: '',
        is_active: true,
        owner_id: null,
        // Cooling water parameters (all optional)
        cooling_ph_min: '',
        cooling_ph_max: '',
        cooling_tds_min: '',
        cooling_tds_max: '',
        cooling_hardness_max: '',
        cooling_alkalinity_max: '',
        cooling_total_alkalinity_min: '',
        cooling_total_alkalinity_max: '',
        cooling_chloride_max: '',
        cooling_temperature_min: '',
        cooling_temperature_max: '',
        cooling_temperature_enabled: false,
        cooling_hot_temperature_min: '',
        cooling_hot_temperature_max: '',
        cooling_hot_temperature_enabled: false,
        cooling_chloride_enabled: false,
        cooling_cycle_min: '',
        cooling_cycle_max: '',
        cooling_cycle_enabled: false,
        cooling_iron_max: '',
        cooling_iron_enabled: false,
        cooling_phosphate_max: '',
        cooling_phosphate_enabled: false,
        cooling_lsi_min: '',
        cooling_lsi_max: '',
        cooling_lsi_enabled: false,
        cooling_rsi_min: '',
        cooling_rsi_max: '',
        cooling_rsi_enabled: false,
        // Boiler water parameters (all optional)
        boiler_ph_min: '',
        boiler_ph_max: '',
        boiler_tds_min: '',
        boiler_tds_max: '',
        boiler_hardness_max: '',
        boiler_alkalinity_min: '',
        boiler_alkalinity_max: '',
        // Boiler water optional parameters
        boiler_p_alkalinity_min: '',
        boiler_p_alkalinity_max: '',
        boiler_p_alkalinity_enabled: false,
        boiler_oh_alkalinity_min: '',
        boiler_oh_alkalinity_max: '',
        boiler_oh_alkalinity_enabled: false,
        boiler_sulphite_min: '',
        boiler_sulphite_max: '',
        boiler_sulphite_enabled: false,
        boiler_sodium_chloride_max: '',
        boiler_sodium_chloride_enabled: false,
        boiler_do_min: '',
        boiler_do_max: '',
        boiler_do_enabled: false,
        boiler_phosphate_min: '',
        boiler_phosphate_max: '',
        boiler_phosphate_enabled: false,
        boiler_iron_max: '',
        boiler_iron_enabled: false,
      });
      setShowPlantForm(false);
      toast.success('Plant created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePlantMutation = useMutation(
    ({ id, data }) => dataService.updatePlant(id, data),
    {
              onSuccess: () => {
          queryClient.invalidateQueries(['plants-management']);
          setEditingPlant(null);
          setShowPlantForm(false);
          setAssigningUser(null);
          setAssignUserOwnerIds([]);
          toast.success('Plant updated successfully');
        },
      onError: (error) => {
        console.error('Update plant error:', error);
        toast.error(error.message || 'Failed to update plant');
      },
    }
  );

  const deletePlantMutation = useMutation(dataService.deletePlant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['plants-management']);
      toast.success('Plant deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Water System queries and mutations
  // Load all water systems (for display in plant table)
  const { data: allWaterSystemsData, isLoading: allWaterSystemsLoading, error: allWaterSystemsError } = useQuery(
    ['water-systems-all'],
    () => dataService.getWaterSystems(),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error loading water systems:', error);
        // Don't show toast for this as it's a background query
      },
    }
  );
  // Handle different response formats: could be { results: [] } or [] directly
  const allWaterSystems = Array.isArray(allWaterSystemsData) 
    ? allWaterSystemsData 
    : (allWaterSystemsData?.results || []);

  // Load water systems for specific plant (for modal editing)
  const { data: waterSystems = [], isLoading: waterSystemsLoading } = useQuery(
    ['water-systems', selectedPlantForWaterSystem?.id],
    () => selectedPlantForWaterSystem
      ? dataService.getWaterSystemsByPlant(selectedPlantForWaterSystem.id)
      : Promise.resolve([]),
    {
      enabled: !!selectedPlantForWaterSystem,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const createWaterSystemMutation = useMutation(dataService.createWaterSystem, {
    onSuccess: () => {
      queryClient.invalidateQueries(['water-systems']);
      queryClient.invalidateQueries(['water-systems-all']);
      setWaterSystemFormData({
        plant: null,
        name: '',
        system_type: 'cooling',
        is_active: true,
        cooling_ph_min: '', cooling_ph_max: '', cooling_tds_min: '', cooling_tds_max: '',
        cooling_hardness_max: '', cooling_alkalinity_max: '', 
        cooling_total_alkalinity_min: '', cooling_total_alkalinity_max: '',
        cooling_chloride_max: '',
        cooling_chloride_enabled: false, cooling_cycle_min: '', cooling_cycle_max: '',
        cooling_cycle_enabled: false, cooling_iron_max: '', cooling_iron_enabled: false,
        cooling_temperature_min: '', cooling_temperature_max: '',
        cooling_temperature_enabled: false,
        cooling_hot_temperature_min: '', cooling_hot_temperature_max: '',
        cooling_hot_temperature_enabled: false,
        cooling_phosphate_max: '', cooling_phosphate_enabled: false,
        cooling_lsi_min: '', cooling_lsi_max: '', cooling_lsi_enabled: false,
        cooling_rsi_min: '', cooling_rsi_max: '', cooling_rsi_enabled: false,
        boiler_ph_min: '', boiler_ph_max: '', boiler_tds_min: '', boiler_tds_max: '',
        boiler_hardness_max: '', boiler_alkalinity_min: '', boiler_alkalinity_max: '',
        boiler_p_alkalinity_min: '', boiler_p_alkalinity_max: '', boiler_p_alkalinity_enabled: false,
        boiler_oh_alkalinity_min: '', boiler_oh_alkalinity_max: '', boiler_oh_alkalinity_enabled: false,
        boiler_sulphite_min: '', boiler_sulphite_max: '', boiler_sulphite_enabled: false,
        boiler_sodium_chloride_max: '', boiler_sodium_chloride_enabled: false,
        boiler_do_min: '', boiler_do_max: '', boiler_do_enabled: false,
        boiler_phosphate_min: '', boiler_phosphate_max: '', boiler_phosphate_enabled: false,
        boiler_iron_max: '', boiler_iron_enabled: false,
      });
      setShowWaterSystemForm(false);
      setSelectedPlantForWaterSystem(null);
      toast.success('Water system created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create water system');
    },
  });

  const updateWaterSystemMutation = useMutation(
    ({ id, data }) => dataService.updateWaterSystem(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['water-systems']);
      queryClient.invalidateQueries(['water-systems-all']);
        setEditingWaterSystem(null);
        setShowWaterSystemForm(false);
        setSelectedPlantForWaterSystem(null);
        toast.success('Water system updated successfully');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update water system');
      },
    }
  );

  const deleteWaterSystemMutation = useMutation(dataService.deleteWaterSystem, {
    onSuccess: () => {
      queryClient.invalidateQueries(['water-systems']);
      queryClient.invalidateQueries(['water-systems-all']);
      toast.success('Water system deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete water system');
    },
  });

  const assignUsersToWaterSystemMutation = useMutation(
    ({ id, userIds }) => dataService.assignUsersToWaterSystem(id, userIds),
    {
      onMutate: async ({ id, userIds }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['water-systems-all']);
        
        // Snapshot the previous value
        const previousWaterSystems = queryClient.getQueryData(['water-systems-all']);
        
        // Optimistically update the cache
        queryClient.setQueryData(['water-systems-all'], (old) => {
          const oldData = Array.isArray(old) ? old : (old?.results || []);
          return oldData.map(ws => {
            if (ws.id === id) {
              // Update assigned_users with the new user IDs
              // We need to fetch user details, but for now just update IDs
              return {
                ...ws,
                assigned_users: userIds.map(userId => {
                  // Try to find existing user data in the old assigned_users
                  const existingUser = ws.assigned_users?.find(u => 
                    (typeof u === 'object' ? u.id : u) === userId
                  );
                  // If we have full user object, keep it; otherwise just use ID
                  return existingUser || userId;
                })
              };
            }
            return ws;
          });
        });
        
        return { previousWaterSystems };
      },
      onSuccess: (data, variables) => {
        // Update cache with server response (includes full user objects)
        queryClient.setQueryData(['water-systems-all'], (old) => {
          const oldData = Array.isArray(old) ? old : (old?.results || []);
          return oldData.map(ws => {
            if (ws.id === variables.id) {
              // Use the server response which has full user objects
              return data;
            }
            return ws;
          });
        });
        
        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries(['water-systems']);
        queryClient.invalidateQueries(['water-systems-all']);
        // Refetch immediately for real-time updates
        queryClient.refetchQueries(['water-systems-all'], { active: true });
        
        // Update local state if modal is still open
        if (assigningUsersToWaterSystem && assigningUsersToWaterSystem.id === variables.id) {
          setAssignWaterSystemUserIds(variables.userIds);
          // Update the water system object in state to reflect changes
          setAssigningUsersToWaterSystem(data);
        }
        setSelectedUsersToDelete([]);
        // Don't show toast here if it's from handleDeleteSelectedUsers or onChange (they show their own)
        // Only show if called from handleAssignUsersToWaterSystemSubmit
        if (!assigningUsersToWaterSystem || assigningUsersToWaterSystem.id !== variables.id) {
          toast.success('Users updated successfully');
        }
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousWaterSystems) {
          queryClient.setQueryData(['water-systems-all'], context.previousWaterSystems);
        }
        toast.error(error.message || 'Failed to update users');
      },
    }
  );

  // UI-only toggles for core parameter groups (not persisted as boolean flags)
  const [plantUI, setPlantUI] = useState({
    cooling_ph_enabled: false,
    cooling_tds_enabled: false,
    cooling_hardness_enabled: false,
    cooling_alkalinity_enabled: false,
    boiler_ph_enabled: false,
    boiler_tds_enabled: false,
    boiler_hardness_enabled: false,
    boiler_alkalinity_enabled: false,
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    const entryData = {
      ...formData,
      category: selectedCategory,
    };

    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: entryData });
    } else {
      createEntryMutation.mutate(entryData);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      value: entry.value.toString(),
      notes: entry.notes,
      entry_date: entry.entry_date,
    });
    setShowForm(true);
  };

  const handleDelete = (entry) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteEntryMutation.mutate(entry.id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({ value: '', notes: '', entry_date: new Date().toISOString().split('T')[0] });
  };

  // Plant management handlers
  const handlePlantSubmit = (e) => {
    e.preventDefault();
    
    // Only Super Admin can create or edit plants (Admin users cannot create or edit plants per requirements)
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can create or edit plants. Admin users do not have permission.');
      setShowPlantForm(false);
      setEditingPlant(null);
      return;
    }
    
    if (!plantFormData.name.trim()) {
      toast.error('Plant name is required');
      return;
    }

    // Validate owner field for super admin users only
    if (user?.can_create_plants && !plantFormData.owner_id) {
      toast.error('Plant owner is required');
      return;
    }

    // Prepare data for submission - only name, is_active, and owner_id
    const submitData = {
      name: plantFormData.name,
      is_active: plantFormData.is_active,
      owner_id: plantFormData.owner_id,
    };
    
    // For non-super-admin users, don't send owner_id (backend will set it automatically)
    if (!user?.can_create_plants) {
      delete submitData.owner_id;
    }

    console.log('Submitting plant data:', submitData);
    console.log('User role:', user?.is_admin);
    console.log('Editing plant:', editingPlant);

    if (editingPlant) {
      updatePlantMutation.mutate({ id: editingPlant.id, data: submitData });
    } else {
      createPlantMutation.mutate(submitData);
    }
  };

  const handlePlantEdit = (plant) => {
    // Only Super Admin can edit plants - prevent form from opening
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can edit plants. Admin users do not have permission.');
      setShowPlantForm(false);
      setEditingPlant(null);
      return;
    }
    
    setEditingPlant(plant);
    setPlantFormData({
      name: plant.name,
      is_active: plant.is_active,
      owner_id: user?.can_create_plants ? (plant.owner?.id || null) : null,
    });
    setPlantUI({
      cooling_ph_enabled: (plant.cooling_ph_min != null || plant.cooling_ph_max != null),
      cooling_tds_enabled: (plant.cooling_tds_min != null || plant.cooling_tds_max != null),
      cooling_hardness_enabled: (plant.cooling_hardness_max != null),
      cooling_alkalinity_enabled: (plant.cooling_alkalinity_max != null),
      boiler_ph_enabled: (plant.boiler_ph_min != null || plant.boiler_ph_max != null),
      boiler_tds_enabled: (plant.boiler_tds_min != null || plant.boiler_tds_max != null),
      boiler_hardness_enabled: (plant.boiler_hardness_max != null),
      boiler_alkalinity_enabled: (plant.boiler_alkalinity_min != null || plant.boiler_alkalinity_max != null),
    });
    setShowPlantForm(true);
  };

  const handlePlantDelete = (plant) => {
    if (window.confirm(`Are you sure you want to delete plant "${plant.name}"?`)) {
      deletePlantMutation.mutate(plant.id);
    }
  };

      // Handler for assigning/changing plant owners (for Admin users) - supports multiple users
    const handleAssignUser = (plant) => {
      setAssigningUser(plant);
      // Extract owner IDs from plant.owners array (if exists) or from legacy plant.owner
      const ownerIds = plant.owners && plant.owners.length > 0 
        ? plant.owners.map(owner => owner.id)
        : (plant.owner?.id ? [plant.owner.id] : []);
      setAssignUserOwnerIds(ownerIds);
    };

    const handleAssignUserSubmit = (e) => {
      e.preventDefault();
      
      if (!assignUserOwnerIds || assignUserOwnerIds.length === 0) {
        toast.error('Please select at least one user to assign as plant owner');
        return;
      }

      // Update only the owners field (send as owner_ids array)
      updatePlantMutation.mutate({ 
        id: assigningUser.id, 
        data: { owner_ids: assignUserOwnerIds } 
      });
      
      // Reset state after mutation (will be handled in onSuccess callback)
    };

    const handleAssignUserCancel = () => {
      setAssigningUser(null);
      setAssignUserOwnerIds([]);
    };

  const handlePlantCancel = () => {
    setShowPlantForm(false);
    setEditingPlant(null);
    setPlantFormData({
      name: '',
      is_active: true,
      owner_id: null,
    });
  };

  // Water System handlers
  const handleAddWaterSystem = (plant) => {
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can add water systems');
      return;
    }
    setSelectedPlantForWaterSystem(plant);
    setEditingWaterSystem(null);
    setWaterSystemFormData({
      plant: plant.id,
      name: '',
      system_type: 'cooling',
      is_active: true,
        cooling_ph_min: '', cooling_ph_max: '', cooling_tds_min: '', cooling_tds_max: '',
        cooling_hardness_max: '', cooling_alkalinity_max: '', 
        cooling_total_alkalinity_min: '', cooling_total_alkalinity_max: '',
        cooling_temperature_min: '', cooling_temperature_max: '',
        cooling_hot_temperature_min: '', cooling_hot_temperature_max: '',
        cooling_chloride_max: '',
        cooling_chloride_enabled: false, cooling_cycle_min: '', cooling_cycle_max: '',
      cooling_cycle_enabled: false, cooling_iron_max: '', cooling_iron_enabled: false,
      cooling_phosphate_max: '', cooling_phosphate_enabled: false,
      cooling_lsi_min: '', cooling_lsi_max: '', cooling_lsi_enabled: false,
      cooling_rsi_min: '', cooling_rsi_max: '', cooling_rsi_enabled: false,
      boiler_ph_min: '', boiler_ph_max: '', boiler_tds_min: '', boiler_tds_max: '',
      boiler_hardness_max: '', boiler_alkalinity_min: '', boiler_alkalinity_max: '',
      boiler_p_alkalinity_min: '', boiler_p_alkalinity_max: '', boiler_p_alkalinity_enabled: false,
      boiler_oh_alkalinity_min: '', boiler_oh_alkalinity_max: '', boiler_oh_alkalinity_enabled: false,
      boiler_sulphite_min: '', boiler_sulphite_max: '', boiler_sulphite_enabled: false,
      boiler_sodium_chloride_max: '', boiler_sodium_chloride_enabled: false,
      boiler_do_min: '', boiler_do_max: '', boiler_do_enabled: false,
      boiler_phosphate_min: '', boiler_phosphate_max: '', boiler_phosphate_enabled: false,
      boiler_iron_max: '', boiler_iron_enabled: false,
    });
    setShowWaterSystemForm(true);
  };

  const handleWaterSystemEdit = (waterSystem) => {
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can edit water systems');
      return;
    }
    setEditingWaterSystem(waterSystem);
    // Handle plant reference - could be object or ID
    const plantRef = typeof waterSystem.plant === 'object' ? waterSystem.plant : { id: waterSystem.plant };
    setSelectedPlantForWaterSystem(plantRef);
    // Populate form with water system data
    const formData = {
      plant: plantRef.id || waterSystem.plant,
      name: waterSystem.name,
      system_type: waterSystem.system_type,
      is_active: waterSystem.is_active,
      // Cooling parameters
      cooling_ph_min: waterSystem.cooling_ph_min ?? '',
      cooling_ph_max: waterSystem.cooling_ph_max ?? '',
      cooling_tds_min: waterSystem.cooling_tds_min ?? '',
      cooling_tds_max: waterSystem.cooling_tds_max ?? '',
      cooling_hardness_max: waterSystem.cooling_hardness_max ?? '',
      cooling_alkalinity_max: waterSystem.cooling_alkalinity_max ?? '',
      cooling_total_alkalinity_min: waterSystem.cooling_total_alkalinity_min ?? '',
      cooling_total_alkalinity_max: waterSystem.cooling_total_alkalinity_max ?? '',
      cooling_chloride_max: waterSystem.cooling_chloride_max ?? '',
      cooling_chloride_enabled: waterSystem.cooling_chloride_enabled || false,
      cooling_temperature_min: waterSystem.cooling_temperature_min ?? '',
      cooling_temperature_max: waterSystem.cooling_temperature_max ?? '',
      cooling_temperature_enabled: (waterSystem.cooling_temperature_min != null || waterSystem.cooling_temperature_max != null),
      cooling_hot_temperature_min: waterSystem.cooling_hot_temperature_min ?? '',
      cooling_hot_temperature_max: waterSystem.cooling_hot_temperature_max ?? '',
      cooling_hot_temperature_enabled: (waterSystem.cooling_hot_temperature_min != null || waterSystem.cooling_hot_temperature_max != null),
      cooling_cycle_min: waterSystem.cooling_cycle_min ?? '',
      cooling_cycle_max: waterSystem.cooling_cycle_max ?? '',
      cooling_cycle_enabled: waterSystem.cooling_cycle_enabled || false,
      cooling_iron_max: waterSystem.cooling_iron_max ?? '',
      cooling_iron_enabled: waterSystem.cooling_iron_enabled || false,
      cooling_phosphate_max: waterSystem.cooling_phosphate_max ?? '',
      cooling_phosphate_enabled: waterSystem.cooling_phosphate_enabled || false,
      cooling_lsi_min: waterSystem.cooling_lsi_min ?? '',
      cooling_lsi_max: waterSystem.cooling_lsi_max ?? '',
      cooling_lsi_enabled: waterSystem.cooling_lsi_enabled || false,
      cooling_rsi_min: waterSystem.cooling_rsi_min ?? '',
      cooling_rsi_max: waterSystem.cooling_rsi_max ?? '',
      cooling_rsi_enabled: waterSystem.cooling_rsi_enabled || false,
      // Boiler parameters
      boiler_ph_min: waterSystem.boiler_ph_min ?? '',
      boiler_ph_max: waterSystem.boiler_ph_max ?? '',
      boiler_tds_min: waterSystem.boiler_tds_min ?? '',
      boiler_tds_max: waterSystem.boiler_tds_max ?? '',
      boiler_hardness_max: waterSystem.boiler_hardness_max ?? '',
      boiler_alkalinity_min: waterSystem.boiler_alkalinity_min ?? '',
      boiler_alkalinity_max: waterSystem.boiler_alkalinity_max ?? '',
      boiler_p_alkalinity_min: waterSystem.boiler_p_alkalinity_min ?? '',
      boiler_p_alkalinity_max: waterSystem.boiler_p_alkalinity_max ?? '',
      boiler_p_alkalinity_enabled: waterSystem.boiler_p_alkalinity_enabled || false,
      boiler_oh_alkalinity_min: waterSystem.boiler_oh_alkalinity_min ?? '',
      boiler_oh_alkalinity_max: waterSystem.boiler_oh_alkalinity_max ?? '',
      boiler_oh_alkalinity_enabled: waterSystem.boiler_oh_alkalinity_enabled || false,
      boiler_sulphite_min: waterSystem.boiler_sulphite_min ?? '',
      boiler_sulphite_max: waterSystem.boiler_sulphite_max ?? '',
      boiler_sulphite_enabled: waterSystem.boiler_sulphite_enabled || false,
      boiler_sodium_chloride_max: waterSystem.boiler_sodium_chloride_max ?? '',
      boiler_sodium_chloride_enabled: waterSystem.boiler_sodium_chloride_enabled || false,
      boiler_do_min: waterSystem.boiler_do_min ?? '',
      boiler_do_max: waterSystem.boiler_do_max ?? '',
      boiler_do_enabled: waterSystem.boiler_do_enabled || false,
      boiler_phosphate_min: waterSystem.boiler_phosphate_min ?? '',
      boiler_phosphate_max: waterSystem.boiler_phosphate_max ?? '',
      boiler_phosphate_enabled: waterSystem.boiler_phosphate_enabled || false,
      boiler_iron_max: waterSystem.boiler_iron_max ?? '',
      boiler_iron_enabled: waterSystem.boiler_iron_enabled || false,
    };
    setWaterSystemFormData(formData);
    setShowWaterSystemForm(true);
  };

  const handleWaterSystemDelete = (waterSystem) => {
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can delete water systems');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${waterSystem.name}"?`)) {
      deleteWaterSystemMutation.mutate(waterSystem.id);
    }
  };

  const handleWaterSystemCancel = () => {
    setShowWaterSystemForm(false);
    setEditingWaterSystem(null);
    setSelectedPlantForWaterSystem(null);
    // Don't close the manage modal if it's open - it should stay open
  };

  const handleWaterSystemSubmit = (e) => {
    e.preventDefault();
    if (!user?.can_create_plants) {
      toast.error('Only Super Administrator can create or edit water systems');
      return;
    }
    
    if (!waterSystemFormData.name.trim()) {
      toast.error('Water system name is required');
      return;
    }

    // Prepare data based on system type
    const submitData = {
      plant: waterSystemFormData.plant,
      name: waterSystemFormData.name,
      system_type: waterSystemFormData.system_type,
      is_active: waterSystemFormData.is_active,
    };

    // Add parameters based on system type
    if (waterSystemFormData.system_type === 'cooling') {
      // Add cooling parameters
      const coolingFields = [
        'cooling_ph_min', 'cooling_ph_max', 'cooling_tds_min', 'cooling_tds_max',
        'cooling_hardness_max', 'cooling_alkalinity_max', 
        'cooling_total_alkalinity_min', 'cooling_total_alkalinity_max',
        'cooling_chloride_max', 'cooling_chloride_enabled', 
        'cooling_cycle_min', 'cooling_cycle_max', 'cooling_cycle_enabled', 
        'cooling_iron_max', 'cooling_iron_enabled',
        'cooling_phosphate_max', 'cooling_phosphate_enabled',
        'cooling_temperature_min', 'cooling_temperature_max', 'cooling_temperature_enabled',
        'cooling_hot_temperature_min', 'cooling_hot_temperature_max', 'cooling_hot_temperature_enabled',
        'cooling_lsi_min', 'cooling_lsi_max', 'cooling_lsi_enabled',
        'cooling_rsi_min', 'cooling_rsi_max', 'cooling_rsi_enabled',
      ];
      coolingFields.forEach(field => {
        if (field.includes('enabled')) {
          submitData[field] = waterSystemFormData[field] || false;
        } else {
          // For temperature fields, check if they're enabled before including
          if (field === 'cooling_temperature_min' || field === 'cooling_temperature_max') {
            if (!waterSystemFormData.cooling_temperature_enabled) {
              submitData[field] = null;
            } else {
              const value = waterSystemFormData[field];
              submitData[field] = (value === '' || value === null || value === undefined) ? null : parseFloat(value);
            }
          } else if (field === 'cooling_hot_temperature_min' || field === 'cooling_hot_temperature_max') {
            if (!waterSystemFormData.cooling_hot_temperature_enabled) {
              submitData[field] = null;
            } else {
              const value = waterSystemFormData[field];
              submitData[field] = (value === '' || value === null || value === undefined) ? null : parseFloat(value);
            }
          } else {
            const value = waterSystemFormData[field];
            submitData[field] = (value === '' || value === null || value === undefined) ? null : parseFloat(value);
          }
        }
      });
    } else {
      // Add boiler parameters
      const boilerFields = [
        'boiler_ph_min', 'boiler_ph_max', 'boiler_tds_min', 'boiler_tds_max',
        'boiler_hardness_max', 'boiler_alkalinity_min', 'boiler_alkalinity_max',
        'boiler_p_alkalinity_min', 'boiler_p_alkalinity_max', 'boiler_p_alkalinity_enabled',
        'boiler_oh_alkalinity_min', 'boiler_oh_alkalinity_max', 'boiler_oh_alkalinity_enabled',
        'boiler_sulphite_min', 'boiler_sulphite_max', 'boiler_sulphite_enabled',
        'boiler_sodium_chloride_max', 'boiler_sodium_chloride_enabled',
        'boiler_do_min', 'boiler_do_max', 'boiler_do_enabled',
        'boiler_phosphate_min', 'boiler_phosphate_max', 'boiler_phosphate_enabled',
        'boiler_iron_max', 'boiler_iron_enabled',
      ];
      boilerFields.forEach(field => {
        if (field.includes('enabled')) {
          submitData[field] = waterSystemFormData[field] || false;
        } else {
          const value = waterSystemFormData[field];
          submitData[field] = (value === '' || value === null || value === undefined) ? null : parseFloat(value);
        }
      });
    }

    if (editingWaterSystem) {
      updateWaterSystemMutation.mutate({ id: editingWaterSystem.id, data: submitData });
    } else {
      createWaterSystemMutation.mutate(submitData);
    }
  };

  const handleAssignUsersToWaterSystem = (waterSystem) => {
    // Only regular admins (not super admin) can assign users
    if (!user?.is_admin || user?.can_create_plants) {
      toast.error('Only Admin users (not Super Admin) can assign users to water systems');
      return;
    }
    setAssigningUsersToWaterSystem(waterSystem);
    // Pre-populate with currently assigned users
    const assignedUserIds = waterSystem.assigned_users?.map(u => typeof u === 'object' ? u.id : u) || [];
    setAssignWaterSystemUserIds(assignedUserIds);
    setSelectedUsersToDelete([]);
  };

  const handleAssignUsersToWaterSystemSubmit = (e) => {
    if (e) e.preventDefault();
    if (!assigningUsersToWaterSystem) return;
    
    assignUsersToWaterSystemMutation.mutate({
      id: assigningUsersToWaterSystem.id,
      userIds: assignWaterSystemUserIds || []
    });
    // Don't close the modal - keep it open to see real-time updates in the manage modal
  };

  const handleAssignUsersToWaterSystemCancel = () => {
    setAssigningUsersToWaterSystem(null);
    setAssignWaterSystemUserIds([]);
    setSelectedUsersToDelete([]);
  };

  // Handler to delete multiple selected users from a water system
  const handleDeleteSelectedUsers = async () => {
    if (!assigningUsersToWaterSystem || selectedUsersToDelete.length === 0) return;
    
    if (!user?.is_admin || user?.can_create_plants) {
      toast.error('Only Admin users (not Super Admin) can remove users from water systems');
      return;
    }
    
    const currentUserIds = assignWaterSystemUserIds || [];
    const newUserIds = currentUserIds.filter(id => !selectedUsersToDelete.includes(id));
    const deletedCount = selectedUsersToDelete.length;
    
    try {
      await assignUsersToWaterSystemMutation.mutateAsync({
        id: assigningUsersToWaterSystem.id,
        userIds: newUserIds
      });
      // State will be updated by the mutation's onSuccess
      // Don't close the modal - keep it open for real-time updates
      toast.success(`${deletedCount} user(s) removed successfully`);
    } catch (error) {
      toast.error('Failed to remove users');
    }
  };

  // Handler to add a single user to a water system (for regular admins)
  const handleAddUserToWaterSystem = async (waterSystem, userId) => {
    if (!user?.is_admin || user?.can_create_plants) {
      toast.error('Only Admin users (not Super Admin) can assign users to water systems');
      return;
    }
    
    const currentUserIds = waterSystem.assigned_users?.map(u => typeof u === 'object' ? u.id : u) || [];
    if (currentUserIds.includes(userId)) {
      toast.error('User is already assigned to this water system');
      return;
    }
    
    const newUserIds = [...currentUserIds, userId];
    
    try {
      await assignUsersToWaterSystemMutation.mutateAsync({
        id: waterSystem.id,
        userIds: newUserIds
      });
      toast.success('User added successfully');
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  // Handler to remove a single user from a water system (for regular admins)
  const handleRemoveUserFromWaterSystem = async (waterSystem, userId) => {
    if (!user?.is_admin || user?.can_create_plants) {
      toast.error('Only Admin users (not Super Admin) can remove users from water systems');
      return;
    }
    
    const currentUserIds = waterSystem.assigned_users?.map(u => typeof u === 'object' ? u.id : u) || [];
    const newUserIds = currentUserIds.filter(id => id !== userId);
    
    try {
      await assignUsersToWaterSystemMutation.mutateAsync({
        id: waterSystem.id,
        userIds: newUserIds
      });
      toast.success('User removed successfully');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const handleManageWaterSystems = (plant, systemType = null) => {
    setManagingWaterSystems({ plant, systemType });
  };

  const handleCloseWaterSystemsModal = () => {
    setManagingWaterSystems(null);
  };

  const totalPages = Math.ceil(plantsData.count / 10);
  
  // Check if user can change target ranges (only Super Admin can)
  const canEditTargetRanges = user?.can_change_target_range || false;
  
  // Debug info
  console.log('Plants Data:', plantsData);
  console.log('Total Pages:', totalPages);
  console.log('Current Page:', currentPage);
  console.log('Plants Count:', plantsData.count);
  

  return (
    <div className='space-y-6'>
      <div className='relative'>
        <LoadingOverlay
          show={
            categoriesLoading ||
            isLoading ||
            plantsLoading ||
            createEntryMutation.isLoading ||
            updateEntryMutation.isLoading ||
            deleteEntryMutation.isLoading ||
            createPlantMutation.isLoading ||
            updatePlantMutation.isLoading ||
            deletePlantMutation.isLoading
          }
        />
      </div>

      {/* Plant Management Section - Hidden for General Users */}
      {!user?.is_general_user && (
        <div className=''>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              Plant Management
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Create and manage plant parameters for water analysis.
            </p>
          </div>
                     {user?.can_create_plants && (
             <button
               onClick={() => setShowPlantForm(true)}
               className='btn btn-primary flex items-center'
             >
               <Plus className='h-4 w-4 mr-2' />
               Add Plant
             </button>
           )}
        </div>

                {/* Plant Form - Only visible to Super Admin */}
        {showPlantForm && user?.can_create_plants && (
                      <div className='card mb-6 relative'>
             {(createPlantMutation.isLoading || updatePlantMutation.isLoading) && (
               <div className='absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-lg'>
                 <div className='flex flex-col items-center'>
                   <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4'></div>
                   <p className='text-gray-700 font-medium'>
                     {editingPlant ? 'Updating plant...' : 'Creating plant...'}
                   </p>
                 </div>
               </div>
             )}
             <div className='card-header'>
              <h3 className='text-lg font-medium text-gray-900'>
                                 {editingPlant
                   ? "Edit Plant"
                   : user?.can_create_plants
                   ? "Add New Plant"
                   : "Plant Details"}
              </h3>
            </div>
            <div className='card-body'>
              <form onSubmit={handlePlantSubmit} className='space-y-6'>
                {/* Basic Information */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Plant Name *
                    </label>
                    <input
                      type='text'
                      required
                      className='input'
                      value={plantFormData.name}
                      onChange={(e) =>
                        setPlantFormData({
                          ...plantFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder='Enter plant name'
                      disabled={user?.is_client && !editingPlant}
                    />
                  </div>
                  <div className='flex items-center'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                        checked={plantFormData.is_active}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            is_active: e.target.checked,
                          })
                        }
                        disabled={user?.is_client && !editingPlant}
                      />
                      <span className='ml-2 text-sm text-gray-700'>Active</span>
                    </label>
                  </div>
                </div>

                                  {/* Plant Owner (Super Admin Only) */}
                {user?.can_create_plants && (
                  <div className='border-t pt-6'>
                    <h4 className='text-md font-medium text-gray-900 mb-4'>
                      Plant Owner
                    </h4>
                    <div className='space-y-3'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Select Plant Owner *
                      </label>
                                              {adminUsersLoading ? (
                          <div className='text-sm text-gray-500'>
                            Loading admin users...
                          </div>
                      ) : adminUsersError ? (
                        <div className='text-sm text-red-500'>
                          Failed to load admin users
                        </div>
                      ) : (
                        <SearchableUserSelect
                          options={adminUsers}
                          value={plantFormData.owner_id}
                          onChange={(ownerId) => {
                            setPlantFormData({
                              ...plantFormData,
                              owner_id: ownerId,
                            });
                          }}
                          placeholder={editingPlant ? 'Loading admin...' : 'Search and select an admin user...'}
                          required={true}
                        />
                      )}
                      <p className='text-xs text-gray-500'>
                        Plant owner is required. Only the selected user can
                        access this plant.
                      </p>
                    </div>
                  </div>
                )}

                {/* Note: Water systems (cooling/boiler) are now managed separately via the + button next to each plant */}
                <div className='border-t pt-6 mt-6'>
                  <p className='text-sm text-gray-600 italic'>
                    <Droplets className='w-4 h-4 inline mr-2 text-blue-600' />
                    To add cooling or boiler water systems with parameters, use the + button next to the plant in the table below.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className='flex justify-end space-x-3 mt-6'>
                  <button
                    type='button'
                    onClick={handlePlantCancel}
                    className='btn btn-secondary'
                  >
                    <X className='h-4 w-4 mr-2' />
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={
                      createPlantMutation.isLoading ||
                      updatePlantMutation.isLoading
                    }
                    className='btn btn-primary flex items-center'
                  >
                    {(createPlantMutation.isLoading || updatePlantMutation.isLoading) ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        {editingPlant ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className='h-4 w-4 mr-2' />
                        {editingPlant
                          ? "Update"
                          : user?.can_create_plants
                          ? "Save"
                          : "Close"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Water System Management Modal */}
        {showWaterSystemForm && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]'>
            <div className='bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  {editingWaterSystem ? 'Edit Water System' : 'Add New Water System'}
                </h3>
                <button
                  onClick={handleWaterSystemCancel}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              
              {selectedPlantForWaterSystem && (
                <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm text-blue-800'>
                    <strong>Plant:</strong> {selectedPlantForWaterSystem.name}
                  </p>
                </div>
              )}

              <form onSubmit={handleWaterSystemSubmit} className='space-y-6'>
                {/* Basic Information */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      System Name *
                    </label>
                    <input
                      type='text'
                      required
                      className='input'
                      value={waterSystemFormData.name}
                      onChange={(e) =>
                        setWaterSystemFormData({
                          ...waterSystemFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder='e.g., Cooling Tower 1, Boiler System A'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      System Type *
                    </label>
                    <select
                      required
                      className='input'
                      value={waterSystemFormData.system_type}
                      onChange={(e) =>
                        setWaterSystemFormData({
                          ...waterSystemFormData,
                          system_type: e.target.value,
                        })
                      }
                      disabled={!!editingWaterSystem}
                    >
                      <option value='cooling'>Cooling Water</option>
                      <option value='boiler'>Boiler Water</option>
                    </select>
                  </div>
                  <div className='flex items-center'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                        checked={waterSystemFormData.is_active}
                        onChange={(e) =>
                          setWaterSystemFormData({
                            ...waterSystemFormData,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <span className='ml-2 text-sm text-gray-700'>Active</span>
                    </label>
                  </div>
                </div>

                {/* Parameters Section - Show based on system type */}
                {waterSystemFormData.system_type === 'cooling' ? (
                  <div className='border-t pt-6'>
                    <h4 className='text-md font-bold text-gray-900 mb-4'>
                      <Droplets className='w-4 h-4 inline mr-2 text-blue-600' />
                      Cooling Water Parameters (All Optional)
                    </h4>
                    <p className='text-xs text-gray-500 mb-4 italic'>
                      Configure parameters for this cooling water system. All fields are optional.
                    </p>
                    <div className='space-y-6'>
                      {/* Basic Parameters */}
                      <div>
                        <h5 className='text-sm font-semibold text-gray-800 mb-3'>Basic Parameters</h5>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>pH Min</label>
                            <input
                              type='number'
                              step='0.1'
                              className='input'
                              value={waterSystemFormData.cooling_ph_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_ph_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>pH Max</label>
                            <input
                              type='number'
                              step='0.1'
                              className='input'
                              value={waterSystemFormData.cooling_ph_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_ph_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>TDS Min (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_tds_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_tds_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>TDS Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_tds_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_tds_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Hardness Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_hardness_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_hardness_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Alkalinity Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_alkalinity_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_alkalinity_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Total Alkalinity Min (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_total_alkalinity_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_total_alkalinity_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Total Alkalinity Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.cooling_total_alkalinity_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  cooling_total_alkalinity_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Optional Parameters with Enable Toggles */}
                      <div>
                        <h5 className='text-sm font-semibold text-gray-800 mb-3'>Optional Parameters</h5>
                        <div className='space-y-4'>
                          {/* Chloride */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_chloride_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_chloride_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Chloride Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_chloride_enabled && (
                              <div>
                                <label className='block text-xs text-gray-600 mb-1'>Chloride Max (ppm)</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  className='input'
                                  value={waterSystemFormData.cooling_chloride_max}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_chloride_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {/* Cycle of Concentration */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_cycle_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_cycle_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Cycle of Concentration Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_cycle_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Cycle Min</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_cycle_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_cycle_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Cycle Max</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_cycle_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_cycle_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Iron */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_iron_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_iron_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Iron Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_iron_enabled && (
                              <div>
                                <label className='block text-xs text-gray-600 mb-1'>Iron Max (ppm)</label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={waterSystemFormData.cooling_iron_max}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_iron_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {/* Phosphate */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_phosphate_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_phosphate_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Phosphate Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_phosphate_enabled && (
                              <div>
                                <label className='block text-xs text-gray-600 mb-1'>Phosphate Max (ppm)</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  className='input'
                                  value={waterSystemFormData.cooling_phosphate_max}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_phosphate_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {/* Basin Temperature */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_temperature_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_temperature_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Basin Temperature Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_temperature_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Basin Temperature Min (°C)</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_temperature_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_temperature_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Basin Temperature Max (°C)</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_temperature_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_temperature_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Hot Side Temperature */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_hot_temperature_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_hot_temperature_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Hot Side Temperature Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_hot_temperature_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Hot Side Temperature Min (°C)</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_hot_temperature_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_hot_temperature_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Hot Side Temperature Max (°C)</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_hot_temperature_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_hot_temperature_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* LSI */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_lsi_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_lsi_enabled: e.target.checked,
                                    })
                                  }
                                />
                                LSI (Langelier Saturation Index) Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_lsi_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>LSI Min</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_lsi_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_lsi_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>LSI Max</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_lsi_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_lsi_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* RSI */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.cooling_rsi_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      cooling_rsi_enabled: e.target.checked,
                                    })
                                  }
                                />
                                RSI (Ryznar Stability Index) Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.cooling_rsi_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>RSI Min</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_rsi_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_rsi_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>RSI Max</label>
                                  <input
                                    type='number'
                                    step='0.1'
                                    className='input'
                                    value={waterSystemFormData.cooling_rsi_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        cooling_rsi_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='border-t pt-6'>
                    <h4 className='text-md font-bold text-gray-900 mb-4'>
                      <Thermometer className='w-4 h-4 inline mr-2 text-red-600' />
                      Boiler Water Parameters (All Optional)
                    </h4>
                    <p className='text-xs text-gray-500 mb-4 italic'>
                      Configure parameters for this boiler water system. All fields are optional.
                    </p>
                    <div className='space-y-6'>
                      {/* Basic Parameters */}
                      <div>
                        <h5 className='text-sm font-semibold text-gray-800 mb-3'>Basic Parameters</h5>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>pH Min</label>
                            <input
                              type='number'
                              step='0.1'
                              className='input'
                              value={waterSystemFormData.boiler_ph_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_ph_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>pH Max</label>
                            <input
                              type='number'
                              step='0.1'
                              className='input'
                              value={waterSystemFormData.boiler_ph_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_ph_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>TDS Min (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.boiler_tds_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_tds_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>TDS Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.boiler_tds_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_tds_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Hardness Max (ppm)</label>
                            <input
                              type='number'
                              step='0.1'
                              className='input'
                              value={waterSystemFormData.boiler_hardness_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_hardness_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Alkalinity Min (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.boiler_alkalinity_min}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_alkalinity_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Alkalinity Max (ppm)</label>
                            <input
                              type='number'
                              step='0.01'
                              className='input'
                              value={waterSystemFormData.boiler_alkalinity_max}
                              onChange={(e) =>
                                setWaterSystemFormData({
                                  ...waterSystemFormData,
                                  boiler_alkalinity_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Optional Parameters with Enable Toggles */}
                      <div>
                        <h5 className='text-sm font-semibold text-gray-800 mb-3'>Optional Parameters</h5>
                        <div className='space-y-4'>
                          {/* P-Alkalinity */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_p_alkalinity_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_p_alkalinity_enabled: e.target.checked,
                                    })
                                  }
                                />
                                P-Alkalinity Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_p_alkalinity_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>P-Alkalinity Min (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_p_alkalinity_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_p_alkalinity_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>P-Alkalinity Max (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_p_alkalinity_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_p_alkalinity_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* OH-Alkalinity */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_oh_alkalinity_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_oh_alkalinity_enabled: e.target.checked,
                                    })
                                  }
                                />
                                OH-Alkalinity Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_oh_alkalinity_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>OH-Alkalinity Min (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_oh_alkalinity_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_oh_alkalinity_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>OH-Alkalinity Max (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_oh_alkalinity_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_oh_alkalinity_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sulphite */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_sulphite_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_sulphite_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Sulphite Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_sulphite_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Sulphite Min (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_sulphite_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_sulphite_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Sulphite Max (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_sulphite_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_sulphite_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sodium Chloride */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_sodium_chloride_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_sodium_chloride_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Sodium Chloride Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_sodium_chloride_enabled && (
                              <div>
                                <label className='block text-xs text-gray-600 mb-1'>Sodium Chloride Max (ppm)</label>
                                <input
                                  type='number'
                                  step='0.01'
                                  className='input'
                                  value={waterSystemFormData.boiler_sodium_chloride_max}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_sodium_chloride_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {/* Dissolved Oxygen (DO) */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_do_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_do_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Dissolved Oxygen (DO) Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_do_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>DO Min (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_do_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_do_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>DO Max (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_do_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_do_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Phosphate */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_phosphate_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_phosphate_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Phosphate Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_phosphate_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Phosphate Min (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_phosphate_min}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_phosphate_min: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className='block text-xs text-gray-600 mb-1'>Phosphate Max (ppm)</label>
                                  <input
                                    type='number'
                                    step='0.01'
                                    className='input'
                                    value={waterSystemFormData.boiler_phosphate_max}
                                    onChange={(e) =>
                                      setWaterSystemFormData({
                                        ...waterSystemFormData,
                                        boiler_phosphate_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Iron */}
                          <div className='border rounded-lg p-4 bg-gray-50'>
                            <div className='flex items-center justify-between mb-2'>
                              <label className='flex items-center text-sm font-medium text-gray-700'>
                                <input
                                  type='checkbox'
                                  className='mr-2'
                                  checked={waterSystemFormData.boiler_iron_enabled}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_iron_enabled: e.target.checked,
                                    })
                                  }
                                />
                                Iron Monitoring
                              </label>
                            </div>
                            {waterSystemFormData.boiler_iron_enabled && (
                              <div>
                                <label className='block text-xs text-gray-600 mb-1'>Iron Max (ppm)</label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={waterSystemFormData.boiler_iron_max}
                                  onChange={(e) =>
                                    setWaterSystemFormData({
                                      ...waterSystemFormData,
                                      boiler_iron_max: e.target.value === '' ? '' : parseFloat(e.target.value) || '',
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className='flex justify-end space-x-3 mt-6 border-t pt-4'>
                  <button
                    type='button'
                    onClick={handleWaterSystemCancel}
                    className='btn btn-secondary'
                  >
                    <X className='h-4 w-4 mr-2' />
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={
                      createWaterSystemMutation.isLoading ||
                      updateWaterSystemMutation.isLoading
                    }
                    className='btn btn-primary flex items-center'
                  >
                    {(createWaterSystemMutation.isLoading || updateWaterSystemMutation.isLoading) ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        {editingWaterSystem ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className='h-4 w-4 mr-2' />
                        {editingWaterSystem ? "Update" : "Save"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Users to Water System Modal */}
        {assigningUsersToWaterSystem && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]'>
            <div className='bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Manage Users for {assigningUsersToWaterSystem.name}
                </h3>
                <button
                  onClick={handleAssignUsersToWaterSystemCancel}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='space-y-6'>
                {/* Section 1: Currently Assigned Users (with delete option) */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Currently Assigned Users
                  </label>
                  {usersLoading ? (
                    <div className='text-sm text-gray-500'>Loading users...</div>
                  ) : assignWaterSystemUserIds.length === 0 ? (
                    <div className='text-sm text-gray-400 italic py-4 bg-gray-50 rounded border border-gray-200 text-center'>
                      No users assigned
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <div className='max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50'>
                        {assignWaterSystemUserIds.map((userId) => {
                          const userObj = users.find(u => u.id === userId);
                          if (!userObj) return null;
                          const isSelected = selectedUsersToDelete.includes(userId);
                          return (
                            <div key={userId} className='flex items-center space-x-2 py-2 px-2 hover:bg-white rounded transition-colors'>
                              <input
                                type='checkbox'
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsersToDelete([...selectedUsersToDelete, userId]);
                                  } else {
                                    setSelectedUsersToDelete(selectedUsersToDelete.filter(id => id !== userId));
                                  }
                                }}
                                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                              />
                              <span className='text-sm text-gray-700 flex-1'>
                                {userObj.first_name} {userObj.last_name} ({userObj.email})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {selectedUsersToDelete.length > 0 && (
                        <button
                          type='button'
                          onClick={handleDeleteSelectedUsers}
                          disabled={assignUsersToWaterSystemMutation.isLoading}
                          className='inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <UserMinus className='h-4 w-4 mr-2' />
                          Delete Selected ({selectedUsersToDelete.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 2: Add New Users */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Add Users
                  </label>
                  {usersError ? (
                    <div className='text-sm text-red-500'>Failed to load users</div>
                  ) : (
                    <SearchableMultiUserSelect
                      options={users.filter(u => !assignWaterSystemUserIds.includes(u.id))}
                      value={[]}
                      onChange={async (userIds) => {
                        if (userIds && userIds.length > 0 && assigningUsersToWaterSystem) {
                          const newUserIds = [...assignWaterSystemUserIds, ...userIds];
                          // Update immediately for real-time feedback
                          setAssignWaterSystemUserIds(newUserIds);
                          // Save to backend
                          try {
                            await assignUsersToWaterSystemMutation.mutateAsync({
                              id: assigningUsersToWaterSystem.id,
                              userIds: newUserIds
                            });
                            toast.success(`${userIds.length} user(s) added successfully`);
                          } catch (error) {
                            // Rollback on error
                            setAssignWaterSystemUserIds(assignWaterSystemUserIds);
                            toast.error('Failed to add users');
                          }
                        }
                      }}
                      placeholder='Search and select users to add...'
                      required={false}
                    />
                  )}
                  <p className='text-xs text-gray-500 mt-2'>
                    Select users to add to this water system.
                  </p>
                </div>
              </div>

              <div className='flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200'>
                <button
                  type='button'
                  onClick={handleAssignUsersToWaterSystemCancel}
                  className='btn btn-secondary'
                  disabled={assignUsersToWaterSystemMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleAssignUsersToWaterSystemSubmit}
                  disabled={assignUsersToWaterSystemMutation.isLoading || assignWaterSystemUserIds.length === 0}
                  className='btn btn-primary flex items-center'
                >
                  {assignUsersToWaterSystemMutation.isLoading ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Removed old parameter code - now managed via water systems */}

         {/* Assign User Modal - For Admin Users */}
         {assigningUser && !user?.can_create_plants && (
           <div className='card mb-6 relative'>
             {(updatePlantMutation.isLoading) && (
               <div className='absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-lg'>
                 <div className='flex flex-col items-center'>
                   <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4'></div>
                   <p className='text-gray-700 font-medium'>
                     Assigning user...
                   </p>
                 </div>
               </div>
             )}
             <div className='card-header'>
               <h3 className='text-lg font-medium text-gray-900'>
                 Assign/Change User - {assigningUser.name}
               </h3>
             </div>
             <div className='card-body'>
               <form onSubmit={handleAssignUserSubmit} className='space-y-4'>
                 <div>
                   <label className='block text-sm font-medium text-gray-700 mb-2'>
                     Select Plant Owner *
                   </label>
                   {usersLoading ? (
                     <div className='text-sm text-gray-500'>
                       Loading users...
                     </div>
                   ) : usersError ? (
                     <div className='text-sm text-red-500'>
                       Failed to load users
                     </div>
                                        ) : (
                      <SearchableMultiUserSelect
                         options={users}
                        value={assignUserOwnerIds}
                         onChange={(ownerIds) => {
                          setAssignUserOwnerIds(ownerIds || []);
                         }}
                         placeholder='Search and select users...'
                         required={true}
                       />
                     )}
                     <p className='text-xs text-gray-500 mt-2'>
                       Select one or more users who will be assigned as owners of this plant.
                     </p>
                 </div>
                 <div className='flex justify-end space-x-3'>
                   <button
                     type='button'
                     onClick={handleAssignUserCancel}
                     className='btn btn-secondary'
                     disabled={updatePlantMutation.isLoading}
                   >
                     <X className='h-4 w-4 mr-2' />
                     Cancel
                   </button>
                   <button
                     type='submit'
                     disabled={updatePlantMutation.isLoading}
                     className='btn btn-primary flex items-center'
                   >
                     {updatePlantMutation.isLoading ? (
                       <>
                         <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                         Assigning...
                       </>
                     ) : (
                       <>
                         <UserPlus className='h-4 w-4 mr-2' />
                         Assign User
                       </>
                     )}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

        {/* Manage Water Systems Modal */}
        {managingWaterSystems && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
              <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Manage {managingWaterSystems.systemType === 'cooling' ? 'Cooling' : 'Boiler'} Water Systems
                  </h3>
                  <p className='text-sm text-gray-500 mt-1'>
                    {managingWaterSystems.plant.name}
                  </p>
                </div>
                <button
                  onClick={handleCloseWaterSystemsModal}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              
              <div className='flex-1 overflow-y-auto px-6 py-4'>
                {(() => {
                  const plantWaterSystems = allWaterSystems.filter(ws => 
                    (typeof ws.plant === 'object' ? ws.plant.id : ws.plant) === managingWaterSystems.plant.id
                  );
                  
                  const systemType = managingWaterSystems.systemType;
                  const coolingSystems = plantWaterSystems.filter(ws => ws.system_type === 'cooling');
                  const boilerSystems = plantWaterSystems.filter(ws => ws.system_type === 'boiler');
                  
                  return (
                    <div className='space-y-6'>
                      {/* Show only the relevant section based on systemType */}
                      {/* If systemType is 'cooling', show only cooling. If 'boiler', show only boiler. If null/undefined, show both */}
                      {systemType !== 'boiler' && (
                        <div>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center space-x-2'>
                              <Droplets className='h-5 w-5 text-blue-500' />
                              <h4 className='text-md font-semibold text-gray-900'>
                                Cooling Water Systems
                              </h4>
                              <span className='text-sm text-gray-500'>
                                ({coolingSystems.length})
                              </span>
                            </div>
                            {user?.can_create_plants && (
                              <button
                                onClick={() => {
                                  handleAddWaterSystem(managingWaterSystems.plant);
                                  setTimeout(() => {
                                    setWaterSystemFormData(prev => ({
                                      ...prev,
                                      system_type: 'cooling'
                                    }));
                                  }, 100);
                                  // Don't close the manage modal
                                }}
                                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors'
                              >
                                <Plus className='h-4 w-4 mr-1' />
                                Add Cooling System
                              </button>
                            )}
                          </div>
                          {coolingSystems.length === 0 ? (
                            <div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
                              <Droplets className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                              <p className='text-sm text-gray-500'>No cooling water systems</p>
                            </div>
                          ) : (
                            <div className='space-y-3'>
                              {coolingSystems.map((ws) => {
                                // Get assigned users - handle both object and ID formats
                                const assignedUsersList = (ws.assigned_users || []).map(assignedUser => {
                                  if (typeof assignedUser === 'object' && assignedUser.id) {
                                    // Already an object with user data
                                    return {
                                      id: assignedUser.id,
                                      name: `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() || assignedUser.email || 'Unknown',
                                      email: assignedUser.email
                                    };
                                  } else {
                                    // Just an ID, try to find in users array
                                    const userObj = users.find(u => u.id === assignedUser);
                                    return userObj ? {
                                      id: userObj.id,
                                      name: `${userObj.first_name} ${userObj.last_name}`,
                                      email: userObj.email
                                    } : null;
                                  }
                                }).filter(Boolean);
                                const displayedUsers = assignedUsersList.slice(0, 5);
                                const remainingCount = assignedUsersList.length - 5;
                                
                                return (
                                  <div
                                    key={ws.id}
                                    className='flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all'
                                  >
                                    <div className='flex items-center space-x-2 flex-1'>
                                      <Droplets className='h-5 w-5 text-blue-500' />
                                      <div className='flex-1'>
                                        {/* Top: System Name and Status */}
                                        <div className='flex items-center space-x-2'>
                                          <span className='text-sm font-semibold text-gray-900'>
                                            {ws.name}
                                          </span>
                                          <span
                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                              ws.is_active
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-red-100 text-red-700 border border-red-200"
                                            }`}
                                          >
                                            {ws.is_active
                                              ? "Active"
                                              : "Inactive"}
                                          </span>
                                        </div>
                                        {/* Bottom: System Type */}
                                        <p className='text-xs text-gray-500 mt-1'>
                                          Cooling Water System
                                        </p>
                                      </div>
                                    </div>
                                    {/* Separate Users Section */}
                                    <div className='flex-1 items-center space-x-2 mx-4'>
                                      {assignedUsersList.length > 0 ? (
                                        <div className='flex items-center gap-1.5 flex-wrap max-w-[200px]'>
                                          {displayedUsers.map((user, idx) => (
                                            <span
                                              key={user.id}
                                              className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200 whitespace-nowrap'
                                            >
                                              {user.name}
                                            </span>
                                          ))}
                                          {remainingCount > 0 && (
                                            <span className='inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 whitespace-nowrap'>
                                              ... +{remainingCount} more
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className='text-xs text-gray-400 italic'>
                                          No users
                                        </span>
                                      )}
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                      {/* Only regular admins (not super admin) can assign users */}
                                      {user?.is_admin &&
                                        !user?.can_create_plants && (
                                          <button
                                            onClick={() => {
                                              handleAssignUsersToWaterSystem(
                                                ws
                                              );
                                              // Don't close manage modal for assign users
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors'
                                            title='Assign Users'
                                          >
                                            <UserPlus className='h-4 w-4 mr-1' />
                                            Users
                                          </button>
                                        )}
                                      {user?.can_create_plants && (
                                        <>
                                          <button
                                            onClick={() => {
                                              handleWaterSystemEdit(ws);
                                              // Don't close manage modal for edit
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors'
                                            title='Edit Water System'
                                          >
                                            <Edit className='h-4 w-4 mr-1' />
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleWaterSystemDelete(ws);
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors'
                                            title='Delete Water System'
                                          >
                                            <Trash2 className='h-4 w-4 mr-1' />
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Boiler Water Systems Section */}
                      {/* Only show boiler section if systemType is null/undefined (show all) or explicitly 'boiler' */}
                      {systemType !== 'cooling' && (
                        <div>
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center space-x-2'>
                              <Thermometer className='h-5 w-5 text-red-500' />
                              <h4 className='text-md font-semibold text-gray-900'>
                                Boiler Water Systems
                              </h4>
                              <span className='text-sm text-gray-500'>
                                ({boilerSystems.length})
                              </span>
                            </div>
                            {user?.can_create_plants && (
                              <button
                                onClick={() => {
                                  handleAddWaterSystem(managingWaterSystems.plant);
                                  setTimeout(() => {
                                    setWaterSystemFormData(prev => ({
                                      ...prev,
                                      system_type: 'boiler'
                                    }));
                                  }, 100);
                                  // Don't close the manage modal
                                }}
                                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors'
                              >
                                <Plus className='h-4 w-4 mr-1' />
                                Add Boiler System
                              </button>
                            )}
                          </div>
                          {boilerSystems.length === 0 ? (
                            <div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
                              <Thermometer className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                              <p className='text-sm text-gray-500'>No boiler water systems</p>
                            </div>
                          ) : (
                            <div className='space-y-3'>
                              {boilerSystems.map((ws) => {
                                // Get assigned users - handle both object and ID formats
                                const assignedUsersList = (ws.assigned_users || []).map(assignedUser => {
                                  if (typeof assignedUser === 'object' && assignedUser.id) {
                                    // Already an object with user data
                                    return {
                                      id: assignedUser.id,
                                      name: `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() || assignedUser.email || 'Unknown',
                                      email: assignedUser.email
                                    };
                                  } else {
                                    // Just an ID, try to find in users array
                                    const userObj = users.find(u => u.id === assignedUser);
                                    return userObj ? {
                                      id: userObj.id,
                                      name: `${userObj.first_name} ${userObj.last_name}`,
                                      email: userObj.email
                                    } : null;
                                  }
                                }).filter(Boolean);
                                const displayedUsers = assignedUsersList.slice(0, 5);
                                const remainingCount = assignedUsersList.length - 5;
                                
                                return (
                                  <div
                                    key={ws.id}
                                    className='flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all'
                                  >
                                    <div className='flex items-center space-x-2 flex-1'>
                                      <Thermometer className='h-5 w-5 text-red-500' />
                                      <div className='flex-1'>
                                        {/* Top: System Name and Status */}
                                        <div className='flex items-center space-x-2'>
                                          <span className='text-sm font-semibold text-gray-900'>
                                            {ws.name}
                                          </span>
                                          <span
                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                              ws.is_active
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-red-100 text-red-700 border border-red-200"
                                            }`}
                                          >
                                            {ws.is_active
                                              ? "Active"
                                              : "Inactive"}
                                          </span>
                                        </div>
                                        {/* Bottom: System Type */}
                                        <p className='text-xs text-gray-500 mt-1'>
                                          Boiler Water System
                                        </p>
                                      </div>
                                    </div>
                                    {/* Separate Users Section */}
                                    <div className='flex-1 items-center space-x-2 mx-4'>
                                      {assignedUsersList.length > 0 ? (
                                        <div className='flex items-center gap-1.5 flex-wrap max-w-[200px]'>
                                          {displayedUsers.map((user, idx) => (
                                            <span
                                              key={user.id}
                                              className='inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded border border-red-200 whitespace-nowrap'
                                            >
                                              {user.name}
                                            </span>
                                          ))}
                                          {remainingCount > 0 && (
                                            <span className='inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 whitespace-nowrap'>
                                              ... +{remainingCount} more
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className='text-xs text-gray-400 italic'>
                                          No users
                                        </span>
                                      )}
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                      {/* Only regular admins (not super admin) can assign users */}
                                      {user?.is_admin &&
                                        !user?.can_create_plants && (
                                          <button
                                            onClick={() => {
                                              handleAssignUsersToWaterSystem(
                                                ws
                                              );
                                              // Don't close manage modal for assign users
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors'
                                            title='Assign Users'
                                          >
                                            <UserPlus className='h-4 w-4 mr-1' />
                                            Users
                                          </button>
                                        )}
                                      {user?.can_create_plants && (
                                        <>
                                          <button
                                            onClick={() => {
                                              handleWaterSystemEdit(ws);
                                              // Don't close manage modal for edit
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors'
                                            title='Edit Water System'
                                          >
                                            <Edit className='h-4 w-4 mr-1' />
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleWaterSystemDelete(ws);
                                            }}
                                            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors'
                                            title='Delete Water System'
                                          >
                                            <Trash2 className='h-4 w-4 mr-1' />
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className='px-6 py-4 border-t border-gray-200 flex justify-end'>
                <button
                  onClick={handleCloseWaterSystemsModal}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

         {/* Plants Table */}
        <div className='card'>
          <div className='card-header'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-medium text-gray-900'>Plants</h3>
              <div className='flex items-center space-x-4'>
                <input
                  type='text'
                  placeholder='Search plants...'
                  className='input w-64'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                
                {/* Owner Filter (Super Admin Only) */}
                {user?.can_create_plants && (
                  <div className='w-64'>
                    <SearchableMultiUserSelect
                      options={users}
                      value={ownerFilter}
                      onChange={(selectedOwners) => {
                        setOwnerFilter(selectedOwners);
                        setCurrentPage(1); // Reset to first page when filtering
                      }}
                      placeholder='Filter by owners...'
                      allowClear={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='card-body'>
            {plantsLoading ? (
              <div className='flex items-center justify-center h-32'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
              </div>
            ) : plantsData.results.length === 0 ? (
              <div className='text-center py-8'>
                <Building2 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No plants found.</p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Plant Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Status
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Cooling Water
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Boiler Water
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Created
                        </th>
                                                                                                                                                                                                     {user?.can_create_plants && (
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Owner
                              </th>
                            )}
                           {/* Actions column visible only to Super Admin */}
                           {user?.can_create_plants && (
                             <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                               Actions
                             </th>
                           )}
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {plantsData.results.map((plant) => {
                        const plantWaterSystems = allWaterSystems.filter(ws => 
                          (typeof ws.plant === 'object' ? ws.plant.id : ws.plant) === plant.id
                        );
                        const coolingSystems = plantWaterSystems.filter(ws => ws.system_type === 'cooling');
                        const boilerSystems = plantWaterSystems.filter(ws => ws.system_type === 'boiler');
                        
                        return (
                          <React.Fragment key={plant.id}>
                            <tr>
                              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                {plant.name}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    plant.is_active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {plant.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                <div className='flex items-center space-x-2'>
                                  <Droplets className='h-4 w-4 text-blue-500' />
                                  <span className='font-medium text-gray-700'>
                                    {coolingSystems.length}
                                  </span>
                                  <button
                                    onClick={() => handleManageWaterSystems(plant, 'cooling')}
                                    className='text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium'
                                    title='Manage Cooling Water Systems'
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                <div className='flex items-center space-x-2'>
                                  <Thermometer className='h-4 w-4 text-red-500' />
                                  <span className='font-medium text-gray-700'>
                                    {boilerSystems.length}
                                  </span>
                                  <button
                                    onClick={() => handleManageWaterSystems(plant, 'boiler')}
                                    className='text-red-600 hover:text-red-700 hover:underline text-sm font-medium'
                                    title='Manage Boiler Water Systems'
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                {new Date(plant.created_at).toLocaleDateString()}
                              </td>
                                                                                                            {user?.can_create_plants && (
                               <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                               {plant.owner ? (
                                 <>
                                   <div className='text-xs font-semibold'>
                                     {plant.owner.first_name}{" "}
                                     {plant.owner.last_name}
                                   </div>
                                   <div className='text-xs'>
                                     {plant.owner.email}
                                   </div>
                                 </>
                               ) : (
                                 <span className='text-gray-400 text-xs'>
                                   No owner
                                 </span>
                               )}
                             </td>
                           )}
                                                     {/* Actions column - only for Super Admin */}
                           {user?.can_create_plants && (
                             <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                               <div className='flex space-x-2'>
                                 {/* Super Admin: Edit and Delete buttons */}
                                 <button
                                   onClick={() => handlePlantEdit(plant)}
                                   className='text-primary-600 hover:text-primary-900'
                                   title='Edit Plant'
                                 >
                                   <Edit className='h-4 w-4' />
                                 </button>
                                 <button
                                   onClick={() => handlePlantDelete(plant)}
                                   className='text-danger-600 hover:text-danger-900'
                                   title='Delete Plant'
                                 >
                                   <Trash2 className='h-4 w-4' />
                                 </button>
                               </div>
                             </td>
                           )}
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {plantsData.results.length > 0 && (
                  <div className='flex items-center justify-between mt-6'>
                    <div className='text-sm text-gray-700'>
                      Showing {(currentPage - 1) * 10 + 1} to{" "}
                      {Math.min(currentPage * 10, plantsData.count)} of{" "}
                      {plantsData.count} plants
                    </div>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className='px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                      >
                        Previous
                      </button>
                      <span className='px-3 py-2 text-sm text-gray-700'>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className='px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default DataEntry; 
