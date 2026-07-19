import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  setMonth,
  setYear,
  addYears,
  subYears,
  getYear,
  getMonth,
  setHours,
  setMinutes,
} from 'date-fns';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const YEARS_PER_PAGE = 12;

// Custom, UI-matching date-time picker. The field opens a calendar and custom
// time controls without relying on the browser's native date/time inputs.
// `value`/`onChange` use a local ISO value (yyyy-MM-dd'T'HH:mm).
const DatePicker = ({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select date and time...',
  ariaLabel = 'Select date and time',
}) => {
  const selectedDate = value ? parseISO(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate || new Date());
  // 'days' | 'months' | 'years' — header label drills up, selections drill down
  const [view, setView] = useState('days');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setViewMonth(selectedDate || new Date());
      setView('days');
      requestAnimationFrame(() => headerRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDateSelect = useCallback(
    (day) => {
      const timeSource = selectedDate || new Date();
      const combined = setMinutes(
        setHours(day, timeSource.getHours()),
        timeSource.getMinutes()
      );
      onChange?.(format(combined, "yyyy-MM-dd'T'HH:mm"));
    },
    [onChange, selectedDate]
  );

  const handleTimeChange = useCallback(
    ({ hour12, minute, period }) => {
      const base = selectedDate || new Date();
      let hour24 = Number(hour12) % 12;
      if (period === 'PM') hour24 += 12;
      const updated = setMinutes(setHours(base, hour24), Number(minute));
      onChange?.(format(updated, "yyyy-MM-dd'T'HH:mm"));
    },
    [onChange, selectedDate]
  );

  // Build the 6-week grid for the current view month
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
  const days = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  const viewYear = getYear(viewMonth);
  const yearPageStart =
    Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  const years = Array.from(
    { length: YEARS_PER_PAGE },
    (_, i) => yearPageStart + i
  );

  const handlePrev = () => {
    if (view === 'days') setViewMonth((m) => subMonths(m, 1));
    else if (view === 'months') setViewMonth((m) => subYears(m, 1));
    else setViewMonth((m) => subYears(m, YEARS_PER_PAGE));
  };

  const handleNext = () => {
    if (view === 'days') setViewMonth((m) => addMonths(m, 1));
    else if (view === 'months') setViewMonth((m) => addYears(m, 1));
    else setViewMonth((m) => addYears(m, YEARS_PER_PAGE));
  };

  const headerLabel =
    view === 'days'
      ? format(viewMonth, 'MMMM yyyy')
      : view === 'months'
      ? format(viewMonth, 'yyyy')
      : `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`;

  const selectedHour24 = selectedDate?.getHours() ?? new Date().getHours();
  const selectedHour12 = selectedHour24 % 12 || 12;
  const selectedMinute = selectedDate?.getMinutes() ?? new Date().getMinutes();
  const selectedPeriod = selectedHour24 >= 12 ? 'PM' : 'AM';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? 'analysis-date-time-popover' : undefined}
        className={`
          w-full px-2.5 sm:px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400
          transition-colors
          ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400' : ''}
        `}
      >
        <span className="flex items-center justify-between gap-2">
          <span
            className={`truncate ${
              selectedDate
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {selectedDate
              ? format(selectedDate, 'MMM d, yyyy, h:mm a')
              : placeholder}
          </span>
          <CalendarIcon
            size={16}
            className="text-gray-400 dark:text-gray-500 flex-shrink-0"
          />
        </span>
      </button>

      {isOpen && (
        <div
          id="analysis-date-time-popover"
          role="dialog"
          aria-label="Choose analysis date and time"
          className="absolute right-0 z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 animate-in fade-in zoom-in-95 duration-150 fill-mode-both"
        >
          {/* Header: prev / view label / next */}
          <div className="flex items-center justify-between mb-2">
            <button
              ref={headerRef}
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() =>
                setView((v) => (v === 'days' ? 'months' : 'years'))
              }
              disabled={view === 'years'}
              className={`px-2 py-0.5 rounded-md text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors ${
                view === 'years'
                  ? 'cursor-default'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={
                view === 'days'
                  ? 'Choose month'
                  : view === 'months'
                  ? 'Choose year'
                  : 'Year range'
              }
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {view === 'days' && (
            <>
              {/* Weekday header */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, viewMonth);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`
                        h-8 w-8 mx-auto flex items-center justify-center rounded-md text-sm transition-colors
                        ${
                          selected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : inMonth
                            ? 'text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${!selected && today ? 'ring-1 ring-blue-500 dark:ring-blue-400' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((label, idx) => {
                const isCurrent =
                  selectedDate &&
                  getYear(selectedDate) === viewYear &&
                  getMonth(selectedDate) === idx;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setViewMonth((m) => setMonth(m, idx));
                      setView('days');
                    }}
                    className={`
                      py-2 rounded-md text-sm transition-colors
                      ${
                        isCurrent
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {view === 'years' && (
            <div className="grid grid-cols-3 gap-1">
              {years.map((year) => {
                const isCurrent =
                  selectedDate && getYear(selectedDate) === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setViewMonth((m) => setYear(m, year));
                      setView('months');
                    }}
                    className={`
                      py-2 rounded-md text-sm transition-colors
                      ${
                        isCurrent
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom time controls */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock
                size={16}
                className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mr-auto">
                Time
              </span>
              <select
                value={selectedHour12}
                onChange={(event) =>
                  handleTimeChange({
                    hour12: event.target.value,
                    minute: selectedMinute,
                    period: selectedPeriod,
                  })
                }
                className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Hour"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  )
                )}
              </select>
              <span className="text-gray-500 dark:text-gray-400">:</span>
              <select
                value={selectedMinute}
                onChange={(event) =>
                  handleTimeChange({
                    hour12: selectedHour12,
                    minute: event.target.value,
                    period: selectedPeriod,
                  })
                }
                className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Minute"
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={minute}>
                    {String(minute).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={selectedPeriod}
                onChange={(event) =>
                  handleTimeChange({
                    hour12: selectedHour12,
                    minute: selectedMinute,
                    period: event.target.value,
                  })
                }
                className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="AM or PM"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange?.(format(now, "yyyy-MM-dd'T'HH:mm"));
                setViewMonth(now);
                setView('days');
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
