import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className='text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 p-1 sm:p-0 transition-colors duration-200'
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={18} className="sm:w-5 sm:h-5" />
      ) : (
        <Moon size={18} className="sm:w-5 sm:h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;

