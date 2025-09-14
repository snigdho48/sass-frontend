import React, { useState, useEffect, useRef, useCallback } from 'react';

const SearchableUserSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Search users...",
  disabled = false,
  required = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    `${option.first_name} ${option.last_name} ${option.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Get display value
  const getDisplayValue = useCallback(() => {
    if (!value) return '';
    const selectedOption = options.find(option => option.id === value);
    return selectedOption ? `${selectedOption.first_name} ${selectedOption.last_name} (${selectedOption.email})` : `User ID: ${value}`;
  }, [value, options]);

  // Initialize search term when value changes (for editing)
  useEffect(() => {
    if (value && !isOpen) {
      const selectedOption = options.find(option => option.id === value);
      if (selectedOption) {
        setSearchTerm(`${selectedOption.first_name} ${selectedOption.last_name} (${selectedOption.email})`);
      } else if (value) {
        // If user not found in options yet, show a placeholder
        setSearchTerm(`User ID: ${value}`);
      }
    }
  }, [value, options, isOpen]);

  // Reset search term when dropdown closes and we have a value
  useEffect(() => {
    if (!isOpen && value) {
      const selectedOption = options.find(option => option.id === value);
      if (selectedOption) {
        setSearchTerm(`${selectedOption.first_name} ${selectedOption.last_name} (${selectedOption.email})`);
      } else if (value) {
        setSearchTerm(`User ID: ${value}`);
      }
    }
  }, [isOpen, value, options]);

  // Handle option selection
  const handleSelect = useCallback((option) => {
    onChange(option.id);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onChange]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    // If clearing the input, clear the selection
    if (!newValue) {
      onChange(null);
    }
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
      <input
        ref={inputRef}
        type="text"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        value={isOpen ? searchTerm : (getDisplayValue() || searchTerm)}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        required={required}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users found
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

export default SearchableUserSelect;
