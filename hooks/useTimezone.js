import { useState, useEffect, useCallback } from 'react';
import { 
  getStoredTimezone, 
  storeTimezone, 
  DEFAULT_TIMEZONE,
  isValidTimezone 
} from '../utils/timezoneUtils';

/**
 * Custom hook for managing timezone selection and persistence
 * @returns {Object} Hook state and actions for timezone management
 */
export const useTimezone = () => {
  // Initialize with stored timezone or default
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    const stored = getStoredTimezone();
    return isValidTimezone(stored) ? stored : DEFAULT_TIMEZONE;
  });

  /**
   * Update the selected timezone and persist to localStorage
   * @param {string} timezone - The new timezone identifier
   */
  const updateTimezone = useCallback((timezone) => {
    if (!isValidTimezone(timezone)) {
      console.warn('Invalid timezone provided:', timezone);
      return;
    }

    setSelectedTimezone(timezone);
    storeTimezone(timezone);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Timezone updated to:', timezone);
    }
  }, []);

  /**
   * Reset timezone to default
   */
  const resetTimezone = useCallback(() => {
    updateTimezone(DEFAULT_TIMEZONE);
  }, [updateTimezone]);

  // Validate stored timezone on mount and fix if invalid
  useEffect(() => {
    const stored = getStoredTimezone();
    if (stored !== selectedTimezone && isValidTimezone(stored)) {
      setSelectedTimezone(stored);
    } else if (!isValidTimezone(stored)) {
      // Fix invalid stored timezone
      storeTimezone(DEFAULT_TIMEZONE);
      setSelectedTimezone(DEFAULT_TIMEZONE);
    }
  }, [selectedTimezone]);

  return {
    selectedTimezone,
    updateTimezone,
    resetTimezone,
    isDefault: selectedTimezone === DEFAULT_TIMEZONE
  };
};

export default useTimezone;