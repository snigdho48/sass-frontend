import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, sessionExpired, setToken } from './store/slices/authSlice';
import { setPageLoading } from './store/slices/uiSlice';
import { authService } from './services/authService';
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
import toast from 'react-hot-toast';

const PrivateRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);
  const pageLoading = useSelector((state) => state.ui.pageLoading);
  const navigate = useNavigate();
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    dispatch(setPageLoading(loading || (!!token && !user)));
  }, [loading, user, token, dispatch]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    if (!loading) {
      if (!isAuthenticated) {
        timeoutId = setTimeout(() => { if (isMounted) navigate('/login', { replace: true }); }, 0);
      } else if (user && typeof user === 'object') {
        const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
        const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
        if (isInactive) {
          timeoutId = setTimeout(() => { if (isMounted) navigate('/login', { replace: true }); }, 0);
        }
      }
    }
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [isAuthenticated, user, loading, navigate]);

  if (loading || pageLoading || (token && !user)) return <PageLoader />;
  if (!isAuthenticated && !token) return null;
  if (isAuthenticated && !user) return <PageLoader />;
  if (user && typeof user === 'object') {
    const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
    const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
    if (isInactive) return null;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);
  const pageLoading = useSelector((state) => state.ui.pageLoading);
  const navigate = useNavigate();
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    dispatch(setPageLoading(loading || (!!token && !user)));
  }, [loading, user, token, dispatch]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    if (!loading) {
      if (!isAuthenticated) {
        timeoutId = setTimeout(() => { if (isMounted) navigate('/login', { replace: true }); }, 0);
      } else if (user && typeof user === 'object' && !user.is_admin) {
        timeoutId = setTimeout(() => { if (isMounted) navigate('/dashboard', { replace: true }); }, 0);
      }
    }
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [isAuthenticated, user, loading, navigate]);

  if (loading || pageLoading || (token && !user)) return <PageLoader />;
  if (!isAuthenticated || !user || typeof user !== 'object' || !user.is_admin) return null;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    if (!loading && isAuthenticated && user && typeof user === 'object') {
      const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
      const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
      if (!isInactive) {
        timeoutId = setTimeout(() => { if (isMounted) navigate('/dashboard', { replace: true }); }, 0);
      }
    }
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [isAuthenticated, user, loading, navigate]);

  const isSuperAdmin = user && typeof user === 'object' && (user.is_super_admin || user.role === 'super_admin');
  const isInactive = user && typeof user === 'object' && !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
  return (isAuthenticated && !isInactive) ? null : children;
};

const DataEntryRoute = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    if (!loading && isAuthenticated && user && typeof user === 'object' && user.is_general_user) {
      timeoutId = setTimeout(() => { if (isMounted) navigate('/dashboard', { replace: true }); }, 0);
    }
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [user, isAuthenticated, loading, navigate]);

  if (loading || !user) return <PageLoader />;
  if (user && typeof user === 'object' && user.is_general_user) return null;
  return <DataEntry />;
};

const WaterAnalysisRoute = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    if (!loading && user && typeof user === 'object' && user.is_general_user && !user.is_active) {
      toast.error('Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.');
      timeoutId = setTimeout(() => { if (isMounted) navigate('/dashboard', { replace: true }); }, 0);
    }
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [user, loading, navigate]);

  if (loading || !user) return <PageLoader />;
  if (user && typeof user === 'object' && user.is_general_user && !user.is_active) return null;
  return <WaterAnalysis />;
};

function AppRoutes() {
  const navigationLoading = useSelector((state) => state.ui.navigationLoading);

  return (
    <>
      {navigationLoading && <NavigationLoader />}
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="plant-manage" element={<DataEntryRoute />} />
          <Route path="water-analysis" element={<WaterAnalysisRoute />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
          <Route index element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  const dispatch = useDispatch();
  const { token, user, justLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user && !justLoggedIn) {
      dispatch(getCurrentUser()).catch(() => {});
    }
  }, [token, user, justLoggedIn, dispatch]);

  useEffect(() => {
    let isMounted = true;
    const tryRefresh = async () => {
      const access = localStorage.getItem('token');
      const refresh = localStorage.getItem('refresh');
      if (!access && refresh) {
        try {
          const res = await authService.refreshToken(refresh);
          const newAccess = res?.access || res?.token || res;
          if (newAccess && isMounted) {
            localStorage.setItem('token', newAccess);
            dispatch(setToken(newAccess));
            dispatch(getCurrentUser()).catch(() => {});
          }
        } catch (_) {
          if (isMounted) localStorage.removeItem('refresh');
        }
      }
    };
    tryRefresh();
    return () => { isMounted = false; };
  }, [dispatch]);

  useEffect(() => {
    window.__onAuthExpired = () => {
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      sessionStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      dispatch(sessionExpired());
      toast.error('Session expired. Please log in again.');
      if (typeof window !== 'undefined' && window.queryClient) window.queryClient.clear();
    };
    return () => { window.__onAuthExpired = null; };
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
