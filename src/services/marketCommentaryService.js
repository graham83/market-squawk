import api from './api';

/**
 * Market Commentary Service
 * Handles fetching morning report data and extracting MP3 commentary URLs
 */

/**
 * Fetch morning report data from the API
 * @returns {Promise<Object>} Morning report data including summary, calendar, and brief (MP3 URL)
 */
export const fetchMorningReport = async () => {
  try {
    const response = await api.get('/morning_report');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch morning report:', error);
    throw new Error('Unable to fetch market commentary');
  }
};

/**
 * Extract MP3 URL from morning report data
 * @param {Object} morningReportData - The complete morning report response
 * @returns {string|null} MP3 URL if available, null otherwise
 */
export const extractCommentaryUrl = (morningReportData) => {
  if (!morningReportData) {
    return null;
  }
  
  const { brief } = morningReportData;
  
  // Validate that brief is a string and looks like a URL (case insensitive)
  if (typeof brief === 'string' && brief.toLowerCase().includes('.mp3')) {
    return brief;
  }
  
  return null;
};

/**
 * Get market commentary MP3 URL
 * Convenience method that fetches morning report and extracts MP3 URL
 * @returns {Promise<string|null>} MP3 URL if available, null otherwise
 */
export const getCommentaryUrl = async () => {
  try {
    const morningReport = await fetchMorningReport();
    return extractCommentaryUrl(morningReport);
  } catch (error) {
    console.error('Failed to get commentary URL:', error);
    return null;
  }
};

export default {
  fetchMorningReport,
  extractCommentaryUrl,
  getCommentaryUrl
};