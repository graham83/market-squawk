/**
 * Utility functions for calculating date ranges for the economic calendar
 */

/**
 * Get the start and end of a week (Monday to Sunday)
 * @param {Date} date - Reference date
 * @returns {Object} Object with start and end dates
 */
export const getWeekRange = (date) => {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as last day
  
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get the start and end of a month
 * @param {Date} date - Reference date
 * @returns {Object} Object with start and end dates
 */
export const getMonthRange = (date) => {
  const startOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  startOfMonth.setUTCHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  endOfMonth.setUTCHours(23, 59, 59, 999);
  
  return { start: startOfMonth, end: endOfMonth };
};

/**
 * Get date range for "Today" period (current day from 00:00:00 to 23:59:59)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getTodayRange = (timezone = null) => {
  if (timezone) {
    // Get the current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    
    // Create start and end as the same date to ensure single-day range
    // We'll create UTC dates that represent the target calendar date
    const targetDate = new Date(targetDateString + 'T00:00:00Z');
    
    const start = new Date(targetDate);
    const end = new Date(targetDate);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  } else {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  }
};

/**
 * Get date range for "Tomorrow" period (next day from 00:00:00 to 23:59:59)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getTomorrowRange = (timezone = null) => {
  if (timezone) {
    // Get the current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    
    // Add one day to the target date
    const targetDate = new Date(targetDateString + 'T00:00:00Z');
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    
    const start = new Date(targetDate);
    const end = new Date(targetDate);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  } else {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCHours(23, 59, 59, 999);
    
    return { start, end };
  }
};

/**
 * Get date range for "Recent" period (one week ago to now)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getRecentRange = (timezone = null) => {
  if (timezone) {
    // Get current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    
    // Create end date (today at 23:59:59)
    const endDate = new Date(targetDateString + 'T00:00:00Z');
    endDate.setUTCHours(23, 59, 59, 999);
    
    // Create start date (7 days ago at 00:00:00)
    const startDate = new Date(targetDateString + 'T00:00:00Z');
    startDate.setUTCDate(startDate.getUTCDate() - 7);
    startDate.setUTCHours(0, 0, 0, 0);
    
    return { start: startDate, end: endDate };
  } else {
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 7);
    start.setUTCHours(0, 0, 0, 0);
    
    return { start, end };
  }
};

/**
 * Get date range for "This Week" (Monday to Sunday of current week)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getThisWeekRange = (timezone = null) => {
  if (timezone) {
    // Get current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    const currentDate = new Date(targetDateString + 'T12:00:00Z'); // Use midday to avoid timezone edge cases
    
    return getWeekRange(currentDate);
  } else {
    return getWeekRange(new Date());
  }
};

/**
 * Get date range for "Next Week" (Monday to Sunday of next week)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getNextWeekRange = (timezone = null) => {
  if (timezone) {
    // Get current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    const currentDate = new Date(targetDateString + 'T12:00:00Z'); // Use midday to avoid timezone edge cases
    
    // Add 7 days to get next week
    const nextWeek = new Date(currentDate);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    
    return getWeekRange(nextWeek);
  } else {
    const nextWeek = new Date();
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    return getWeekRange(nextWeek);
  }
};

/**
 * Get date range for "This Month" (current month)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getThisMonthRange = (timezone = null) => {
  if (timezone) {
    // Get current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    const currentDate = new Date(targetDateString + 'T12:00:00Z'); // Use midday to avoid timezone edge cases
    
    return getMonthRange(currentDate);
  } else {
    return getMonthRange(new Date());
  }
};

/**
 * Get date range for "Next Month" (next month)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getNextMonthRange = (timezone = null) => {
  if (timezone) {
    // Get current date in the specified timezone
    const utcNow = new Date();
    const targetDateString = utcNow.toLocaleDateString('en-CA', { 
      timeZone: timezone
    });
    const currentDate = new Date(targetDateString + 'T12:00:00Z'); // Use midday to avoid timezone edge cases
    
    // Add one month
    const nextMonth = new Date(currentDate);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    
    return getMonthRange(nextMonth);
  } else {
    const nextMonth = new Date();
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    return getMonthRange(nextMonth);
  }
};

/**
 * Get all available period options for the date range selector
 * @param {string} timezone - IANA timezone identifier (optional)
 * @returns {Array} Array of period option objects
 */
export const getPeriodOptions = (timezone = null) => {
  return [
    {
      value: 'today',
      label: 'Today',
      description: 'All events for today',
      getRange: () => getTodayRange(timezone)
    },
    {
      value: 'tomorrow',
      label: 'Tomorrow',
      description: 'All events for tomorrow',
      getRange: () => getTomorrowRange(timezone)
    },
    {
      value: 'recent',
      label: 'Recent',
      description: 'Previous events within one week of today',
      getRange: () => getRecentRange(timezone)
    },
    {
      value: 'thisWeek',
      label: 'This Week',
      description: 'All events from Monday to Sunday',
      getRange: () => getThisWeekRange(timezone)
    },
    {
      value: 'nextWeek',
      label: 'Next Week', 
      description: 'Next week from Monday to the following Sunday',
      getRange: () => getNextWeekRange(timezone)
    },
    {
      value: 'thisMonth',
      label: 'This Month',
      description: 'Events for this current month',
      getRange: () => getThisMonthRange(timezone)
    },
    {
      value: 'nextMonth',
      label: 'Next Month',
      description: 'Events for next month',
      getRange: () => getNextMonthRange(timezone)
    }
  ];
};

/**
 * Get date range for a specific period
 * @param {string} period - Period identifier
 * @param {string} timezone - IANA timezone identifier (optional)
 * @returns {Object|null} Object with start and end dates, or null if invalid period
 */
export const getDateRangeForPeriod = (period, timezone = null) => {
  const option = getPeriodOptions(timezone).find(opt => opt.value === period);
  return option ? option.getRange() : null;
};

/**
 * Format date range for API parameters
 * @param {Object} range - Range object with start and end dates
 * @returns {Object} Object with fromDate and toDate as date strings (YYYY-MM-DD)
 */
export const formatRangeForAPI = (range) => {
  const fromDate = range.start.toISOString().split('T')[0];
  const toDate = range.end.toISOString().split('T')[0];
  
  return {
    fromDate: fromDate,
    toDate: toDate
  };
};