import React, { useState, useEffect, useMemo } from 'react';
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
import useEvents from '../../hooks/useEvents';
import useTimezone from '../../hooks/useTimezone';
import useTheme from '../../hooks/useTheme.jsx';
import typewriterSound, { commentaryAudio } from '../../utils/soundUtils';
import { fetchMorningReport } from '../../services/marketCommentaryService';
import { formatDateInTimezone } from '../../utils/timezoneUtils';
import { getDateRangeForPeriod, formatRangeForAPI } from '../../utils/dateRangeUtils';
import { getImportanceConfig, IMPORTANCE_LEVELS } from '../../utils/importanceUtils';

const EconomicCalendar = () => {
  // Component state for filtering
  const [selectedPeriod, setSelectedPeriod] = useState('thisWeek');
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(10);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCommentaryPlaying, setIsCommentaryPlaying] = useState(false);
  const [commentaryError, setCommentaryError] = useState(null);
  const [morningReportSummary, setMorningReportSummary] = useState(null);
  const [showSummaryTemporarily, setShowSummaryTemporarily] = useState(false);

  // Timezone management
  const { selectedTimezone, updateTimezone } = useTimezone();
  
  // Theme management
  const { isDark, toggleTheme } = useTheme();

  // Get date range using the tested utilities
  const getDateRange = () => {
    const range = getDateRangeForPeriod(selectedPeriod, selectedTimezone);
    if (range) {
      return formatRangeForAPI(range);
    }
    // Fallback to today if period is invalid
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return {
      fromDate: todayStr,
      toDate: todayStr
    };
  };

  // Build API filters with useMemo to recalculate when dependencies change
  const apiFilters = useMemo(() => {
    const dateRange = getDateRange();
    const filters = {
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate
    };
    
    // Add importance filter if not 'all'
    if (selectedImportance !== 'all') {
      filters.importance = selectedImportance;
    }
    
    return filters;
  }, [selectedPeriod, selectedImportance, selectedTimezone]);

  // API integration with dynamic filtering
  const { events, loading, error, refresh } = useEvents({
    filters: apiFilters
  });

  // Define period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'recent', label: 'Recent' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'nextWeek', label: 'Next Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'nextMonth', label: 'Next Month' }
  ];

  // Use standardized importance options from utils
  const importanceOptions = IMPORTANCE_LEVELS;

  // Sort events by date (no more frontend filtering needed)
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, selectedImportance]);

  // Set up commentary audio event listeners
  useEffect(() => {
    // Set up callbacks for commentary playback events
    commentaryAudio.onPlaybackStart(() => {
      setIsCommentaryPlaying(true);
    });

    commentaryAudio.onPlaybackEnd(() => {
      setIsCommentaryPlaying(false);
      // Ensure typewriter sounds remain enabled after commentary ends
      // (the commentary manager automatically restores the previous state,
      // but we want to ensure it's enabled since audio toggle is still on)
      if (isAudioEnabled) {
        typewriterSound.setEnabled(true);
      }
    });

    // Cleanup on unmount
    return () => {
      commentaryAudio.cleanup();
      typewriterSound.cleanup();
    };
  }, [isAudioEnabled]);

  const handleRefresh = () => {
    refresh();
  };

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEventsPerPageChange = (newEventsPerPage) => {
    setEventsPerPage(newEventsPerPage);
    setCurrentPage(1); // Reset to first page when changing events per page
  };

  const handleAudioToggle = async () => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    setCommentaryError(null);
    
    if (newAudioState) {
      // Initialize audio context on first toggle to on
      typewriterSound.initializeAudioContext();
      
      // Try to fetch and play market commentary
      try {
        // Fetch the full morning report to get both commentary URL and summary
        const morningReport = await fetchMorningReport();
        if (morningReport) {
          // Set the summary for the NextEventTypewriter to show temporarily
          if (morningReport.summary) {
            setMorningReportSummary(morningReport.summary);
            setShowSummaryTemporarily(true);
          }
          
          // Try to play commentary if available
          const commentaryUrl = morningReport.brief;
          if (commentaryUrl && typeof commentaryUrl === 'string' && commentaryUrl.toLowerCase().includes('.mp3')) {
            console.log('Found commentary URL:', commentaryUrl);
            const success = await commentaryAudio.playCommentary(commentaryUrl, typewriterSound);
            if (success) {
              setIsCommentaryPlaying(true);
              console.log('Commentary playback started successfully');
            } else {
              console.warn('Failed to start commentary playback');
              // Still enable typewriter sounds as fallback
              typewriterSound.setEnabled(true);
            }
          } else {
            console.log('No commentary available, enabling typewriter sounds');
            // No commentary available, just enable typewriter sounds
            typewriterSound.setEnabled(true);
          }
        } else {
          console.log('No morning report available, enabling typewriter sounds');
          typewriterSound.setEnabled(true);
        }
      } catch (error) {
        console.error('Error handling commentary:', error);
        setCommentaryError('Failed to load market commentary');
        // Enable typewriter sounds as fallback
        typewriterSound.setEnabled(true);
      }
    } else {
      // Audio disabled - stop everything and clear summary
      commentaryAudio.stopCommentary();
      typewriterSound.setEnabled(false);
      setIsCommentaryPlaying(false);
      setMorningReportSummary(null);
      setShowSummaryTemporarily(false);
    }
  };

  const handleRowClick = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Typography variant="h2" className={`font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Economic Calendar
        </Typography>
        <div className="flex items-center space-x-4">
          {/* Audio toggle */}
            <IconButton
              variant="outlined"
              color="gray"
              size="sm"
              className={`border-gray-600 hover:bg-gray-700 ${
                isAudioEnabled ? (isCommentaryPlaying ? 'text-green-400' : 'text-grey-400') : 'text-orange-400'
              }`}
              onClick={handleAudioToggle}
            >
              {isAudioEnabled ? (
                isCommentaryPlaying ? (
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.747L4.242 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.242l4.141-3.747a1 1 0 011.617.747zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.747L4.242 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.242l4.141-3.747a1 1 0 011.617.747zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )
              ) : (
                <svg className="w-4 h-4 animate-ping" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.747L4.242 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.242l4.141-3.747a1 1 0 011.617.747zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </IconButton>
         
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
          
         
          
          {/* Theme toggle */}
          <IconButton
            variant="outlined"
            color="gray"
            size="sm"
            className={`border-gray-600 hover:bg-gray-700 ${
              isDark ? 'text-yellow-400' : 'text-blue-400'
            }`}
            onClick={toggleTheme}
          >
            {isDark ? (
              // Sun icon for dark mode (clicking will switch to light)
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              // Moon icon for light mode (clicking will switch to dark)
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
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
      <NextEventTypewriter 
        events={events} 
        selectedEvent={selectedEvent} 
        selectedTimezone={selectedTimezone} 
        morningReportSummary={showSummaryTemporarily ? morningReportSummary : null}
        onSummaryDisplayComplete={() => setShowSummaryTemporarily(false)}
      />

      {/* Filter Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Selector */}
        <div>
          <Typography variant="h6" className={`mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Period
          </Typography>
          <Select 
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            className={isDark 
              ? "bg-gray-800 border-gray-700 text-white" 
              : "bg-white border-gray-300 text-gray-900"
            }
            containerProps={{
              className: "min-w-0"
            }}
            menuProps={{
              className: isDark 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            }}
          >
            {periodOptions.map(period => (
              <Option 
                key={period.value} 
                value={period.value} 
                className={isDark 
                  ? "text-white hover:bg-gray-700" 
                  : "text-gray-900 hover:bg-gray-100"
                }
              >
                {period.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* Importance Selector */}
        <div>
          <Typography variant="h6" className={`mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Importance
          </Typography>
          <Select 
            value={selectedImportance}
            onChange={setSelectedImportance}
            className={isDark 
              ? "bg-gray-800 border-gray-700 text-white" 
              : "bg-white border-gray-300 text-gray-900"
            }
            containerProps={{
              className: "min-w-0"
            }}
            menuProps={{
              className: isDark 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            }}
          >
            {importanceOptions.map(importance => (
              <Option 
                key={importance.value} 
                value={importance.value} 
                className={isDark 
                  ? "text-white hover:bg-gray-700" 
                  : "text-gray-900 hover:bg-gray-100"
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span>{importance.label}</span>
                  {importance.value !== 'all' && (
                    <Chip 
                      value={importance.value.toUpperCase()} 
                      size="sm" 
                      color={importance.color}
                      variant="filled"
                      className="ml-2"
                    />
                  )}
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* Timezone Selector */}
        <TimezoneSelector
          selectedTimezone={selectedTimezone}
          onTimezoneChange={updateTimezone}
        />
      </div>

      {/* Events Table */}
      <Card className={isDark 
        ? "bg-gray-800 border border-gray-700" 
        : "bg-white border border-gray-300"
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={isDark 
                ? "border-b border-gray-700" 
                : "border-b border-gray-300"
              }>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>DATE & TIME</th>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>EVENT</th>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>COUNTRY</th>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>IMPORTANCE</th>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>CATEGORY</th>
                <th className={`p-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton rows
                [...Array(eventsPerPage)].map((_, index) => (
                  <tr key={`skeleton-${index}`} className={isDark 
                    ? "border-b border-gray-700" 
                    : "border-b border-gray-300"
                  }>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className={`h-4 rounded mb-2 ${
                          isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-3 rounded w-3/4 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className={`h-4 rounded mb-2 ${
                          isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-3 rounded w-1/2 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`animate-pulse h-4 rounded w-12 ${
                        isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`animate-pulse h-6 rounded w-16 ${
                        isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`animate-pulse h-4 rounded w-20 ${
                        isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`animate-pulse h-4 rounded w-16 ${
                        isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
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
                      <Typography variant="h6" className={isDark 
                        ? "text-gray-500" 
                        : "text-gray-400"
                      }>
                        No events found
                      </Typography>
                      <Typography variant="small" className={isDark 
                        ? "text-gray-600" 
                        : "text-gray-500"
                      }>
                        Try adjusting your filters or refresh the page
                      </Typography>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEvents.map((event, index) => (
                <tr 
                  key={event._id} 
                  className={`cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-b border-gray-700 hover:bg-gray-700/50' 
                      : 'border-b border-gray-300 hover:bg-gray-100/50'
                  }`}
                  onClick={() => handleRowClick(event)}
                >
                  <td className="p-4">
                    {(() => {
                      const formatted = formatDateInTimezone(event.date, selectedTimezone);
                      return (
                        <div>
                          <div className={`font-mono text-sm ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatted.date}
                          </div>
                          <div className={`font-mono text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatted.time}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <div className={isDark ? 'text-white' : 'text-gray-900'}>{event.event}</div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            value={tag}
                            size="sm"
                            variant="outlined"
                            className={isDark 
                              ? "bg-gray-700 text-gray-300 border-gray-600 text-xs" 
                              : "bg-gray-200 text-gray-700 border-gray-300 text-xs"
                            }
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{event.country}</span>
                  </td>
                  <td className="p-4">
                    <Chip
                      value={event.importance.toUpperCase()}
                      size="sm"
                      variant="filled"
                      className={`text-xs !font-bold !text-center !justify-center ${
                        event.importance.toLowerCase() === 'high'
                          ? '!bg-red-600 !text-white'
                          : event.importance.toLowerCase() === 'medium'
                          ? '!bg-amber-600 !text-white'
                          : event.importance.toLowerCase() === 'low'
                          ? '!bg-green-600 !text-white'
                          : '!bg-gray-600 !text-white'
                      }`}
                    />
                  </td>
                  <td className="p-4">
                    <span className={`text-sm capitalize ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {event.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <a
                      href={event.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm ${
                        isDark 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-500'
                      }`}
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
        <div className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, sortedEvents.length)} of {sortedEvents.length} results
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
                ? (isDark ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400')
                : (isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-400 text-gray-600 hover:bg-gray-100'
                  )
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
                    : (isDark 
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                        : "border-gray-400 text-gray-600 hover:bg-gray-100"
                      )
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
                ? (isDark ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400')
                : (isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-400 text-gray-600 hover:bg-gray-100'
                  )
            }`}
          >
            »
          </Button>
        </div>
      </div>

      {/* Rows per page selector */}
      <div className="flex items-center justify-center mt-4">
        <div className={`flex items-center space-x-2 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <span>Show</span>
          {[10, 100, 1000].map((option) => (
            <Button
              key={option}
              onClick={() => handleEventsPerPageChange(option)}
              variant={eventsPerPage === option ? "filled" : "text"}
              color={eventsPerPage === option ? "purple" : "gray"}
              size="sm"
              className={`min-w-0 px-2 py-1 ${
                eventsPerPage === option
                  ? ""
                  : (isDark 
                      ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50" 
                      : "text-gray-600 hover:text-gray-700 hover:bg-gray-100/50"
                    )
              }`}
            >
              {option}
            </Button>
          ))}
          <span>rows</span>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;