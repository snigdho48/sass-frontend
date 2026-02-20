import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      cacheTime: 0,
      staleTime: 0,
    },
  },
});

window.queryClient = queryClient;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((error) => console.log('Service Worker registration failed:', error));
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: '!bg-white !text-gray-900 !border-gray-200 dark:!bg-gray-800 dark:!text-gray-100 dark:!border-gray-700',
              }}
            />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>,
);
