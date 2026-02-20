import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const getInitialToken = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Get user timeout')), 10000)
      );
      const response = await Promise.race([
        authService.getCurrentUser(),
        timeoutPromise,
      ]);
      return response;
    } catch (err) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
      return rejectWithValue(err.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      const response = await Promise.race([
        authService.login(email, password),
        timeoutPromise,
      ]);
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.message || 'Profile update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: getInitialToken(),
    loading: false,
    error: null,
    justLoggedIn: false,
  },
  reducers: {
    setLoading: (state, { payload }) => {
      state.loading = !!payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetLoading: (state) => {
      state.loading = false;
      state.error = null;
    },
    setToken: (state, { payload }) => {
      state.token = payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.justLoggedIn = false;
    },
    sessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.justLoggedIn = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        state.token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : state.token;
        state.justLoggedIn = false;
      })
      .addCase(getCurrentUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.user = null;
        state.token = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.refresh && typeof localStorage !== 'undefined') localStorage.setItem('refresh', payload.refresh);
        if (payload.token && typeof localStorage !== 'undefined') localStorage.setItem('token', payload.token);
        state.token = payload.token;
        state.user = payload.user;
        state.justLoggedIn = true;
        toast.success('Login successful!');
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        toast.error(payload);
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.refresh && typeof localStorage !== 'undefined') localStorage.setItem('refresh', payload.refresh);
        if (payload.token && typeof localStorage !== 'undefined') localStorage.setItem('token', payload.token);
        state.token = payload.token;
        state.user = payload.user;
        state.justLoggedIn = true;
        toast.success('Registration successful!');
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        toast.error(payload);
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        toast.success('Profile updated successfully');
      })
      .addCase(updateProfile.rejected, (state, { payload }) => {
        state.loading = false;
        toast.error(payload);
      });
  },
});

export const { setLoading, clearError, resetLoading, setToken, logout, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
