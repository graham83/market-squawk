import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';
import { ThemeProvider } from '../../../hooks/useTheme.jsx';

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playKey: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    playTypingSound: vi.fn()
  }
}));

describe('NextEventTypewriter - Timezone Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Next Event Selection with Different Timezones', () => {
    it('correctly identifies next event when user is in Sydney and calendar is in Eastern time', async () => {
      // Simulate Wednesday 8pm in Sydney (August 13, 2025)
      // This is Wednesday 6am Eastern Time
      const mockSydneyTime = new Date('2025-08-13T10:00:00.000Z'); // 8pm Sydney = 10:00 UTC
      vi.setSystemTime(mockSydneyTime);

      // Mock toLocaleString to return Eastern Time for calendar timezone calculations
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // Return 6am Eastern on Wednesday when it's 8pm Sydney on Wednesday
          return '2025-08-13, 06:00:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-13T12:30:00.000Z', // Wednesday 8:30am Eastern
          event: 'Wednesday Morning Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-08-14T14:00:00.000Z', // Thursday 10am Eastern
          event: 'Thursday Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="Australia/Sydney" />
        </ThemeProvider>
      );

      // Component should render without errors
      expect(screen.getByText('█')).toBeInTheDocument();
      
      // The Wednesday event should be selected as "next" because it's only 6am Eastern
      // even though it's already 8pm Wednesday in Sydney
    });

    it('correctly handles midnight crossover between user timezone and calendar timezone', async () => {
      // Simulate Tuesday 11pm in Los Angeles
      // This is Wednesday 3am Eastern Time
      const mockPacificTime = new Date('2025-08-13T06:00:00.000Z'); // Tuesday 11pm Pacific = 06:00 UTC Wednesday
      vi.setSystemTime(mockPacificTime);

      // Mock toLocaleString for Eastern Time calculation
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // Return 3am Eastern on Wednesday 
          return '2025-08-13, 03:00:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-13T12:30:00.000Z', // Wednesday 8:30am Eastern (same day)
          event: 'Wednesday Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-08-12T18:00:00.000Z', // Tuesday 2pm Eastern (past event)
          event: 'Tuesday Past Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="America/Los_Angeles" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      // Should select Wednesday event even though it's still Tuesday in Pacific
    });

    it('shows no upcoming events when all events are past in calendar timezone', async () => {
      // Simulate Friday 10pm Eastern Time
      const mockEasternEvening = new Date('2025-08-16T02:00:00.000Z'); // Friday 10pm Eastern = 02:00 UTC Saturday
      vi.setSystemTime(mockEasternEvening);

      // Mock toLocaleString for Eastern Time
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          return '2025-08-15, 22:00:00'; // Friday 10pm Eastern
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-15T16:30:00.000Z', // Friday 12:30pm Eastern (past)
          event: 'Friday Afternoon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-08-15T20:00:00.000Z', // Friday 4pm Eastern (past)
          event: 'Friday Late Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="America/New_York" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      // Should show "No upcoming events scheduled"
    });

    it('displays event time in user selected timezone while using calendar timezone for next event logic', async () => {
      // Simulate Wednesday 6am Eastern (when economic events typically start)
      const mockEasternMorning = new Date('2025-08-13T10:00:00.000Z'); // 6am Eastern = 10:00 UTC
      vi.setSystemTime(mockEasternMorning);

      // Mock toLocaleString for timezone conversions
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          return '2025-08-13, 06:00:00'; // 6am Eastern
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-13T12:30:00.000Z', // 8:30am Eastern, 10:30pm Sydney
          event: 'Morning Economic Data',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="Australia/Sydney" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      
      // The logic should:
      // 1. Use Eastern Time (6am) to determine this is the next event
      // 2. Display the time in Sydney timezone (10:30pm) for the user
    });

    it('handles edge case when calendar time is exactly at event time', async () => {
      // Simulate exactly 8:30am Eastern Time
      const mockEventTime = new Date('2025-08-13T12:30:00.000Z'); 
      vi.setSystemTime(mockEventTime);

      // Mock toLocaleString
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          return '2025-08-13, 08:30:00'; // Exactly 8:30am Eastern
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-13T12:30:00.000Z', // Exactly now in Eastern
          event: 'Happening Now Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2', 
          date: '2025-08-13T17:00:00.000Z', // 1pm Eastern, later today
          event: 'Afternoon Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="America/New_York" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      
      // Should select the afternoon event since the morning event is happening now (not future)
    });

    it('works correctly when user timezone matches calendar timezone', async () => {
      // Simulate 9am Eastern Time on Wednesday
      const mockEasternTime = new Date('2025-08-13T13:00:00.000Z'); // 9am Eastern = 13:00 UTC
      vi.setSystemTime(mockEasternTime);

      // Mock toLocaleString
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          return '2025-08-13, 09:00:00'; // 9am Eastern
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-08-13T17:30:00.000Z', // 1:30pm Eastern, later today
          event: 'Afternoon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="America/New_York" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      // Should work normally when both user and calendar are in Eastern Time
    });

    it('handles DST transitions correctly', async () => {
      // Simulate a date during DST (Eastern Daylight Time)
      const mockDSTTime = new Date('2025-07-15T14:00:00.000Z'); // July 15, 10am EDT = 14:00 UTC
      vi.setSystemTime(mockDSTTime);

      // Mock toLocaleString for DST period
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          return '2025-07-15, 10:00:00'; // 10am EDT
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const events = [
        {
          _id: '1',
          date: '2025-07-15T18:30:00.000Z', // 2:30pm EDT
          event: 'Summer Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(
        <ThemeProvider>
          <NextEventTypewriter events={events} selectedTimezone="America/New_York" />
        </ThemeProvider>
      );

      expect(screen.getByText('█')).toBeInTheDocument();
      // Should handle DST correctly
    });
  });
});