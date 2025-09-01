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

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const { pageLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(setPageLoading(true));
    }
  }, [isAuthenticated, loading, dispatch]);
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);
  
  if (loading || pageLoading) {
    return <PageLoader />;
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
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  if (loading || pageLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated || !user?.is_admin) {
    return null;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  return isAuthenticated ? null : children;
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
          <Route path="data-entry" element={<DataEntry />} />
          <Route path="water-analysis" element={<WaterAnalysis />} />
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