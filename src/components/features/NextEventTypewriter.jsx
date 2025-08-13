import React, { useState, useEffect, useRef } from 'react';
import useTheme from '../../hooks/useTheme.jsx';
import typewriterSound from '../../utils/soundUtils';

const NextEventTypewriter = ({ events, selectedEvent }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const audioInitialized = useRef(false);
  
  // Theme management
  const { isDark } = useTheme();

  // Find the next upcoming event
  const getNextEvent = () => {
    if (!events || events.length === 0) return null;
    
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return upcomingEvents[0] || null;
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
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
  const eventToDisplay = selectedEvent || getNextEvent();
  const fullText = eventToDisplay 
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
      }, Math.random() * 40 + 24); // Random delay between 24-64ms for realistic typing (20% faster)
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [currentCharIndex, fullText]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Reset animation when events change or selected event changes
  useEffect(() => {
    setDisplayText('');
    setCurrentCharIndex(0);
    setIsTyping(false);
  }, [events, selectedEvent]);

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