import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { loginUser, clearError, resetLoading } from '../store/slices/authSlice';
import { setNavigationLoading } from '../store/slices/uiSlice';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ButtonLoader } from '../components/Loader';
import InactiveAccountModal from '../components/InactiveAccountModal';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  
  const { loading, error, isAuthenticated, user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is inactive (admin or general user) - skip for super admin
      const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
      const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
      if (isInactive) {
        // Show modal instead of redirecting - keep it open
        setShowInactiveModal(true);
      } else {
        // User is active or super admin, proceed to dashboard
        setShowInactiveModal(false);
        // Clear navigation loading before navigating
        dispatch(setNavigationLoading(false));
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Keep modal open if user is still inactive (but not super admin)
  useEffect(() => {
    if (isAuthenticated && user) {
      const isSuperAdmin = user.is_super_admin || user.role === 'super_admin';
      const isInactive = !isSuperAdmin && (user.is_admin || user.is_general_user) && !user.is_active;
      if (isInactive && !showInactiveModal) {
        setShowInactiveModal(true);
      }
    }
  }, [isAuthenticated, user, showInactiveModal]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(resetLoading());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser(formData))
  };

  return (
    <>
      <InactiveAccountModal 
        isOpen={showInactiveModal}
        onClose={() => {
          // Only allow closing if user logs out (handled in modal)
          // Modal will stay open until user logs out
        }}
        user={user}
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="SASS Platform" 
              className="h-12 sm:h-16 w-auto"
            />
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-3 sm:gap-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-9 sm:pl-10 text-sm sm:text-base"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div >
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-9 sm:pl-10 pr-9 sm:pr-10 text-sm sm:text-base"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                Remember me
              </label>
            </div>

            <div className="text-xs sm:text-sm">
              <button
                type="button"
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                onClick={() => {/* TODO: Implement forgot password */}}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <ButtonLoader
              type="submit"
              loading={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign in
            </ButtonLoader>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Login; 