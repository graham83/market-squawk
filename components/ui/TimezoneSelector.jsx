import React from 'react';
import { Select, Option, Typography } from '@material-tailwind/react';
import useTheme from '../../hooks/useTheme.jsx';
import { TIMEZONES } from '../../utils/timezoneUtils';

/**
 * Timezone selector component
 * @param {Object} props - Component props
 * @param {string} props.selectedTimezone - Currently selected timezone
 * @param {function} props.onTimezoneChange - Callback when timezone changes
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @returns {JSX.Element} The timezone selector component
 */
const TimezoneSelector = ({ 
  selectedTimezone, 
  onTimezoneChange, 
  className = '',
  disabled = false 
}) => {
  // Theme management
  const { isDark } = useTheme();
  return (
    <div className={`${className}`}>
      <Typography variant="h6" className={`mb-2 ${
        isDark ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Timezone
      </Typography>
      <div className="w-80">
        <Select
          value={selectedTimezone}
          onChange={onTimezoneChange}
          disabled={disabled}
          className={isDark 
            ? "bg-gray-800 border-gray-700 text-white" 
            : "bg-white border-gray-300 text-gray-900"
          }
          containerProps={{
            className: "min-w-0"
          }}
          menuProps={{
            className: `max-h-64 overflow-y-auto ${
              isDark 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            }`
          }}
          labelProps={{
            className: isDark ? "text-gray-400" : "text-gray-600"
          }}
        >
          {TIMEZONES.map(timezone => (
            <Option 
              key={timezone.value} 
              value={timezone.value} 
              className={isDark 
                ? "text-white hover:bg-gray-700 focus:bg-gray-700" 
                : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
              }
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {timezone.label}
                </span>
                <span className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {timezone.abbreviation} ({timezone.offset})
                </span>
              </div>
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default TimezoneSelector;