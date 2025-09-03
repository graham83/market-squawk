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
  // Initialize with default timezone to prevent hydration mismatch
  // The real stored value will be set in useEffect after hydration
  const [selectedTimezone, setSelectedTimezone] = useState(DEFAULT_TIMEZONE);

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

  // Load stored timezone after hydration to prevent mismatch
  useEffect(() => {
    const stored = getStoredTimezone();
    if (isValidTimezone(stored)) {
      setSelectedTimezone(stored);
    } else if (stored !== DEFAULT_TIMEZONE) {
      // Fix invalid stored timezone
      storeTimezone(DEFAULT_TIMEZONE);
    }
  }, []); // Only run once after mount

  return {
    selectedTimezone,
    updateTimezone,
    resetTimezone,
    isDefault: selectedTimezone === DEFAULT_TIMEZONE
  };
};

export default useTimezone;