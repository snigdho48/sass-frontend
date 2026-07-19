import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storageImport from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

// Vite ESM interop: CJS default export may arrive as { default: storage }
const storage = storageImport?.default ?? storageImport;

// Import reducers
import authReducer from './slices/authSlice';
import dataReducer from './slices/dataSlice';
import uiReducer from './slices/uiSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  data: dataReducer,
  ui: uiReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: (state, action) => {
    if (action.type === 'RESET_STORE') {
      // Reset the entire store state
      return persistedReducer(undefined, action);
    }
    return persistedReducer(state, action);
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch; 