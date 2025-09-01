import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import eventService from '../services/eventService.js';

/**
 * Custom hook for managing economic calendar events data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to fetch data on mount (default: true)
 * @param {number} options.refetchInterval - Auto-refetch interval in milliseconds (default: null)
 * @param {Object} options.filters - Default filters to apply
 * @param {Object} options.dateRange - Date range filter {fromDate, toDate}
 * @returns {Object} Hook state and actions
 */
export const useEvents = (options = {}) => {
  const {
    autoFetch = true,
    refetchInterval = null,
    filters = {},
    dateRange = null,
    initialData = null
  } = options;

  // State management
  const [events, setEvents] = useState(initialData?.events || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const hasFetchedRef = useRef(false);

  /**
   * Fetch events from the API
   * @param {Object} customFilters - Override default filters
   * @param {Object} customDateRange - Override default date range
   */
  const fetchEvents = useCallback(async (customFilters = {}, customDateRange = null) => {
    setLoading(true);
    setError(null);

    try {
      const allFilters = { ...filters, ...customFilters };
      const currentDateRange = customDateRange || dateRange;
      
      // Add date range parameters if provided
      if (currentDateRange) {
        allFilters.fromDate = currentDateRange.fromDate;
        allFilters.toDate = currentDateRange.toDate;
      }
      
      const fetchedEvents = await eventService.fetchEvents(allFilters);
      
      setEvents(fetchedEvents);
      setLastFetch(new Date());
      hasFetchedRef.current = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${fetchedEvents.length} events`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
      hasFetchedRef.current = true; // Mark as attempted even on error
      
      // Don't clear events on error - keep previous data if available
      setEvents(prevEvents => prevEvents);
    } finally {
      setLoading(false);
    }
  }, [filters, dateRange]);

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
   * Fetch events with a specific date range
   */
  const fetchEventsWithDateRange = useCallback(async (dateRange) => {
    const apiParams = dateRange ? {
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate
    } : {};
    
    await fetchEvents({}, apiParams);
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

  // Create a stable string representation of filters for comparison
  const filtersKey = useMemo(() => {
    if (!filters) return '';
    // Sort keys to ensure consistent ordering
    const sortedKeys = Object.keys(filters).sort();
    const sortedFilters = {};
    sortedKeys.forEach(key => {
      sortedFilters[key] = filters[key];
    });
    return JSON.stringify(sortedFilters);
  }, [filters]);

  // Store previous filters key to detect real changes
  const prevFiltersKeyRef = useRef(filtersKey);
  
  // Track if we've already used initial data
  const hasUsedInitialDataRef = useRef(false);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    // Skip if autoFetch is disabled
    if (!autoFetch) return;
    
    // If we have initial data and haven't used it yet, skip fetching
    if (initialData?.events && !hasUsedInitialDataRef.current) {
      hasUsedInitialDataRef.current = true;
      return;
    }

    // Only fetch if filters actually changed
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey;
    
    // If filters haven't changed, don't fetch
    if (!filtersChanged) return;
    
    // Update the previous filters key
    prevFiltersKeyRef.current = filtersKey;

    if (filters) {
      const doFetch = async () => {
        setLoading(true);
        setError(null);

        try {
          const allFilters = { ...filters };
          
          // Add date range parameters if provided
          if (dateRange) {
            allFilters.fromDate = dateRange.fromDate;
            allFilters.toDate = dateRange.toDate;
          }
          
          const fetchedEvents = await eventService.fetchEvents(allFilters);
          setEvents(fetchedEvents);
          setLastFetch(new Date());
          hasFetchedRef.current = true;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Fetched ${fetchedEvents.length} events with filters:`, allFilters);
          }
        } catch (err) {
          setError(err.message);
          console.error('Error fetching events:', err);
          hasFetchedRef.current = true;
        } finally {
          setLoading(false);
        }
      };
      
      doFetch();
    }
  }, [autoFetch, filtersKey, dateRange]); // Use filtersKey for deep comparison

  // Auto-refetch interval (disabled by default)
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && !error) {
      const interval = setInterval(() => {
        fetchEvents();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchEvents, error]);

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
    fetchEventsWithDateRange,
    fetchEventsByDateRange,
    fetchEventsByImportance,
    refresh,
    retry
  };
};

export default useEvents;