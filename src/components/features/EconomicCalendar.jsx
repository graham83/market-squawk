import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  IconButton, 
  Select, 
  Option, 
  Chip 
} from '@material-tailwind/react';
import NextEventTypewriter from './NextEventTypewriter';
import TimezoneSelector from '../ui/TimezoneSelector';
import ImportanceSelector from '../ui/ImportanceSelector';
import useEvents from '../../hooks/useEvents';
import useTimezone from '../../hooks/useTimezone';
import useImportance from '../../hooks/useImportance';
import typewriterSound from '../../utils/soundUtils';
import { formatDateInTimezone } from '../../utils/timezoneUtils';
import { filterEventsByImportance } from '../../utils/importanceUtils';
import { getPeriodOptions, getDateRangeForPeriod, formatRangeForAPI } from '../../utils/dateRangeUtils';

const EconomicCalendar = () => {
  // Date range management
  const [selectedPeriod, setSelectedPeriod] = useState('thisWeek'); // Default to "This Week"
  const [currentDateRange, setCurrentDateRange] = useState(null);
  
  // API integration
  const { events, loading, error, refresh, fetchEventsWithDateRange } = useEvents({
    autoFetch: false // We'll fetch manually based on date range
  });
  
  // Timezone management
  const { selectedTimezone, updateTimezone } = useTimezone();
  
  // Importance filtering
  const { selectedImportance, updateImportance } = useImportance();
  
  // Component state
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(5);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get period options
  const periodOptions = getPeriodOptions();

  // Handle period change and fetch events with new date range
  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod);
    const dateRange = getDateRangeForPeriod(newPeriod);
    
    if (dateRange) {
      const apiParams = formatRangeForAPI(dateRange);
      setCurrentDateRange(apiParams);
      await fetchEventsWithDateRange(apiParams);
    }
  };

  // Initialize with default period on mount
  useEffect(() => {
    if (!currentDateRange) {
      handlePeriodChange(selectedPeriod);
    }
  }, []);

  // Filter events based on importance (client-side filtering for importance only)
  useEffect(() => {
    let filtered = filterEventsByImportance(events, selectedImportance);
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedImportance, events]);

  // Reset current page when events change
  useEffect(() => {
    setCurrentPage(1);
  }, [events]);

  const handleRefresh = () => {
    if (currentDateRange) {
      fetchEventsWithDateRange(currentDateRange);
    } else {
      // Fallback to current period
      handlePeriodChange(selectedPeriod);
    }
  };

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAudioToggle = () => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    
    if (newAudioState) {
      // Initialize audio context on first toggle to on
      typewriterSound.initializeAudioContext();
    }
    
    typewriterSound.setEnabled(newAudioState);
  };

  const handleRowClick = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Typography variant="h2" className="text-white font-bold">
          Economic Calendar
        </Typography>
        <div className="flex items-center space-x-4">
          {/* Refresh button */}
          <IconButton
            variant="outlined"
            color="gray"
            size="sm"
            className="border-gray-600 text-blue-400 hover:bg-gray-700"
            onClick={handleRefresh}
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>
          
          {/* Audio toggle */}
          <IconButton
            variant="outlined"
            color="gray"
            size="sm"
            className={`border-gray-600 hover:bg-gray-700 ${
              isAudioEnabled ? 'text-green-400' : 'text-gray-400'
            }`}
            onClick={handleAudioToggle}
          >
            {isAudioEnabled ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.747L4.242 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.242l4.141-3.747a1 1 0 011.617.747zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.747L4.242 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.242l4.141-3.747a1 1 0 011.617.747zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </IconButton>
          
          {/* Theme toggle placeholder */}
          <IconButton
            variant="outlined"
            color="gray"
            size="sm"
            className="border-gray-600 text-yellow-400 hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-900/50 border border-red-700 mb-6">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <Typography variant="small" className="text-red-400 font-semibold">
                  Failed to load events
                </Typography>
                <Typography variant="small" className="text-red-300">
                  {error}
                </Typography>
              </div>
            </div>
            <Button
              size="sm"
              variant="outlined"
              className="border-red-600 text-red-400 hover:bg-red-800/50"
              onClick={handleRefresh}
              disabled={loading}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Next Event Terminal Display */}
      <NextEventTypewriter events={events} selectedEvent={selectedEvent} />

      {/* Period Selector, Importance Selector, and Timezone Selector */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Period Selector */}
        <div className="flex-1">
          <Typography variant="h6" className="text-gray-300 mb-2">
            Select Period
          </Typography>
          <div className="w-64">
            <Select 
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="bg-gray-800 border-gray-700 text-white"
              containerProps={{
                className: "min-w-0"
              }}
              menuProps={{
                className: "bg-gray-800 border-gray-700 text-white"
              }}
            >
              {periodOptions.map(period => (
                <Option key={period.value} value={period.value} className="text-white hover:bg-gray-700">
                  {period.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Importance Selector */}
        <ImportanceSelector
          selectedImportance={selectedImportance}
          onImportanceChange={updateImportance}
          className="flex-1"
        />

        {/* Timezone Selector */}
        <TimezoneSelector
          selectedTimezone={selectedTimezone}
          onTimezoneChange={updateTimezone}
          className="flex-1"
        />
      </div>

      {/* Events Table */}
      <Card className="bg-gray-800 border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-gray-300">DATE & TIME</th>
                <th className="p-4 text-gray-300">EVENT</th>
                <th className="p-4 text-gray-300">COUNTRY</th>
                <th className="p-4 text-gray-300">IMPORTANCE</th>
                <th className="p-4 text-gray-300">CATEGORY</th>
                <th className="p-4 text-gray-300">SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton rows
                [...Array(eventsPerPage)].map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-gray-700">
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse h-4 bg-gray-600 rounded w-12"></div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse h-6 bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse h-4 bg-gray-600 rounded w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse h-4 bg-gray-600 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : currentEvents.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 004 0v-4" />
                      </svg>
                      <Typography variant="h6" className="text-gray-500">
                        No events found
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        Try adjusting your filters or refresh the page
                      </Typography>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEvents.map((event, index) => (
                <tr 
                  key={event._id} 
                  className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(event)}
                >
                  <td className="p-4">
                    {(() => {
                      const formatted = formatDateInTimezone(event.date, selectedTimezone);
                      return (
                        <div>
                          <div className="text-white font-mono text-sm">
                            {formatted.date}
                          </div>
                          <div className="text-gray-400 font-mono text-xs">
                            {formatted.time}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="text-white">{event.event}</div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            value={tag}
                            size="sm"
                            variant="outlined"
                            className="bg-gray-700 text-gray-300 border-gray-600 text-xs"
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-white">{event.country}</span>
                  </td>
                  <td className="p-4">
                    <Chip
                      value={event.importance.toUpperCase()}
                      size="sm"
                      color={
                        event.importance === 'high'
                          ? 'red'
                          : event.importance === 'medium'
                          ? 'amber'
                          : 'green'
                      }
                      className="font-bold"
                    />
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-sm capitalize ${
                        event.category === 'employment'
                          ? 'text-blue-400'
                          : event.category === 'inflation'
                          ? 'text-red-400'
                          : event.category === 'monetary_policy'
                          ? 'text-purple-400'
                          : event.category === 'gdp'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {event.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <a
                      href={event.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {event.source.name}
                    </a>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-gray-400 text-sm">
          Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} results
        </div>
        <div className="flex space-x-2">
          {/* Previous button */}
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outlined"
            size="sm"
            className={`${
              currentPage === 1
                ? 'border-gray-700 text-gray-600'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            «
          </Button>
          
          {/* Page numbers */}
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            return (
              <Button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                variant={currentPage === pageNumber ? "filled" : "outlined"}
                color={currentPage === pageNumber ? "purple" : "gray"}
                size="sm"
                className={
                  currentPage === pageNumber
                    ? ""
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                {pageNumber}
              </Button>
            );
          })}
          
          {/* Next button */}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outlined"
            size="sm"
            className={`${
              currentPage === totalPages
                ? 'border-gray-700 text-gray-600'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;