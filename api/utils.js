/**
 * Server-side utilities for date range computation
 * Compatible with both Node.js and browser environments
 */

/**
 * Compute week range (Monday to Sunday) for a given date
 * @param {Date|string} date - Reference date (Date object or ISO string)
 * @returns {Object} Object with fromDate and toDate as ISO strings
 */
export function computeWeekRange(date) {
  const refDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(refDate.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // Get Monday of the week
  const startOfWeek = new Date(refDate);
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as last day
  
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setUTCHours(0, 0, 0, 0);
  
  // Get Sunday of the week  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  
  return {
    fromDate: startOfWeek.toISOString().split('T')[0], // YYYY-MM-DD format
    toDate: endOfWeek.toISOString().split('T')[0]      // YYYY-MM-DD format
  };
}

/**
 * Get the week start date (Monday) for a given date
 * @param {Date|string} date - Reference date
 * @returns {string} ISO date string for Monday of that week (YYYY-MM-DD)
 */
export function getWeekStartDate(date) {
  const { fromDate } = computeWeekRange(date);
  return fromDate;
}

/**
 * Generate previous/next week navigation links
 * @param {string} currentWeekStart - Current week start date (YYYY-MM-DD)
 * @param {number} weekOffset - Number of weeks to offset (+7 for next, -7 for previous)
 * @returns {string} URL for the offset week
 */
export function linkForWeekOffset(currentWeekStart, weekOffset) {
  const currentDate = new Date(currentWeekStart);
  const offsetDate = new Date(currentDate);
  offsetDate.setDate(offsetDate.getDate() + weekOffset);
  
  const weekStart = getWeekStartDate(offsetDate);
  // Use relative path so the environment (local/dev/prod) base URL is applied correctly
  return `/calendar/week/${weekStart}`;
}

/**
 * Escape HTML characters for safe rendering
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format date for display in ET timezone
 * @param {string} isoDateString - ISO date string
 * @returns {string} Formatted time string in ET
 */
export function formatTimeET(isoDateString) {
  const date = new Date(isoDateString);
  return date.toLocaleTimeString('en-US', { 
    timeZone: 'America/New_York', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}