import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      const response = await Promise.race([
        authService.login(email, password),
        timeoutPromise
      ]);
      
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get user timeout')), 10000)
      );
      
      const response = await Promise.race([
        authService.getCurrentUser(),
        timeoutPromise
      ]);
      
      return response;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      toast.success('Profile updated successfully');
      return response;
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Reset all state to initial values
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Save theme before clearing
      const theme = localStorage.getItem('theme');
      
      // Clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore theme
      if (theme) {
        localStorage.setItem('theme', theme);
      }
      
      toast.success('Logged out successfully');
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    resetLoading: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success('Login successful!');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success('Registration successful!');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setLoading, resetLoading } = authSlice.actions;

// Action to completely reset the store
export const resetStore = () => ({
  type: 'RESET_STORE'
});
export default authSlice.reducer; 