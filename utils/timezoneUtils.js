/**
 * Timezone utilities for the Economic Calendar
 * Handles timezone selection, conversion, and display formatting
 */

/**
 * Common timezone configurations
 * Using IANA timezone identifiers for consistency
 */
export const TIMEZONES = [
  {
    value: 'UTC',
    label: 'UTC (Coordinated Universal Time)',
    abbreviation: 'UTC',
    offset: '+00:00'
  },
  {
    value: 'America/New_York',
    label: 'Eastern Time (US & Canada)',
    abbreviation: 'ET',
    offset: 'UTC-5/-4'
  },
  {
    value: 'America/Chicago',
    label: 'Central Time (US & Canada)',
    abbreviation: 'CT',
    offset: 'UTC-6/-5'
  },
  {
    value: 'America/Denver',
    label: 'Mountain Time (US & Canada)',
    abbreviation: 'MT',
    offset: 'UTC-7/-6'
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time (US & Canada)',
    abbreviation: 'PT',
    offset: 'UTC-8/-7'
  },
  {
    value: 'Europe/London',
    label: 'Greenwich Mean Time (London)',
    abbreviation: 'GMT',
    offset: 'UTC+0/+1'
  },
  {
    value: 'Europe/Frankfurt',
    label: 'Central European Time (Frankfurt)',
    abbreviation: 'CET',
    offset: 'UTC+1/+2'
  },
  {
    value: 'Asia/Tokyo',
    label: 'Japan Standard Time (Tokyo)',
    abbreviation: 'JST',
    offset: 'UTC+9'
  },
  {
    value: 'Asia/Hong_Kong',
    label: 'Hong Kong Time',
    abbreviation: 'HKT',
    offset: 'UTC+8'
  },
  {
    value: 'Asia/Singapore',
    label: 'Singapore Standard Time',
    abbreviation: 'SGT',
    offset: 'UTC+8'
  },
  {
    value: 'Australia/Sydney',
    label: 'Australian Eastern Time (Sydney)',
    abbreviation: 'AEST',
    offset: 'UTC+10/+11'
  }
];

/**
 * Default timezone (UTC)
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Calendar timezone - Economic events are typically published in Eastern Time
 */
export const CALENDAR_TIMEZONE = 'America/New_York';

/**
 * Browser storage key for timezone preference
 */
export const TIMEZONE_STORAGE_KEY = 'economicCalendar_selectedTimezone';

/**
 * Get timezone preference from localStorage
 * @returns {string} The stored timezone or default
 */
export const getStoredTimezone = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TIMEZONE_STORAGE_KEY) || DEFAULT_TIMEZONE;
    }
    return DEFAULT_TIMEZONE;
  } catch (error) {
    console.warn('Failed to read timezone from localStorage:', error);
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Store timezone preference in localStorage
 * @param {string} timezone - The timezone identifier to store
 */
export const storeTimezone = (timezone) => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    }
  } catch (error) {
    console.warn('Failed to store timezone in localStorage:', error);
  }
};

/**
 * Parse a date string as UTC, ensuring consistent timezone interpretation
 * @param {string} dateString - The date string to parse
 * @returns {Date} Date object in UTC
 */
const parseAsUTC = (dateString) => {
  // If the date string doesn't end with 'Z' and doesn't have timezone info,
  // append 'Z' to ensure it's parsed as UTC
  if (typeof dateString === 'string' && 
      !dateString.endsWith('Z') && 
      !dateString.includes('+') && 
      !dateString.includes('-', 10)) { // Don't match negative dates, only timezone offsets
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
};

/**
 * Format a date in the specified timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - The timezone identifier
 * @param {Object} options - Additional formatting options
 * @returns {Object} Formatted date and time strings
 */
export const formatDateInTimezone = (date, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const dateObj = typeof date === 'string' ? parseAsUTC(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided:', date);
    return {
      date: 'Invalid Date',
      time: 'Invalid Time',
      datetime: 'Invalid DateTime'
    };
  }

  const defaultDateOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
    ...options.dateOptions
  };

  const defaultTimeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone,
    ...options.timeOptions
  };

  try {
    const formattedDate = dateObj.toLocaleDateString('en-US', defaultDateOptions);
    const formattedTime = dateObj.toLocaleTimeString('en-US', defaultTimeOptions);
    const formattedDateTime = dateObj.toLocaleString('en-US', {
      ...defaultDateOptions,
      ...defaultTimeOptions
    });

    return {
      date: formattedDate,
      time: formattedTime,
      datetime: formattedDateTime
    };
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    return {
      date: 'Format Error',
      time: 'Format Error', 
      datetime: 'Format Error'
    };
  }
};

/**
 * Get timezone configuration by value
 * @param {string} timezoneValue - The timezone identifier
 * @returns {Object|null} The timezone configuration or null if not found
 */
export const getTimezoneConfig = (timezoneValue) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue) || null;
};

/**
 * Validate if a timezone is supported
 * @param {string} timezone - The timezone identifier to validate
 * @returns {boolean} True if the timezone is supported
 */
export const isValidTimezone = (timezone) => {
  return TIMEZONES.some(tz => tz.value === timezone);
};

/**
 * Get the current browser's timezone
 * @returns {string} The browser's timezone identifier
 */
export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to get browser timezone:', error);
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Check if a timezone is the same as the browser's timezone
 * @param {string} timezone - The timezone to check
 * @returns {boolean} True if it matches the browser timezone
 */
export const isBrowserTimezone = (timezone) => {
  return timezone === getBrowserTimezone();
};

/**
 * Get the current time in the calendar timezone
 * This is used for determining what events are "next" relative to the calendar's timezone
 * @returns {Date} Current time in calendar timezone as a Date object
 */
export const getCurrentTimeInCalendarTimezone = () => {
  const now = new Date();
  
  // Convert current UTC time to calendar timezone
  const calendarTimeString = now.toLocaleString('en-CA', {
    timeZone: CALENDAR_TIMEZONE,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the string back to Date object
  const [datePart, timePart] = calendarTimeString.split(', ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Create Date object representing current time in calendar timezone
  // This date will be used for comparison with event dates (which are in UTC)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
};