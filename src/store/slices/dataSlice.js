import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dataService } from '../../services/dataService';
import toast from 'react-hot-toast';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataService.getCategories();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDataEntries = createAsyncThunk(
  'data/fetchDataEntries',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await dataService.getDataEntries(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createDataEntry = createAsyncThunk(
  'data/createDataEntry',
  async (entryData, { rejectWithValue }) => {
    try {
      const response = await dataService.createDataEntry(entryData);
      toast.success('Data entry created successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to create data entry');
      return rejectWithValue(error.message);
    }
  }
);

export const updateDataEntry = createAsyncThunk(
  'data/updateDataEntry',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await dataService.updateDataEntry(id, data);
      toast.success('Data entry updated successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to update data entry');
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDataEntry = createAsyncThunk(
  'data/deleteDataEntry',
  async (id, { rejectWithValue }) => {
    try {
      await dataService.deleteDataEntry(id);
      toast.success('Data entry deleted successfully');
      return id;
    } catch (error) {
      toast.error(error.message || 'Failed to delete data entry');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'data/fetchAnalytics',
  async (dateRange, { rejectWithValue }) => {
    try {
      const response = await dataService.getAnalytics(dateRange);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardData = createAsyncThunk(
  'data/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataService.getDashboardData();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  categories: [],
  dataEntries: [],
  analytics: null,
  dashboardData: null,
  selectedCategory: null,
  loading: false,
  error: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDataEntries: (state) => {
      state.dataEntries = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Data Entries
    builder
      .addCase(fetchDataEntries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDataEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.dataEntries = action.payload;
      })
      .addCase(fetchDataEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Data Entry
    builder
      .addCase(createDataEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDataEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.dataEntries.unshift(action.payload);
      })
      .addCase(createDataEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Data Entry
    builder
      .addCase(updateDataEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDataEntry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.dataEntries.findIndex(entry => entry.id === action.payload.id);
        if (index !== -1) {
          state.dataEntries[index] = action.payload;
        }
      })
      .addCase(updateDataEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Data Entry
    builder
      .addCase(deleteDataEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDataEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.dataEntries = state.dataEntries.filter(entry => entry.id !== action.payload);
      })
      .addCase(deleteDataEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Analytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Dashboard Data
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCategory, clearError, clearDataEntries } = dataSlice.actions;
export default dataSlice.reducer; 