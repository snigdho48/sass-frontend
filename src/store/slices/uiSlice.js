import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pageLoading: false,
  navigationLoading: false,
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPageLoading: (state, { payload }) => {
      state.pageLoading = !!payload;
    },
    setNavigationLoading: (state, { payload }) => {
      state.navigationLoading = !!payload;
    },
    setSidebarOpen: (state, { payload }) => {
      state.sidebarOpen = !!payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setPageLoading, setNavigationLoading, setSidebarOpen, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
