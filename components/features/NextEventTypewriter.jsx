import React, { useState, useEffect, useRef } from 'react';
import useTheme from '../../hooks/useTheme.jsx';
import typewriterSound from '../../utils/soundUtils';
import { formatDateInTimezone, getCurrentTimeInCalendarTimezone, parseAsUTC } from '../../utils/timezoneUtils';
import eventService from '../../services/eventService.js';

const NextEventTypewriter = ({ events, selectedEvent, selectedTimezone, morningReportSummary, onSummaryDisplayComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [tomorrowEvents, setTomorrowEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const audioInitialized = useRef(false);
  const summaryDisplayedRef = useRef(false);
  
  // Theme management
  const { isDark } = useTheme();

  // Hydration effect - set hydrated flag after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Find the next upcoming event (including tomorrow's events if needed)
  const getNextEvent = () => {
    // Return null during SSR to prevent hydration mismatch
    if (!isHydrated) {
      return null;
    }

    const nowInCalendarTz = getCurrentTimeInCalendarTimezone();
    
    // First, try to find upcoming events from the current events list
    if (events && events.length > 0) {
      const upcomingEvents = events
        .filter(event => parseAsUTC(event.date) > nowInCalendarTz)
        .sort((a, b) => parseAsUTC(a.date) - parseAsUTC(b.date));
      
      if (upcomingEvents.length > 0) {
        return upcomingEvents[0];
      }
    }
    
    // If no upcoming events today, try tomorrow's events
    if (tomorrowEvents && tomorrowEvents.length > 0) {
      const tomorrowUpcoming = tomorrowEvents
        .filter(event => parseAsUTC(event.date) > nowInCalendarTz)
        .sort((a, b) => parseAsUTC(a.date) - parseAsUTC(b.date));
      
      return tomorrowUpcoming[0] || null;
    }
    
    return null;
  };

  // Update next event when hydration status or events change
  useEffect(() => {
    if (isHydrated) {
      setNextEvent(getNextEvent());
    }
  }, [isHydrated, events, tomorrowEvents]);

  const formatEventTime = (dateString) => {
    const formatted = formatDateInTimezone(dateString, selectedTimezone, {
      timeOptions: {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        hour12: true
      }
    });
    return formatted.time;
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const initializeAudio = async () => {
      if (!audioInitialized.current) {
        try {
          await typewriterSound.resume();
          audioInitialized.current = true;
        } catch (error) {
          console.warn('Audio initialization failed:', error);
        }
      }
    };

    const handleFirstInteraction = () => {
      initializeAudio();
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);
  // Use selected event if available, otherwise use next upcoming event
  const eventToDisplay = selectedEvent || nextEvent;
  
  // Determine what text to display based on priority:
  // 1. Morning report summary (if available)
  // 2. Selected event details
  // 3. Next upcoming event
  // 4. No events message
  const fullText = morningReportSummary
    ? morningReportSummary
    : eventToDisplay 
      ? selectedEvent 
        ? `${formatEventTime(selectedEvent.date)}: ${selectedEvent.event}`
        : `Next Event: ${eventToDisplay.event} at ${formatEventTime(eventToDisplay.date)}`
      : 'No upcoming events scheduled';

  // Determine key type based on character
  const getKeyType = (char) => {
    if (char === ' ') return 'space';
    if (char === '\n' || char === '\r') return 'enter';
    return 'normal';
  };

  // Typewriter effect
  useEffect(() => {
    if (currentCharIndex < fullText.length) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        const currentChar = fullText[currentCharIndex];
        setDisplayText(fullText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(currentCharIndex + 1);
        
        // Play appropriate typing sound based on character type
        const keyType = getKeyType(currentChar);
        if (audioInitialized.current) {
          typewriterSound.playKey(keyType);
        }
      }, 50); // Fixed delay for consistent SSR hydration
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      
      // If we just finished displaying the morning report summary, call the callback
      if (morningReportSummary && onSummaryDisplayComplete && !summaryDisplayedRef.current) {
        summaryDisplayedRef.current = true;
        setTimeout(() => {
          onSummaryDisplayComplete();
          summaryDisplayedRef.current = false;
        }, 1000); // Wait 1 second after typing completes before clearing
      }
    }
  }, [currentCharIndex, fullText]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Track if we should skip fetching (when we have SSR data)
  const [skipFetching, setSkipFetching] = useState(true);
  
  // Allow fetching after component has stabilized
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkipFetching(false);
    }, 100); // Small delay to let SSR data settle
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch tomorrow's events when current events don't have upcoming events
  useEffect(() => {
    // Skip fetch if we're in the initial SSR phase
    if (skipFetching) {
      return;
    }
    
    const fetchTomorrowEvents = async () => {
      if (!events || events.length === 0) return;
      
      const nowInCalendarTz = getCurrentTimeInCalendarTimezone();
      const upcomingEvents = events.filter(event => parseAsUTC(event.date) > nowInCalendarTz);
      
      // If no upcoming events today, fetch tomorrow's events
      if (upcomingEvents.length === 0) {
        try {
          const tomorrow = new Date(nowInCalendarTz);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          const tomorrowEventsData = await eventService.fetchEvents({
            fromDate: tomorrowStr,
            toDate: tomorrowStr
          });
          
          setTomorrowEvents(tomorrowEventsData);
        } catch (error) {
          console.error('Failed to fetch tomorrow\'s events:', error);
          setTomorrowEvents([]);
        }
      } else {
        // Clear tomorrow's events if we have upcoming events today
        setTomorrowEvents([]);
      }
    };
    
    fetchTomorrowEvents();
  }, [events]);
  
  // Reset animation when events change, selected event changes, or morning report summary changes
  useEffect(() => {
    setDisplayText('');
    setCurrentCharIndex(0);
    setIsTyping(false);
    summaryDisplayedRef.current = false;
  }, [events, selectedEvent, selectedTimezone, morningReportSummary, nextEvent]);

  return (
    <div className={`rounded-lg p-4 mb-6 font-mono text-sm ${
      isDark 
        ? 'bg-gray-900 border border-gray-700' 
        : 'bg-gray-100 border border-gray-300'
    }`}>
      <div className="flex items-center">
        {/* Typewriter text */}
        <span className={isDark ? 'text-gray-100' : 'text-gray-800'}>
          {displayText}
        </span>
        
        {/* Retro blinking cursor */}
        <span 
          className={`font-mono text-lg transition-opacity duration-75 ${
            showCursor ? 'opacity-100' : 'opacity-0'
          } ${
            isDark ? 'text-green-400' : 'text-green-600'
          }`}
        >
          █
        </span>
      </div>
      
      {/* Status indicator */}
      {eventToDisplay && (
        <div className="mt-2 flex items-center text-xs">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            eventToDisplay.importance.toLowerCase() === 'high' ? 'bg-red-600' : 
            eventToDisplay.importance.toLowerCase() === 'medium' ? 'bg-amber-600' : 
            eventToDisplay.importance.toLowerCase() === 'low' ? 'bg-green-600' :
            'bg-gray-600'
          }`}></div>
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {eventToDisplay.importance.toUpperCase()} | {eventToDisplay.country} | {eventToDisplay.category.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default NextEventTypewriter;