import React, { useState, useEffect } from 'react';
import typewriterSound from '../../utils/soundUtils';

const NextEventTypewriter = ({ events }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

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

  const nextEvent = getNextEvent();
  const fullText = nextEvent 
    ? `Next Event: ${nextEvent.event} at ${formatEventTime(nextEvent.date)}`
    : 'No upcoming events scheduled';

  // Typewriter effect
  useEffect(() => {
    if (currentCharIndex < fullText.length) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(currentCharIndex + 1);
        
        // Play typing sound
        typewriterSound.playTypingSound();
      }, Math.random() * 50 + 30); // Random delay between 30-80ms for realistic typing
      
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

  // Reset animation when events change
  useEffect(() => {
    setDisplayText('');
    setCurrentCharIndex(0);
    setIsTyping(false);
  }, [events]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6 font-mono text-sm">
      <div className="flex items-center">
        {/* Typewriter text */}
        <span className="text-gray-100">
          {displayText}
        </span>
        
        {/* Retro blinking cursor */}
        <span 
          className={`text-green-400 font-mono text-lg ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-75`}
        >
          █
        </span>
      </div>
      
      {/* Status indicator */}
      {nextEvent && (
        <div className="mt-2 flex items-center text-xs">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            nextEvent.importance === 'high' ? 'bg-red-500' : 
            nextEvent.importance === 'medium' ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}></div>
          <span className="text-gray-400">
            {nextEvent.importance.toUpperCase()} | {nextEvent.country} | {nextEvent.category}
          </span>
        </div>
      )}
    </div>
  );
};

export default NextEventTypewriter;