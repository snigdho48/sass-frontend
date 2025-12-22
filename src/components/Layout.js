import React, { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { logout, resetStore } from '../store/slices/authSlice';
import { setSidebarOpen, setNavigationLoading } from '../store/slices/uiSlice';
import { authService } from '../services/authService';
import { useNavigationLoading } from '../hooks/useNavigationLoading';
import {
  BarChart3,
  Database,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  Shield,
  Droplets,
} from 'lucide-react';
import { NavigationLoader } from './Loader';
import InstallPrompt from './InstallPrompt';
import toast from 'react-hot-toast';

const Layout = () => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { sidebarOpen, navigationLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  // Use navigation loading hook to automatically clear loader on route changes
  useNavigationLoading();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    // Data Entry is hidden for General Users, but Water Analysis is available
    ...(user?.is_general_user ? [] : [
      { name: 'Plant Management', href: '/plant-manage', icon: Database }
    ]),
    { name: 'Water Analysis', href: '/water-analysis', icon: Droplets },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Add admin navigation for admin users only (not for General Users)
  if (user?.is_admin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  // Clear navigation loading when user becomes authenticated (after login)
  useEffect(() => {
    if (isAuthenticated && user && navigationLoading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        dispatch(setNavigationLoading(false));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigationLoading, dispatch]);

  const handleLogout = async () => {
    try {
      // Clear React Query cache
      if (window.queryClient) {
        window.queryClient.clear();
      }
      // Call auth service logout to clear tokens on server
      await authService.logout();
      // Dispatch Redux logout action
      dispatch(logout());
      // Reset the entire store
      dispatch(resetStore());
      // Clear all localStorage completely
      localStorage.clear();
      sessionStorage.clear();
      // Force a hard redirect to ensure complete logout
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still logout locally
      dispatch(logout());
      dispatch(resetStore());
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  const handleSidebarToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const handleNavigationClick = (e, item) => {
    // Block Water Analysis navigation for inactive general users
    if (item.href === '/water-analysis' && user?.is_general_user && !user?.is_active) {
      e.preventDefault();
      toast.error('Your account is inactive. Please contact your administrator to activate your account to access Water Analysis.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navigation Loader */}
      {navigationLoading && <NavigationLoader />}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-75'
          onClick={handleSidebarClose}
        />
        <div className='fixed inset-y-0 left-0 flex w-64 flex-col bg-white'>
          <div className='flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4'>
            <div className='flex h-14 sm:h-16 items-center px-3 sm:px-4 justify-center'>
              <img
                src='/logo.png'
                alt='WaterSight'
                className='h-10 sm:h-12 w-auto'
              />
            </div>
            <button
              onClick={handleSidebarClose}
              className='text-gray-400 hover:text-gray-600 p-1'
              aria-label="Close sidebar"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
          <nav className='flex-1 space-y-1 px-2 py-3 sm:py-4 overflow-y-auto'>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  onClick={(e) => {
                    handleNavigationClick(e, item);
                    handleSidebarClose();
                  }}
                >
                  <item.icon size={18} className='mr-2 sm:mr-3 sm:w-5 sm:h-5' />
                  <span className="text-sm sm:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <div className='flex flex-col flex-grow bg-white border-r border-gray-200'>
          <div className='flex h-16 items-center px-4 justify-center'>
            <img src='/logo.png' alt='WaterSight' className='h-12 w-auto' />
          </div>
          <nav className='flex-1 space-y-1 px-2 py-4 overflow-y-auto'>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  onClick={(e) => handleNavigationClick(e, item)}
                >
                  <item.icon size={20} className='mr-3' />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top header */}
        <div className='sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200 bg-white px-3 sm:px-4 shadow-sm sm:gap-x-6 lg:px-8'>
          <button
            type='button'
            className='-m-2.5 p-2 text-gray-700 lg:hidden'
            onClick={handleSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Logo */}
          {/* <div className='flex items-center'>
            <img src='/logo.png' alt='WaterSight' className='h-14 w-auto' />
          </div> */}

          <div className='flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6'>
            <div className='flex flex-1' />
            <div className='flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6'>
              {/* User menu */}
              <div className='relative'>
                <div className='flex items-center gap-x-2 sm:gap-x-3'>
                  <div className='flex flex-col text-right min-w-0'>
                    <span className='text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-[120px] lg:max-w-none' title={user?.get_full_name || user?.email}>
                      {(() => {
                        const fullName = user?.get_full_name || user?.email || '';
                        // Truncate to 10 characters on mobile
                        if (fullName.length > 10) {
                          return fullName.substring(0, 10) + '...';
                        }
                        return fullName;
                      })()}
                    </span>
                    <span className='text-xs text-gray-500 hidden sm:block'>
                      {user?.role_display?.replace('General User', 'User').replace('Administrator', 'Admin').replace('Super Administrator', 'Super Admin') || user?.role}
                    </span>
                    <span className='text-xs text-gray-500 sm:hidden truncate max-w-[100px]' title={user?.role_display || user?.role}>
                      {user?.role_display?.replace('General User', 'User').replace('Administrator', 'Admin').replace('Super Administrator', 'Super Admin') || user?.role}
                    </span>
                  </div>
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user?.get_full_name || user?.email}
                      className='h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover flex-shrink-0 border-2 border-primary-200'
                      onError={(e) => {
                        // Hide image and show fallback
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.profile-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 ${user?.profile_picture ? 'hidden profile-fallback' : ''}`}>
                    <span className='text-xs sm:text-sm font-medium text-white'>
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className='text-gray-400 hover:text-gray-600 p-1 sm:p-0'
                title='Logout'
                aria-label="Logout"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='py-4 sm:py-6'>
          <div className='mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 xl:px-8'>
            <Outlet />
          </div>
        </main>
        
        {/* Install Prompt */}
        {isAuthenticated && <InstallPrompt />}
      </div>
    </div>
  );
};

export default Layout; 