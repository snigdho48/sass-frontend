import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { dataService } from '../services/dataService';
import { Plus, Edit, Trash2, Save, X, Database } from 'lucide-react';
import toast from 'react-hot-toast';

const DataEntry = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    entry_date: new Date().toISOString().split('T')[0],
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const queryClient = useQueryClient();

  const { data: categories = [], error: categoriesError, isLoading: categoriesLoading } = useQuery('categories', dataService.getCategories, {
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Categories error:', error);
      toast.error('Failed to load categories');
    }
  });
  const { data: entries = [], isLoading } = useQuery(
    ['entries', selectedCategory],
    () => dataService.getDataEntries({ category: selectedCategory }),
    { enabled: !!selectedCategory }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Entry</h1>
          <p className="mt-1 text-sm text-gray-500">
            Log your technical data and track performance metrics.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Category Selection */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Select Category</h3>
        </div>
        <div className="card-body">
          {categoriesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Failed to load categories. Please try again.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-primary-600 hover:text-primary-900"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedCategory === category.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-500">{category.unit}</p>
                  </div>
                </div>
              </button>
            )) : (
              <div className="text-center py-8 col-span-full">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No categories available.</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Data Entry Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEntryMutation.isLoading || updateEntryMutation.isLoading}
                  className="btn btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingEntry ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Entries List */}
      {selectedCategory && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No entries found for this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.value}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {entry.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default DataEntry; 