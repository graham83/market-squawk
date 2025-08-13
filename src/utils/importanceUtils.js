/**
 * Importance utilities for the Economic Calendar
 * Handles importance filtering and localStorage persistence
 */

/**
 * Available importance levels
 */
export const IMPORTANCE_LEVELS = [
  {
    value: 'all',
    label: 'All Importance Levels',
    color: 'gray'
  },
  {
    value: 'low',
    label: 'Low Importance',
    color: 'blue'
  },
  {
    value: 'medium',
    label: 'Medium Importance',
    color: 'amber'
  },
  {
    value: 'high',
    label: 'High Importance',
    color: 'red'
  }
];

/**
 * Default importance filter (show all)
 */
export const DEFAULT_IMPORTANCE = 'all';

/**
 * Browser storage key for importance preference
 */
export const IMPORTANCE_STORAGE_KEY = 'economicCalendar_selectedImportance';

/**
 * Get importance preference from localStorage
 * @returns {string} The stored importance filter or default
 */
export const getStoredImportance = () => {
  try {
    return localStorage.getItem(IMPORTANCE_STORAGE_KEY) || DEFAULT_IMPORTANCE;
  } catch (error) {
    console.warn('Failed to read importance from localStorage:', error);
    return DEFAULT_IMPORTANCE;
  }
};

/**
 * Store importance preference in localStorage
 * @param {string} importance - The importance filter to store
 */
export const storeImportance = (importance) => {
  try {
    localStorage.setItem(IMPORTANCE_STORAGE_KEY, importance);
  } catch (error) {
    console.warn('Failed to store importance in localStorage:', error);
  }
};

/**
 * Validate if an importance level is supported
 * @param {string} importance - The importance level to validate
 * @returns {boolean} True if the importance level is valid
 */
export const isValidImportance = (importance) => {
  return IMPORTANCE_LEVELS.some(level => level.value === importance);
};

/**
 * Get importance configuration by value
 * @param {string} importanceValue - The importance identifier
 * @returns {Object|null} The importance configuration or null if not found
 */
export const getImportanceConfig = (importanceValue) => {
  return IMPORTANCE_LEVELS.find(level => level.value === importanceValue) || null;
};

/**
 * Importance hierarchy mapping (higher numbers = more important)
 */
const IMPORTANCE_HIERARCHY = {
  'low': 1,
  'medium': 2,
  'high': 3
};

/**
 * Filter events by importance level using hierarchical filtering
 * Shows selected importance level and all higher importance levels
 * @param {Array} events - Array of events to filter
 * @param {string} importance - The importance level to filter by ('all' for no filter)
 * @returns {Array} Filtered events array
 */
export const filterEventsByImportance = (events, importance) => {
  if (!events || !Array.isArray(events)) {
    return [];
  }
  
  if (importance === 'all' || !importance) {
    return events;
  }
  
  // Get the minimum importance level to show
  const minImportanceLevel = IMPORTANCE_HIERARCHY[importance];
  
  if (minImportanceLevel === undefined) {
    // If importance level is not recognized, show all events
    return events;
  }
  
  return events.filter(event => {
    const eventImportanceLevel = IMPORTANCE_HIERARCHY[event.importance];
    return eventImportanceLevel !== undefined && eventImportanceLevel >= minImportanceLevel;
  });
};