import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { dataService } from '../services/dataService';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { ButtonLoader, ContentLoader, DNALoader } from '../components/Loader';
import toast from 'react-hot-toast';

const Admin = () => {
  const { user } = useAppSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null); // Track which user's status is being toggled
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    company: '',
    phone: '',
    role: 'general_user'
  });

  useEffect(() => {
    if (user?.is_admin || user?.is_general_user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await dataService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match');
      return;
    }

    // Check permissions before creating
    const requestedRole = formData.role;
    if ((requestedRole === 'admin' || requestedRole === 'super_admin') && !user?.can_create_admin_users) {
      toast.error('Only Super Administrator can create Admin users');
      return;
    }
    if (requestedRole === 'general_user' && !user?.can_create_general_users) {
      toast.error('You do not have permission to create General Users');
      return;
    }

    try {
      await dataService.createUser(formData);
      toast.success('User created successfully');
      setShowCreateForm(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Check permissions before updating (especially if role is being changed)
    const requestedRole = formData.role;
    const currentRole = editingUser.role;
    
    if (requestedRole !== currentRole) {
      // Role is being changed, check permissions
      if ((requestedRole === 'admin' || requestedRole === 'super_admin') && !user?.can_create_admin_users) {
        toast.error('Only Super Administrator can assign Admin or Super Admin roles');
        return;
      }
      if (requestedRole === 'general_user' && !user?.can_create_general_users) {
        toast.error('You do not have permission to assign General User role');
        return;
      }
    }
    
    try {
      await dataService.updateUser(editingUser.id, formData);
      toast.success('User updated successfully');
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dataService.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleStatus = async (userItem) => {
    // Prevent users from toggling their own status
    if (userItem.id === user?.id) {
      toast.error('You cannot change your own status');
      return;
    }

    // Check permissions: Only Admin users can toggle status
    if (!user?.is_admin) {
      toast.error('You do not have permission to change user status');
      return;
    }

    setTogglingStatus(userItem.id);
    try {
      const newStatus = !userItem.is_active;
      await dataService.updateUser(userItem.id, { is_active: newStatus });
      toast.success(`User status updated to ${newStatus ? 'Active' : 'Inactive'}`);
      // Update the local state immediately for better UX
      setUsers(users.map(u => u.id === userItem.id ? { ...u, is_active: newStatus } : u));
    } catch (error) {
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      password2: '',
      company: '',
      phone: '',
      role: 'general_user'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!user?.is_admin && !user?.is_general_user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users and their roles in the system.
          </p>
        </div>
        {/* Only show Add User button for Admin and Super Admin users */}
        {user?.is_admin && (user?.can_create_admin_users || user?.can_create_general_users) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          {/* Role filter - Only show for Super Admin */}
          {user?.can_create_plants && (
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Administrator</option>
                <option value="admin">Administrator</option>
                <option value="general_user">General User</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <ContentLoader loading={loading} error={null}>
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.first_name} {userItem.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                        userItem.role === 'general_user' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {userItem.role_display || userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userItem.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user?.is_admin ? (
                        <button
                          onClick={() => handleToggleStatus(userItem)}
                          disabled={togglingStatus === userItem.id || userItem.id === user?.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            togglingStatus === userItem.id 
                              ? 'opacity-50 cursor-not-allowed border-transparent' 
                              : userItem.id === user?.id
                              ? 'cursor-not-allowed opacity-60 border-transparent'
                              : userItem.is_active 
                              ? 'cursor-pointer border-green-300 hover:border-green-500 hover:bg-green-200 hover:shadow-lg hover:shadow-green-200/50 active:scale-95 focus:ring-green-400'
                              : 'cursor-pointer border-red-300 hover:border-red-500 hover:bg-red-200 hover:shadow-lg hover:shadow-red-200/50 active:scale-95 focus:ring-red-400'
                          } ${
                            userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          title={userItem.id === user?.id ? 'You cannot change your own status' : 'Click to toggle status'}
                        >
                          {togglingStatus === userItem.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Eye className={`h-3 w-3 ${userItem.is_active ? 'text-green-700' : 'text-red-700'}`} />
                              {userItem.is_active ? 'Active' : 'Inactive'}
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Only show Edit/Delete buttons for Admin and Super Admin users */}
                        {user?.is_admin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(userItem);
                                setFormData({
                                  email: userItem.email,
                                  username: userItem.username,
                                  first_name: userItem.first_name || '',
                                  last_name: userItem.last_name || '',
                                  password: '',
                                  password2: '',
                                  company: userItem.company || '',
                                  phone: userItem.phone || '',
                                  role: userItem.role
                                });
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ContentLoader>

      {/* Create/Edit User Modal */}
      {(showCreateForm || editingUser) && (
        <div className="fixed -top-6 inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 h-screen w-screen">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="input"
                        required={!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input
                        type="password"
                        value={formData.password2}
                        onChange={(e) => setFormData({...formData, password2: e.target.value})}
                        className="input"
                        required={!editingUser}
                      />
                    </div>
                  </>
                )}
                {/* Company field - Only show for Super Admin (Admin users' company is auto-set) */}
                {user?.can_create_plants && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input"
                  />
                </div>
                {/* Role field - Only show for Super Admin (Admin users can only create General Users, role is auto-set) */}
                {user?.can_create_plants && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="input"
                      disabled={editingUser && editingUser.id === user?.id}
                    >
                      <option value="general_user">General User</option>
                      {user?.can_create_admin_users && (
                        <>
                          <option value="admin">Administrator</option>
                          <option value="super_admin">Super Administrator</option>
                        </>
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {user?.can_create_admin_users 
                        ? "Super Admin can create Admin Users and General Users"
                        : user?.can_create_general_users
                        ? "Admin can only create General Users"
                        : "You cannot create users"}
                    </p>
                  </div>
                )}
                {/* Show info message for Admin users */}
                {!user?.can_create_plants && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-800">
                      {editingUser 
                        ? "You are editing a General User. The role and company will remain as General User and your company, respectively."
                        : "You are creating a General User. The role and company will be automatically set to General User and your company, respectively."}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <ButtonLoader
                  type="submit"
                  loading={loading}
                  className="btn btn-primary"
                >
                  {editingUser ? 'Update' : 'Create'}
                </ButtonLoader>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 