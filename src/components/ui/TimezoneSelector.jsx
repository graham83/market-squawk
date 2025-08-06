import React from 'react';
import { Select, Option, Typography } from '@material-tailwind/react';
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
  return (
    <div className={`${className}`}>
      <Typography variant="h6" className="text-gray-300 mb-2">
        Timezone
      </Typography>
      <div className="w-80">
        <Select
          value={selectedTimezone}
          onChange={onTimezoneChange}
          disabled={disabled}
          className="bg-gray-800 border-gray-700 text-white"
          containerProps={{
            className: "min-w-0"
          }}
          menuProps={{
            className: "bg-gray-800 border-gray-700 text-white max-h-64 overflow-y-auto"
          }}
          labelProps={{
            className: "text-gray-400"
          }}
        >
          {TIMEZONES.map(timezone => (
            <Option 
              key={timezone.value} 
              value={timezone.value} 
              className="text-white hover:bg-gray-700 focus:bg-gray-700"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {timezone.label}
                </span>
                <span className="text-xs text-gray-400">
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