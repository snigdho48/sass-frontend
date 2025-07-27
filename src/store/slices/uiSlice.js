import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  pageLoading: false,
  navigationLoading: false,
  theme: 'light',
  notifications: [],
  modals: {
    dataEntryForm: false,
    reportForm: false,
    confirmDelete: false,
  },
  activeTab: 'dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload;
    },
    setNavigationLoading: (state, action) => {
      state.navigationLoading = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.modals[modalName] = {
        isOpen: true,
        data: data || null,
      };
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = {
        isOpen: false,
        data: null,
      };
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setPageLoading,
  setNavigationLoading,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  setActiveTab,
} = uiSlice.actions;

export default uiSlice.reducer; 