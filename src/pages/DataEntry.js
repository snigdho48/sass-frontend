import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAppSelector } from '../hooks/useAppSelector';
import { dataService } from '../services/dataService';
import { Plus, Edit, Trash2, Save, X, Database, Building2, UserPlus } from 'lucide-react';
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
    // Cooling water parameters
    cooling_ph_min: 6.5,
    cooling_ph_max: 7.8,
    cooling_tds_min: 500,
    cooling_tds_max: 800,
    cooling_hardness_max: 300,
    cooling_alkalinity_max: 300,
    cooling_chloride_max: 250,
    cooling_chloride_enabled: false,
    cooling_cycle_min: 5.0,
    cooling_cycle_max: 8.0,
    cooling_cycle_enabled: false,
    cooling_iron_max: 3.0,
    cooling_iron_enabled: false,
    cooling_phosphate_max: 10.0,
    cooling_phosphate_enabled: false,
    cooling_lsi_min: -2.0,
    cooling_lsi_max: 2.0,
    cooling_lsi_enabled: false,
    cooling_rsi_min: 6.0,
    cooling_rsi_max: 7.0,
    cooling_rsi_enabled: false,
    // Boiler water parameters
    boiler_ph_min: 10.5,
    boiler_ph_max: 11.5,
    boiler_tds_min: 2500,
    boiler_tds_max: 3500,
    boiler_hardness_max: 2.0,
    boiler_alkalinity_min: 600,
    boiler_alkalinity_max: 1400,
    // Boiler water optional parameters
    boiler_p_alkalinity_min: 500,
    boiler_p_alkalinity_max: 700,
    boiler_p_alkalinity_enabled: false,
    boiler_oh_alkalinity_min: 700,
    boiler_oh_alkalinity_max: 900,
    boiler_oh_alkalinity_enabled: false,
    boiler_sulphite_min: 30,
    boiler_sulphite_max: 60,
    boiler_sulphite_enabled: false,
    boiler_sodium_chloride_max: 200,
    boiler_sodium_chloride_enabled: false,
    boiler_do_min: 0.0,
    boiler_do_max: 0.05,
    boiler_do_enabled: false,
          boiler_phosphate_min: 2.0,
      boiler_phosphate_max: 10.0,
      boiler_phosphate_enabled: false,
      boiler_iron_max: 5,
      boiler_iron_enabled: false,
    });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState([]);

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
        cooling_ph_min: 6.5,
        cooling_ph_max: 7.8,
        cooling_tds_min: 500,
        cooling_tds_max: 800,
        cooling_hardness_max: 300,
        cooling_alkalinity_max: 300,
        cooling_chloride_max: 250,
        cooling_chloride_enabled: false,
        cooling_cycle_min: 5.0,
        cooling_cycle_max: 8.0,
        cooling_cycle_enabled: false,
        cooling_iron_max: 3.0,
        cooling_iron_enabled: false,
        boiler_ph_min: 10.5,
        boiler_ph_max: 11.5,
        boiler_tds_min: 2500,
        boiler_tds_max: 3500,
        boiler_hardness_max: 2.0,
        boiler_alkalinity_min: 600,
        boiler_alkalinity_max: 1400,
        boiler_p_alkalinity_min: 500,
        boiler_p_alkalinity_max: 700,
        boiler_p_alkalinity_enabled: false,
        boiler_oh_alkalinity_min: 700,
        boiler_oh_alkalinity_max: 900,
        boiler_oh_alkalinity_enabled: false,
        boiler_sulphite_min: 30,
        boiler_sulphite_max: 60,
        boiler_sulphite_enabled: false,
        boiler_sodium_chloride_max: 200,
        boiler_sodium_chloride_enabled: false,
        boiler_iron_max: 5,
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

    // Prepare data for submission
    const submitData = { ...plantFormData };
    
    // Ensure all boolean fields have proper values (not null/undefined)
    const booleanFields = [
      'is_active',
      'cooling_chloride_enabled',
      'cooling_cycle_enabled', 
      'cooling_iron_enabled',
      'cooling_lsi_enabled',
      'cooling_rsi_enabled',
              'boiler_p_alkalinity_enabled',
        'boiler_oh_alkalinity_enabled',
        'boiler_sulphite_enabled',
        'boiler_sodium_chloride_enabled',
        'boiler_do_enabled',
        'boiler_phosphate_enabled',
        'boiler_iron_enabled'
      ];
    
    booleanFields.forEach(field => {
      if (submitData[field] === null || submitData[field] === undefined) {
        submitData[field] = false;
      }
    });
    
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
      // Cooling water parameters
      cooling_ph_min: plant.cooling_ph_min || 6.5,
      cooling_ph_max: plant.cooling_ph_max || 7.8,
      cooling_tds_min: plant.cooling_tds_min || 500,
      cooling_tds_max: plant.cooling_tds_max || 800,
      cooling_hardness_max: plant.cooling_hardness_max || 300,
      cooling_alkalinity_max: plant.cooling_alkalinity_max || 300,
      cooling_chloride_max: plant.cooling_chloride_max || 250,
      cooling_chloride_enabled: plant.cooling_chloride_enabled || false,
      cooling_cycle_min: plant.cooling_cycle_min || 5.0,
      cooling_cycle_max: plant.cooling_cycle_max || 8.0,
      cooling_cycle_enabled: plant.cooling_cycle_enabled || false,
      cooling_iron_max: plant.cooling_iron_max || 3.0,
      cooling_iron_enabled: plant.cooling_iron_enabled || false,
      cooling_lsi_min: plant.cooling_lsi_min || -2.0,
      cooling_lsi_max: plant.cooling_lsi_max || 2.0,
      cooling_lsi_enabled: plant.cooling_lsi_enabled || false,
      cooling_rsi_min: plant.cooling_rsi_min || 6.0,
      cooling_rsi_max: plant.cooling_rsi_max || 7.0,
      cooling_rsi_enabled: plant.cooling_rsi_enabled || false,
      // Boiler water parameters
      boiler_ph_min: plant.boiler_ph_min || 10.5,
      boiler_ph_max: plant.boiler_ph_max || 11.5,
      boiler_tds_min: plant.boiler_tds_min || 2500,
      boiler_tds_max: plant.boiler_tds_max || 3500,
      boiler_hardness_max: plant.boiler_hardness_max || 2.0,
      boiler_alkalinity_min: plant.boiler_alkalinity_min || 600,
      boiler_alkalinity_max: plant.boiler_alkalinity_max || 1400,
      // Boiler water optional parameters
      boiler_p_alkalinity_min: plant.boiler_p_alkalinity_min || 500,
      boiler_p_alkalinity_max: plant.boiler_p_alkalinity_max || 700,
      boiler_p_alkalinity_enabled: plant.boiler_p_alkalinity_enabled || false,
      boiler_oh_alkalinity_min: plant.boiler_oh_alkalinity_min || 700,
      boiler_oh_alkalinity_max: plant.boiler_oh_alkalinity_max || 900,
      boiler_oh_alkalinity_enabled: plant.boiler_oh_alkalinity_enabled || false,
      boiler_sulphite_min: plant.boiler_sulphite_min || 30,
      boiler_sulphite_max: plant.boiler_sulphite_max || 60,
      boiler_sulphite_enabled: plant.boiler_sulphite_enabled || false,
              boiler_sodium_chloride_max: plant.boiler_sodium_chloride_max || 200,
        boiler_sodium_chloride_enabled: plant.boiler_sodium_chloride_enabled || false,
        boiler_do_min: plant.boiler_do_min || 0.0,
        boiler_do_max: plant.boiler_do_max || 0.05,
        boiler_do_enabled: plant.boiler_do_enabled || false,
        boiler_phosphate_min: plant.boiler_phosphate_min || 2.0,
        boiler_phosphate_max: plant.boiler_phosphate_max || 10.0,
        boiler_phosphate_enabled: plant.boiler_phosphate_enabled || false,
        boiler_iron_max: plant.boiler_iron_max || 5,
        boiler_iron_enabled: plant.boiler_iron_enabled || false,
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
      // Cooling water parameters
      cooling_ph_min: 6.5,
      cooling_ph_max: 7.8,
      cooling_tds_min: 500,
      cooling_tds_max: 800,
      cooling_hardness_max: 300,
      cooling_alkalinity_max: 300,
      cooling_chloride_max: 250,
      cooling_chloride_enabled: false,
      cooling_cycle_min: 5.0,
      cooling_cycle_max: 8.0,
      cooling_cycle_enabled: false,
      cooling_iron_max: 3.0,
      cooling_iron_enabled: false,
      cooling_lsi_min: -2.0,
      cooling_lsi_max: 2.0,
      cooling_lsi_enabled: false,
      cooling_rsi_min: 6.0,
      cooling_rsi_max: 7.0,
      cooling_rsi_enabled: false,
      // Boiler water parameters
      boiler_ph_min: 10.5,
      boiler_ph_max: 11.5,
      boiler_tds_min: 2500,
      boiler_tds_max: 3500,
      boiler_hardness_max: 2.0,
      boiler_alkalinity_min: 600,
      boiler_alkalinity_max: 1400,
      // Boiler water optional parameters
      boiler_p_alkalinity_min: 500,
      boiler_p_alkalinity_max: 700,
      boiler_p_alkalinity_enabled: false,
      boiler_oh_alkalinity_min: 700,
      boiler_oh_alkalinity_max: 900,
      boiler_oh_alkalinity_enabled: false,
      boiler_sulphite_min: 30,
      boiler_sulphite_max: 60,
      boiler_sulphite_enabled: false,
              boiler_sodium_chloride_max: 200,
        boiler_sodium_chloride_enabled: false,
        boiler_do_min: 0.0,
        boiler_do_max: 0.05,
        boiler_do_enabled: false,
        boiler_phosphate_min: 2.0,
        boiler_phosphate_max: 10.0,
        boiler_phosphate_enabled: false,
        boiler_iron_max: 5,
        boiler_iron_enabled: false,
      });
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
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Data Entry</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Log your technical data and track performance metrics.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='btn btn-primary flex items-center'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Entry
        </button>
      </div>

      {/* Category Selection */}
      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-medium text-gray-900'>Select Category</h3>
        </div>
        <div className='card-body'>
          {categoriesLoading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
            </div>
          ) : categoriesError ? (
            <div className='text-center py-8'>
              <Database className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>
                Failed to load categories. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='mt-2 text-primary-600 hover:text-primary-900'
              >
                Retry
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedCategory === category.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className='flex items-center'>
                      <Database className='h-5 w-5 text-gray-400 mr-3' />
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          {category.name}
                        </h4>
                        <p className='text-sm text-gray-500'>{category.unit}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className='text-center py-8 col-span-full'>
                  <Database className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>No categories available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Entry Form */}
      {showForm && (
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-medium text-gray-900'>
              {editingEntry ? "Edit Entry" : "Add New Entry"}
            </h3>
          </div>
          <div className='card-body'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Value
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    required
                    className='input'
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date
                  </label>
                  <input
                    type='date'
                    required
                    className='input'
                    value={formData.entry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, entry_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Notes
                </label>
                <textarea
                  rows={3}
                  className='input'
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder='Add any additional notes...'
                />
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='btn btn-secondary'
                >
                  <X className='h-4 w-4 mr-2' />
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={
                    createEntryMutation.isLoading ||
                    updateEntryMutation.isLoading
                  }
                  className='btn btn-primary'
                >
                  <Save className='h-4 w-4 mr-2' />
                  {editingEntry ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Entries List */}
      {selectedCategory && (
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-medium text-gray-900'>
              Recent Entries
            </h3>
          </div>
          <div className='card-body'>
            {isLoading ? (
              <div className='flex items-center justify-center h-32'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
              </div>
            ) : entries.length === 0 ? (
              <div className='text-center py-8'>
                <Database className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>
                  No entries found for this category.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Date
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Value
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Notes
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {entry.value}
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          {entry.notes || "-"}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => handleEdit(entry)}
                              className='text-primary-600 hover:text-primary-900'
                            >
                              <Edit className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className='text-danger-600 hover:text-danger-900'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plant Management Section - Hidden for General Users */}
      {!user?.is_general_user && (
        <div className='border-t pt-8'>
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

                {/* Cooling Water Parameters */}
                <div className='border-t pt-6'>
                  <h4 className='text-md font-medium text-gray-900 mb-4'>
                    Cooling Water Parameters
                  </h4>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        pH Min
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.cooling_ph_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_ph_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        pH Max
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.cooling_ph_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_ph_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        TDS Min (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.cooling_tds_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_tds_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        TDS Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.cooling_tds_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_tds_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Cycle Min
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.cooling_cycle_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_cycle_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Cycle Max
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.cooling_cycle_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_cycle_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Hardness Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.cooling_hardness_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_hardness_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Alkalinity Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.cooling_alkalinity_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            cooling_alkalinity_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                  </div>
                  
                                    {/* Cooling Water Optional Parameters */}
                   {user?.can_create_plants && (
                    <div className='mt-6 pt-6 border-t border-gray-200'>
                      <h5 className='text-sm font-medium text-gray-900 mb-4'>
                        Optional Cooling Water Parameters
                      </h5>
                      
                      {/* Enable/Disable Checkboxes and Input Fields for Optional Parameters */}
                      <div className='space-y-6'>
                        {/* Chloride */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.cooling_chloride_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_chloride_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>Chloride Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.cooling_chloride_enabled && (
                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Chloride Max (ppm)
                              </label>
                              <input
                                type='number'
                                step='1'
                                className='input'
                                value={plantFormData.cooling_chloride_max}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_chloride_max: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Cycle of Concentration */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.cooling_cycle_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_cycle_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>Cycle of Concentration Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.cooling_cycle_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  Cycle Min
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_cycle_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_cycle_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  Cycle Max
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_cycle_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_cycle_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Iron */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.cooling_iron_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_iron_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>Iron Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.cooling_iron_enabled && (
                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Iron Max (ppm)
                              </label>
                              <input
                                type='number'
                                step='0.1'
                                className='input'
                                value={plantFormData.cooling_iron_max}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_iron_max: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* LSI */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.cooling_lsi_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_lsi_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>LSI Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.cooling_lsi_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  LSI Min
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_lsi_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_lsi_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  LSI Max
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_lsi_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_lsi_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RSI */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.cooling_rsi_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    cooling_rsi_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>RSI Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.cooling_rsi_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  RSI Min
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_rsi_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_rsi_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  RSI Max
                                </label>
                                <input
                                  type='number'
                                  step='0.1'
                                  className='input'
                                  value={plantFormData.cooling_rsi_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      cooling_rsi_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boiler Water Parameters */}
                <div className='border-t pt-6'>
                  <h4 className='text-md font-medium text-gray-900 mb-4'>
                    Boiler Water Parameters
                  </h4>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        pH Min
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.boiler_ph_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_ph_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        pH Max
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.boiler_ph_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_ph_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        TDS Min (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.boiler_tds_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_tds_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        TDS Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.boiler_tds_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_tds_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Alkalinity Min (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.boiler_alkalinity_min}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_alkalinity_min: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Alkalinity Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='1'
                        className='input'
                        value={plantFormData.boiler_alkalinity_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_alkalinity_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Hardness Max (ppm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        className='input'
                        value={plantFormData.boiler_hardness_max}
                        onChange={(e) =>
                          setPlantFormData({
                            ...plantFormData,
                            boiler_hardness_max: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  
                                     {/* Boiler Water Optional Parameters */}
                   {user?.can_create_plants && (
                     <div className='mt-6 pt-6 border-t border-gray-200'>
                      <h5 className='text-sm font-medium text-gray-900 mb-4'>
                        Optional Boiler Water Parameters
                      </h5>
                      
                      {/* Enable/Disable Checkboxes and Input Fields for Optional Parameters */}
                      <div className='mt-6 space-y-6'>
                        {/* P-Alkalinity */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_p_alkalinity_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_p_alkalinity_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>P-Alkalinity Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.boiler_p_alkalinity_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  P-Alkalinity Min (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_p_alkalinity_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_p_alkalinity_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  P-Alkalinity Max (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_p_alkalinity_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_p_alkalinity_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* OH-Alkalinity */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_oh_alkalinity_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_oh_alkalinity_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>OH-Alkalinity Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.boiler_oh_alkalinity_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  OH-Alkalinity Min (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_oh_alkalinity_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_oh_alkalinity_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  OH-Alkalinity Max (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_oh_alkalinity_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_oh_alkalinity_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sulfite */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_sulphite_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_sulphite_enabled: e.target.checked,
                                  })
                                }
                              />
                                                            <span className='ml-2 text-sm font-medium text-gray-700'>Sulphite Monitoring</span>
                              </label>
                            </div>
                            {plantFormData.boiler_sulphite_enabled && (
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Sulphite Min (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_sulphite_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_sulphite_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                                                              </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Sulphite Max (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='1'
                                  className='input'
                                  value={plantFormData.boiler_sulphite_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_sulphite_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chlorides */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_sodium_chloride_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_sodium_chloride_enabled: e.target.checked,
                                  })
                                }
                              />
                                                            <span className='ml-2 text-sm font-medium text-gray-700'>Sodium Chloride Monitoring</span>
                              </label>
                            </div>
                            {plantFormData.boiler_sodium_chloride_enabled && (
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  Sodium Chloride Max (ppm)
                              </label>
                              <input
                                type='number'
                                step='1'
                                className='input'
                                value={plantFormData.boiler_sodium_chloride_max}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_sodium_chloride_max: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>
                          )}
                                                  </div>

                        {/* DO (Dissolved Oxygen) */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_do_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_do_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>DO (Dissolved Oxygen) Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.boiler_do_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  DO Min (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='0.001'
                                  className='input'
                                  value={plantFormData.boiler_do_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_do_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  DO Max (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='0.001'
                                  className='input'
                                  value={plantFormData.boiler_do_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_do_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Phosphate */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_phosphate_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_phosphate_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>Phosphate Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.boiler_phosphate_enabled && (
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  Phosphate Min (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='0.01'
                                  className='input'
                                  value={plantFormData.boiler_phosphate_min}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_phosphate_min: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                  Phosphate Max (ppm)
                                </label>
                                <input
                                  type='number'
                                  step='0.01'
                                  className='input'
                                  value={plantFormData.boiler_phosphate_max}
                                  onChange={(e) =>
                                    setPlantFormData({
                                      ...plantFormData,
                                      boiler_phosphate_max: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Iron */}
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center mb-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                                checked={plantFormData.boiler_iron_enabled}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_iron_enabled: e.target.checked,
                                  })
                                }
                              />
                              <span className='ml-2 text-sm font-medium text-gray-700'>Iron Monitoring</span>
                            </label>
                          </div>
                          {plantFormData.boiler_iron_enabled && (
                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Iron Max (ppm)
                              </label>
                              <input
                                type='number'
                                step='0.1'
                                className='input'
                                value={plantFormData.boiler_iron_max}
                                onChange={(e) =>
                                  setPlantFormData({
                                    ...plantFormData,
                                    boiler_iron_max: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </div>
                                                      )}
                          </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex justify-end space-x-3'>
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
                          Cooling pH Range
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Boiler pH Range
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Created
                        </th>
                                                                                                                                                                                                     {user?.can_create_plants && (
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Owner
                              </th>
                            )}
                           {/* Actions column visible to both Admin and Super Admin */}
                           {(user?.is_admin || user?.can_create_plants) && (
                             <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                               Actions
                             </th>
                           )}
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {plantsData.results.map((plant) => (
                        <tr key={plant.id}>
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
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {plant.cooling_ph_min} - {plant.cooling_ph_max}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {plant.boiler_ph_min} - {plant.boiler_ph_max}
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
                                                     {/* Actions column - different buttons for Admin vs Super Admin */}
                           {(user?.is_admin || user?.can_create_plants) && (
                             <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                               <div className='flex space-x-2'>
                                 {user?.can_create_plants ? (
                                   <>
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
                                   </>
                                 ) : (
                                   <>
                                     {/* Admin: Assign User button only */}
                                     <button
                                       onClick={() => handleAssignUser(plant)}
                                       className='text-primary-600 hover:text-primary-900'
                                       title='Assign/Change User'
                                     >
                                       <UserPlus className='h-4 w-4' />
                                     </button>
                                   </>
                                 )}
                               </div>
                             </td>
                           )}
                        </tr>
                      ))}
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
