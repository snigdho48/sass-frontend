import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { logout } from '../store/slices/authSlice';
import { setNavigationLoading, setSidebarOpen } from '../store/slices/uiSlice';
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
  Users,
  Droplets,
} from 'lucide-react';
import { NavigationLoader } from './Loader';

const Layout = () => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { sidebarOpen, navigationLoading } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Data Entry', href: '/data-entry', icon: Database },
    { name: 'Water Analysis', href: '/water-analysis', icon: Droplets },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Add admin navigation for admin users
  if (user?.is_admin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  // Removed navigation loading effect to prevent interference with React Router

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Loader */}
      {navigationLoading && <NavigationLoader />}

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={handleSidebarClose} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">SaaS Platform</h1>
            <button
              onClick={handleSidebarClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={handleSidebarClose}
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">SaaS Platform</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={handleSidebarToggle}
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell size={20} />
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <Settings size={20} />
              </button>
              
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center gap-x-3">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.get_full_name || user?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.role} {user?.is_admin && '(Admin)'}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 