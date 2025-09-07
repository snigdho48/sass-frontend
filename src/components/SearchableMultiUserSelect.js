import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const SearchableMultiUserSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Search users...",
  disabled = false,
  allowClear = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(option =>
    !value.includes(option.id) &&
    `${option.first_name} ${option.last_name} ${option.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Get selected options
  const selectedOptions = options.filter(option => value.includes(option.id));

  // Handle option selection
  const handleSelect = useCallback((option) => {
    const newValue = [...value, option.id];
    onChange(newValue);
    setSearchTerm('');
    setSelectedIndex(-1);
  }, [value, onChange]);

  // Handle removing a selected option
  const handleRemove = useCallback((optionId) => {
    const newValue = value.filter(id => id !== optionId);
    onChange(newValue);
  }, [value, onChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [filteredOptions, selectedIndex, handleSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className={`w-full min-h-[42px] px-3 py-2 border rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
      }`}>
        {/* Selected items */}
        {selectedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {option.first_name} {option.last_name}
                <button
                  type="button"
                  onClick={() => handleRemove(option.id)}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {allowClear && selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                disabled={disabled}
              >
                Clear all
              </button>
            )}
          </div>
        )}
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className={`w-full border-0 p-0 focus:outline-none focus:ring-0 ${
            disabled ? 'bg-transparent cursor-not-allowed' : ''
          }`}
          placeholder={selectedOptions.length === 0 ? placeholder : "Add more users..."}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'No users found' : 'All users selected'}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleSelect(option)}
              >
                <div className="font-medium">
                  {option.first_name} {option.last_name}
                </div>
                <div className="text-gray-500 text-xs">
                  {option.email}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableMultiUserSelect;
