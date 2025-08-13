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
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as last day
  
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get the start and end of a month
 * @param {Date} date - Reference date
 * @returns {Object} Object with start and end dates
 */
export const getMonthRange = (date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  return { start: startOfMonth, end: endOfMonth };
};

/**
 * Get date range for "Today" period (current day from 00:00:00 to 23:59:59)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getTodayRange = (timezone = null) => {
  // Get current date in the specified timezone
  const now = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get date range for "Tomorrow" period (next day from 00:00:00 to 23:59:59)
 * @param {string} timezone - IANA timezone identifier (optional, defaults to browser timezone)
 * @returns {Object} Object with start and end dates
 */
export const getTomorrowRange = (timezone = null) => {
  // Get current date in the specified timezone
  const now = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get date range for "Recent" period (one week ago to now)
 * @returns {Object} Object with start and end dates
 */
export const getRecentRange = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
};

/**
 * Get date range for "This Week" (Monday to Sunday of current week)
 * @returns {Object} Object with start and end dates
 */
export const getThisWeekRange = () => {
  return getWeekRange(new Date());
};

/**
 * Get date range for "Next Week" (Monday to Sunday of next week)
 * @returns {Object} Object with start and end dates
 */
export const getNextWeekRange = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return getWeekRange(nextWeek);
};

/**
 * Get date range for "This Month" (current month)
 * @returns {Object} Object with start and end dates
 */
export const getThisMonthRange = () => {
  return getMonthRange(new Date());
};

/**
 * Get date range for "Next Month" (next month)
 * @returns {Object} Object with start and end dates
 */
export const getNextMonthRange = () => {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return getMonthRange(nextMonth);
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
      getRange: getRecentRange
    },
    {
      value: 'thisWeek',
      label: 'This Week',
      description: 'All events from Monday to Sunday',
      getRange: getThisWeekRange
    },
    {
      value: 'nextWeek',
      label: 'Next Week', 
      description: 'Next week from Monday to the following Sunday',
      getRange: getNextWeekRange
    },
    {
      value: 'thisMonth',
      label: 'This Month',
      description: 'Events for this current month',
      getRange: getThisMonthRange
    },
    {
      value: 'nextMonth',
      label: 'Next Month',
      description: 'Events for next month',
      getRange: getNextMonthRange
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
  return {
    fromDate: range.start.toISOString().split('T')[0],
    toDate: range.end.toISOString().split('T')[0]
  };
};