import api from './api.js';
import mockEvents from '../data/mock-events.json';

/**
 * Service for handling economic calendar event API calls
 */
export const eventService = {
  /**
   * Fetch all economic calendar events
   * @param {Object} params - Query parameters for filtering
   * @param {string} params.startDate - Start date filter (ISO string)
   * @param {string} params.endDate - End date filter (ISO string)
   * @param {string} params.country - Country filter
   * @param {string} params.category - Category filter
   * @param {string} params.importance - Importance level filter
   * @returns {Promise<Array>} Array of economic events
   */
  async fetchEvents(params = {}) {
    try {
      let response;
      
      // Use mock data in development or when API fails
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        response = { data: mockEvents };
        console.log('Using mock data for development');
      } else {
        response = await api.get('/calendar', { params });
      }
      
      // Validate response data structure
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of events');
      }
      
      // Validate each event has required fields
      const validatedEvents = response.data.map(event => {
        if (!event.date || !event.event) {
          console.warn('Invalid event data:', event);
          return null;
        }
        
        // Ensure consistent data structure
        return {
          _id: event._id,
          date: event.date,
          country: event.country || 'Unknown',
          event: event.event,
          importance: event.importance || 'low',
          source: event.source || { name: 'Unknown', url: '' },
          category: event.category || 'other',
          tags: event.tags || [],
          created_at: event.created_at,
          updated_at: event.updated_at
        };
      }).filter(Boolean); // Remove null entries
      
      return validatedEvents;
    } catch (error) {
      console.error('Failed to fetch events:', error.message);
      throw error;
    }
  },

  /**
   * Fetch events for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of events within date range
   */
  async fetchEventsByDateRange(startDate, endDate) {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    
    return this.fetchEvents(params);
  },

  /**
   * Fetch events by importance level
   * @param {string} importance - Importance level ('low', 'medium', 'high')
   * @returns {Promise<Array>} Array of events with specified importance
   */
  async fetchEventsByImportance(importance) {
    return this.fetchEvents({ importance });
  },

  /**
   * Fetch events by country
   * @param {string} country - Country code (e.g., 'USA')
   * @returns {Promise<Array>} Array of events for specified country
   */
  async fetchEventsByCountry(country) {
    return this.fetchEvents({ country });
  },

  /**
   * Fetch events by category
   * @param {string} category - Event category (e.g., 'employment', 'housing')
   * @returns {Promise<Array>} Array of events in specified category
   */
  async fetchEventsByCategory(category) {
    return this.fetchEvents({ category });
  }
};

export default eventService;