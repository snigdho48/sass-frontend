import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './hooks/useAppSelector';
import { getCurrentUser, clearStaleUser } from './store/slices/authSlice';
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

// Utility function to decode JWT token and get user_id
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAppSelector(state => state.auth);
  const { pageLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Show loader if we're loading (including initial load with token)
  // or if pageLoading is true
  useEffect(() => {
    if (loading || (token && !isAuthenticated && !user)) {
      dispatch(setPageLoading(true));
    } else {
      dispatch(setPageLoading(false));
    }
  }, [loading, isAuthenticated, user, token, dispatch]);
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    if (!loading) {
      if (!isAuthenticated) {
        // Small delay to prevent navigation during unmount
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
        }, 0);
      } else if (user && typeof user === 'object') {
        // Check if user is inactive - redirect to login to show modal
        // Super admin can always access
        const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
        const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
        if (isInactive) {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              navigate('/login', { replace: true });
            }
          }, 0);
        }
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, loading, navigate]);
  
  // Show loader if loading or pageLoading
  if (loading || pageLoading || (token && !user)) {
    return <PageLoader />;
  }
  
  // If not authenticated and no token, don't render
  if (!isAuthenticated && !token) {
    return null;
  }
  
  // If authenticated but no user yet, show loader
  if (isAuthenticated && !user) {
    return <PageLoader />;
  }
  
  // Check if user is inactive - don't render children (but allow super admin)
  if (user && typeof user === 'object') {
    const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
    const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
    if (isInactive) {
      return null; // Will redirect to login
    }
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, token } = useAppSelector(state => state.auth);
  const { pageLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading || (token && !isAuthenticated && !user)) {
      dispatch(setPageLoading(true));
    } else {
      dispatch(setPageLoading(false));
    }
  }, [loading, isAuthenticated, user, token, dispatch]);
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    if (!loading) {
      if (!isAuthenticated) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate("/login", { replace: true });
          }
        }, 0);
      } else if (user && typeof user === 'object' && !user.is_admin) {
        // Only Admin and Super Admin can access Admin Panel, not General Users
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate("/dashboard", { replace: true });
          }
        }, 0);
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, loading, navigate]);
  
  // Show loader if loading or pageLoading
  if (loading || pageLoading || (token && !user)) {
    return <PageLoader />;
  }
  
  // Only Admin and Super Admin can access Admin Panel, not General Users
  if (!isAuthenticated || !user || typeof user !== 'object' || !user.is_admin) {
    return null;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    // Only redirect if user is authenticated AND active (or super admin)
    // Inactive users should stay on login page to see the modal
    if (!loading && isAuthenticated && user && typeof user === 'object') {
      const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
      const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
      if (!isInactive) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate('/dashboard', { replace: true });
          }
        }, 0);
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, loading, navigate]);
  
  // Show login/register page if not authenticated OR if user is inactive (to show modal)
  // Super admin can always access
  const isSuperAdmin = user && typeof user === 'object' && (user.is_super_admin || user.role === 'super_admin');
  const isInactive = user && typeof user === 'object' && !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
  return (isAuthenticated && !isInactive) ? null : children;
};

const DataEntryRoute = () => {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    if (!loading && isAuthenticated && user && typeof user === 'object') {
      // General Users cannot access Data Entry
      if (user.is_general_user) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate('/dashboard', { replace: true });
          }
        }, 0);
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isAuthenticated, loading, navigate]);
  
  // Show loader if loading
  if (loading || !user) {
    return <PageLoader />;
  }
  
  // Show nothing if General User (will redirect)
  if (user && typeof user === 'object' && user.is_general_user) {
    return null;
  }

  console.log('DataEntryRoute', user);
  return <DataEntry />;
};

const WaterAnalysisRoute = () => {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    if (!loading && isAuthenticated && user && typeof user === 'object') {
      // Check if user is inactive general user - they cannot access Water Analysis
      if (user.is_general_user && !user.is_active) {
        // Show error message and redirect to dashboard
        toast.error('Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.');
        timeoutId = setTimeout(() => {
          if (isMounted) {
            navigate('/dashboard', { replace: true });
          }
        }, 0);
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isAuthenticated, loading, navigate]);
  
  // Show loader if loading
  if (loading || !user) {
    return <PageLoader />;
  }
  
  // Show nothing if inactive general user (will redirect)
  if (user && typeof user === 'object' && user.is_general_user && !user.is_active) {
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
          <Route path="plant-manage" element={<DataEntryRoute />} />
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
  const { token, user, justLoggedIn } = useAppSelector(state => state.auth);
  
  // Validate persisted user against token on mount and when token changes
  useEffect(() => {
    if (token && user) {
      const decodedToken = decodeJWT(token);
      const tokenUserId = decodedToken?.user_id?.toString();
      const persistedUserId = user?.id?.toString();
      
      // If token user_id doesn't match persisted user id, clear user and fetch correct one
      if (tokenUserId && persistedUserId && tokenUserId !== persistedUserId) {
        console.warn('Token user_id mismatch detected. Clearing stale user data.');
        // Clear the stale user data
        dispatch(clearStaleUser());
        // Fetch the correct user
        dispatch(getCurrentUser());
      }
    }
  }, [token, user, dispatch]);
  
  useEffect(() => {
    // Only call getCurrentUser if:
    // 1. We have a token
    // 2. We don't have a user yet (initial load or page refresh)
    // 3. We didn't just log in (to prevent overwriting login response with stale data)
    if (token && !user && !justLoggedIn) {
      dispatch(getCurrentUser());
    }
  }, [token, user, justLoggedIn, dispatch]);
  

  // On first load, if only refresh token exists, try refresh to get access token
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
            dispatch(getCurrentUser());
          }
        } catch (_) {
          // Clear invalid refresh token
          if (isMounted) {
            localStorage.removeItem('refresh');
          }
          // ignore; user will be treated as logged out
        }
      }
    };
    tryRefresh();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return <AppRoutes />;
}

export default App; 