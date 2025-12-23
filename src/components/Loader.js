import React, { useState, useEffect } from 'react';
import { DNA, Grid, Oval, Rings, TailSpin } from 'react-loader-spinner';

// DNA Loader for main loading states
export const DNALoader = ({ visible = true, size = 80, color = '#3B82F6' }) => (
  <div className="flex items-center justify-center">
    <DNA
      visible={visible}
      height={size}
      width={size}
      ariaLabel="dna-loading"
      wrapperStyle={{}}
      wrapperClass="dna-wrapper"
      color={color}
    />
  </div>
);

// Grid Loader for data loading
export const GridLoader = ({ visible = true, size = 80, color = '#3B82F6' }) => (
  <div className="flex items-center justify-center">
    <Grid
      visible={visible}
      height={size}
      width={size}
      ariaLabel="grid-loading"
      wrapperStyle={{}}
      wrapperClass="grid-wrapper"
      color={color}
    />
  </div>
);

// Oval Loader for buttons and small elements
export const OvalLoader = ({ visible = true, size = 20, color = '#FFFFFF' }) => (
  <Oval
    visible={visible}
    height={size}
    width={size}
    color={color}
    ariaLabel="oval-loading"
    secondaryColor={color}
    strokeWidth={2}
    strokeWidthSecondary={2}
  />
);

// Rings Loader for page transitions
export const RingsLoader = ({ visible = true, size = 80, color = '#3B82F6' }) => (
  <div className="flex items-center justify-center">
    <Rings
      visible={visible}
      height={size}
      width={size}
      color={color}
      ariaLabel="rings-loading"
      wrapperStyle={{}}
      wrapperClass="rings-wrapper"
    />
  </div>
);

// TailSpin Loader for navigation
export const TailSpinLoader = ({ visible = true, size = 20, color = '#3B82F6' }) => (
  <TailSpin
    visible={visible}
    height={size}
    width={size}
    color={color}
    ariaLabel="tail-spin-loading"
    radius="1"
    wrapperStyle={{}}
    wrapperClass="tail-spin-wrapper"
  />
);

// Page Loader for full page loading
export const PageLoader = () => (
  <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-center">
      <DNALoader size={100} />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Navigation Loader for route changes
export const NavigationLoader = () => (
  <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
    <div className="h-full bg-primary-600 dark:bg-primary-500 animate-pulse"></div>
  </div>
);

// Content Loader for data fetching
export const ContentLoader = ({ children, loading, error, emptyMessage = "No data available" }) => {
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    } else {
      setTimeoutReached(false);
    }
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div className="flex items-center justify-center py-12">
        <GridLoader size={60} />
      </div>
    );
  }

  if (timeoutReached) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 dark:text-red-400 mb-4">Loading timeout - please refresh the page</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400">Something went wrong</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📭</div>
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return children;
};

// Button Loader for form submissions
export const ButtonLoader = ({ loading, children, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`btn ${props.className || ''} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
  >
    {loading ? (
      <div className="flex items-center">
        <OvalLoader size={16} className="mr-2" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    )}
  </button>
);

// Skeleton Loader for content placeholders
export const SkeletonLoader = ({ className = '', lines = 3 }) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      ></div>
    ))}
  </div>
);

const LoaderComponents = {
  DNALoader,
  GridLoader,
  OvalLoader,
  RingsLoader,
  TailSpinLoader,
  PageLoader,
  NavigationLoader,
  ContentLoader,
  ButtonLoader,
  SkeletonLoader,
};

export default LoaderComponents; 