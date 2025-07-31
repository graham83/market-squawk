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
import mockEvents from '../../data/mock-events.json';
import typewriterSound from '../../utils/soundUtils';

const EconomicCalendar = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(5);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Generate week options based on available event dates
  const getWeekOptions = () => {
    const weeks = [];
    const sortedEvents = [...mockEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sortedEvents.length === 0) return weeks;
    
    // Add "All Events" option
    weeks.push({ value: 'all', label: 'All Events' });
    
    // Group events by week
    const startDate = new Date(sortedEvents[0].date);
    const endDate = new Date(sortedEvents[sortedEvents.length - 1].date);
    
    let currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of week (Sunday)
    
    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
      
      const weekEvents = sortedEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= currentWeekStart && eventDate <= weekEnd;
      });
      
      if (weekEvents.length > 0) {
        const weekLabel = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        weeks.push({
          value: currentWeekStart.toISOString(),
          label: weekLabel,
          start: new Date(currentWeekStart),
          end: new Date(weekEnd)
        });
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const weekOptions = getWeekOptions();

  // Filter events based on selected week
  useEffect(() => {
    let filtered = [...mockEvents];
    
    if (selectedWeek !== 'all') {
      const selectedWeekOption = weekOptions.find(week => week.value === selectedWeek);
      if (selectedWeekOption && selectedWeekOption.start && selectedWeekOption.end) {
        filtered = mockEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= selectedWeekOption.start && eventDate <= selectedWeekOption.end;
        });
      }
    }
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedWeek]);

  useEffect(() => {
    // Load mock events
    setEvents(mockEvents);
  }, []);

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

      {/* Next Event Terminal Display */}
      <NextEventTypewriter events={events} selectedEvent={selectedEvent} />

      {/* Week Selector */}
      <div className="mb-6">
        <Typography variant="h6" className="text-gray-300 mb-2">
          Select Week
        </Typography>
        <div className="w-64">
          <Select 
            value={selectedWeek}
            onChange={setSelectedWeek}
            className="bg-gray-800 border-gray-700 text-white"
            containerProps={{
              className: "min-w-0"
            }}
            menuProps={{
              className: "bg-gray-800 border-gray-700 text-white"
            }}
          >
            {weekOptions.map(week => (
              <Option key={week.value} value={week.value} className="text-white hover:bg-gray-700">
                {week.label}
              </Option>
            ))}
          </Select>
        </div>
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
              {currentEvents.map((event, index) => (
                <tr 
                  key={event._id} 
                  className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(event)}
                >
                  <td className="p-4">
                    <div className="text-white font-mono text-sm">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-400 font-mono text-xs">
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </div>
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
              ))}
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