import { useState, useEffect, useCallback } from 'react';
import eventService from '../services/eventService.js';

/**
 * Custom hook for managing economic calendar events data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to fetch data on mount (default: true)
 * @param {number} options.refetchInterval - Auto-refetch interval in milliseconds (default: null)
 * @param {Object} options.filters - Default filters to apply
 * @returns {Object} Hook state and actions
 */
export const useEvents = (options = {}) => {
  const {
    autoFetch = true,
    refetchInterval = null,
    filters = {}
  } = options;

  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  /**
   * Fetch events from the API
   * @param {Object} customFilters - Override default filters
   */
  const fetchEvents = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const allFilters = { ...filters, ...customFilters };
      const fetchedEvents = await eventService.fetchEvents(allFilters);
      
      setEvents(fetchedEvents);
      setLastFetch(new Date());
      
      if (import.meta.env.DEV) {
        console.log(`Fetched ${fetchedEvents.length} events`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
      
      // If we have cached events, keep them
      if (events.length === 0) {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, events.length]);

  /**
   * Retry the last failed request
   */
  const retry = useCallback(() => {
    if (error) {
      fetchEvents();
    }
  }, [error, fetchEvents]);

  /**
   * Refresh events data
   */
  const refresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  /**
   * Fetch events by date range
   */
  const fetchEventsByDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedEvents = await eventService.fetchEventsByDateRange(startDate, endDate);
      setEvents(fetchedEvents);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events by date range:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch events by importance level
   */
  const fetchEventsByImportance = useCallback(async (importance) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedEvents = await eventService.fetchEventsByImportance(importance);
      setEvents(fetchedEvents);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events by importance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(() => {
        fetchEvents();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchEvents]);

  // Derived state
  const isStale = lastFetch && (Date.now() - lastFetch.getTime() > 300000); // 5 minutes
  const hasEvents = events.length > 0;
  const isEmpty = !loading && !error && events.length === 0;

  return {
    // Data
    events,
    loading,
    error,
    lastFetch,
    
    // Derived state
    isStale,
    hasEvents,
    isEmpty,
    
    // Actions
    fetchEvents,
    fetchEventsByDateRange,
    fetchEventsByImportance,
    refresh,
    retry
  };
};

export default useEvents;