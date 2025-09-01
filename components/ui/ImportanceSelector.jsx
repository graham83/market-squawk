import React from 'react';
import { Select, Option, Typography, Chip } from '@material-tailwind/react';
import { IMPORTANCE_LEVELS } from '../../utils/importanceUtils';

/**
 * Importance selector component
 * @param {Object} props - Component props
 * @param {string} props.selectedImportance - Currently selected importance filter
 * @param {function} props.onImportanceChange - Callback when importance changes
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @returns {JSX.Element} The importance selector component
 */
const ImportanceSelector = ({ 
  selectedImportance, 
  onImportanceChange, 
  className = '',
  disabled = false 
}) => {
  return (
    <div className={`${className}`}>
      <Typography variant="h6" className="text-gray-300 mb-2">
        Importance
      </Typography>
      <div className="w-64">
        <Select
          value={selectedImportance}
          onChange={onImportanceChange}
          disabled={disabled}
          className="bg-gray-800 border-gray-700 text-white"
          containerProps={{
            className: "min-w-0"
          }}
          menuProps={{
            className: "bg-gray-800 border-gray-700 text-white"
          }}
          labelProps={{
            className: "text-gray-400"
          }}
        >
          {IMPORTANCE_LEVELS.map(level => (
            <Option 
              key={level.value} 
              value={level.value} 
              className="text-white hover:bg-gray-700 focus:bg-gray-700"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">
                  {level.label}
                </span>
                {level.value !== 'all' && (
                  <Chip
                    value={level.value.toUpperCase()}
                    size="sm"
                    variant="filled"
                    className={`ml-2 text-xs !font-bold !text-center !justify-center ${
                      level.value.toLowerCase() === 'high'
                        ? '!bg-red-600 !text-white'
                        : level.value.toLowerCase() === 'medium'
                        ? '!bg-amber-600 !text-white'
                        : level.value.toLowerCase() === 'low'
                        ? '!bg-green-600 !text-white'
                        : '!bg-gray-600 !text-white'
                    }`}
                  />
                )}
              </div>
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default ImportanceSelector;