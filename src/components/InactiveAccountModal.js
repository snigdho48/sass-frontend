import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppSelector';
import { logout } from '../store/slices/authSlice';

const InactiveAccountModal = ({ isOpen, onClose, user }) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - non-clickable */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all">

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Account Inactive
            </h3>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Your account has been deactivated.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.is_admin 
                  ? 'Please contact the system administrator to reactivate your admin account.'
                  : 'Please contact your administrator to activate your account to access the platform.'
                }
              </p>
            </div>

            {/* User info */}
            {user && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.is_admin ? 'Administrator' : 'General User'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">Inactive</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactiveAccountModal;

