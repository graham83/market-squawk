import { useState, useEffect, useCallback } from 'react';
import { 
  getStoredImportance, 
  storeImportance, 
  DEFAULT_IMPORTANCE,
  isValidImportance 
} from '../utils/importanceUtils';

/**
 * Custom hook for managing importance selection and persistence
 * @returns {Object} Hook state and actions for importance management
 */
export const useImportance = () => {
  // Initialize with stored importance or default
  const [selectedImportance, setSelectedImportance] = useState(() => {
    const stored = getStoredImportance();
    return isValidImportance(stored) ? stored : DEFAULT_IMPORTANCE;
  });

  /**
   * Update the selected importance and persist to localStorage
   * @param {string} importance - The new importance filter
   */
  const updateImportance = useCallback((importance) => {
    if (!isValidImportance(importance)) {
      console.warn('Invalid importance provided:', importance);
      return;
    }

    setSelectedImportance(importance);
    storeImportance(importance);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Importance updated to:', importance);
    }
  }, []);

  /**
   * Reset importance to default (show all)
   */
  const resetImportance = useCallback(() => {
    updateImportance(DEFAULT_IMPORTANCE);
  }, [updateImportance]);

  // Validate stored importance on mount and fix if invalid
  useEffect(() => {
    const stored = getStoredImportance();
    if (stored !== selectedImportance && isValidImportance(stored)) {
      setSelectedImportance(stored);
    } else if (!isValidImportance(stored)) {
      // Fix invalid stored importance
      storeImportance(DEFAULT_IMPORTANCE);
      setSelectedImportance(DEFAULT_IMPORTANCE);
    }
  }, [selectedImportance]);

  return {
    selectedImportance,
    updateImportance,
    resetImportance,
    isDefault: selectedImportance === DEFAULT_IMPORTANCE
  };
};

export default useImportance;