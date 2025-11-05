import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './hooks/useAppSelector';
import { getCurrentUser } from './store/slices/authSlice';
import { setPageLoading } from './store/slices/uiSlice';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import WaterAnalysis from './pages/WaterAnalysis';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import { PageLoader, NavigationLoader } from './components/Loader';
import { authService } from './services/authService';
import toast from 'react-hot-toast';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAppSelector(state => state.auth);
  const { pageLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(setPageLoading(true));
    }
  }, [isAuthenticated, loading, dispatch]);
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (user) {
        // Check if user is inactive - redirect to login to show modal
        const isInactive = (user.is_admin || user.is_general_user) && !user.is_active;
        if (isInactive) {
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  // Show loader only if we're loading AND not authenticated
  // If authenticated, show content even if still loading (from login process)
  if ((loading && !isAuthenticated) || pageLoading) {
    return <PageLoader />;
  }
  
  // Check if user is inactive - don't render children
  if (user) {
    const isInactive = (user.is_admin || user.is_general_user) && !user.is_active;
    if (isInactive) {
      return null; // Will redirect to login
    }
  }
  
  return isAuthenticated ? children : null;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const { pageLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(setPageLoading(true));
    }
  }, [isAuthenticated, loading, dispatch]);
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (!user?.is_admin) {
        // Only Admin and Super Admin can access Admin Panel, not General Users
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  // Show loader only if we're loading AND not authenticated
  // If authenticated, show content even if still loading (from login process)
  if ((loading && !isAuthenticated) || pageLoading) {
    return <PageLoader />;
  }
  
  // Only Admin and Super Admin can access Admin Panel, not General Users
  if (!isAuthenticated || !user?.is_admin) {
    return null;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect if user is authenticated AND active
    // Inactive users should stay on login page to see the modal
    if (isAuthenticated && user) {
      const isInactive = (user.is_admin || user.is_general_user) && !user.is_active;
      if (!isInactive) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  // Show login/register page if not authenticated OR if user is inactive (to show modal)
  const isInactive = user && (user.is_admin || user.is_general_user) && !user.is_active;
  return (isAuthenticated && !isInactive) ? null : children;
};

const DataEntryRoute = () => {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // General Users cannot access Data Entry
      if (user?.is_general_user) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAuthenticated, loading, navigate]);
  
  // Show nothing if General User (will redirect)
  if (user?.is_general_user) {
    return null;
  }

  console.log('DataEntryRoute', user);
  return <DataEntry />;
};

const WaterAnalysisRoute = () => {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Check if user is inactive general user - they cannot access Water Analysis
      if (user?.is_general_user && !user?.is_active) {
        // Show error message and redirect to dashboard
        toast.error('Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAuthenticated, loading, navigate]);
  
  // Show nothing if inactive general user (will redirect)
  if (user?.is_general_user && !user?.is_active) {
    return null;
  }
  
  // Water Analysis is accessible to all authenticated active users
  return <WaterAnalysis />;
};

function AppRoutes() {
  const { navigationLoading } = useAppSelector(state => state.ui);
  
  return (
    <>
      {navigationLoading && <NavigationLoader />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="data-entry" element={<DataEntryRoute />} />
          <Route path="water-analysis" element={<WaterAnalysisRoute />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }>
          <Route index element={<Admin />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [token, dispatch]);

  // On first load, if only refresh token exists, try refresh to get access token
  useEffect(() => {
    const tryRefresh = async () => {
      const access = localStorage.getItem('token');
      const refresh = localStorage.getItem('refresh');
      if (!access && refresh) {
        try {
          const res = await authService.refreshToken(refresh);
          const newAccess = res?.access || res?.token || res;
          if (newAccess) {
            localStorage.setItem('token', newAccess);
            dispatch(getCurrentUser());
          }
        } catch (_) {
          // ignore; user will be treated as logged out
        }
      }
    };
    tryRefresh();
  }, [dispatch]);

  return <AppRoutes />;
}

export default App; 