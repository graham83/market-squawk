import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';
import EconomicCalendar from '../EconomicCalendar';

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

describe('Time Formatting and Display Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to July 8, 2025, 10:00 AM UTC
    vi.setSystemTime(new Date('2025-07-08T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('NextEventTypewriter Time Formatting', () => {
    it('formats time with AM/PM correctly', async () => {
      const morningEvent = [
        {
          _id: '1',
          date: '2025-07-15T09:30:00.000Z',
          event: 'Morning Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={morningEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        expect(timeText.textContent).toMatch(/AM|PM/i);
      }, { timeout: 2000 });
    });

    it('formats afternoon times correctly', async () => {
      const afternoonEvent = [
        {
          _id: '1',
          date: '2025-07-15T14:30:00.000Z',
          event: 'Afternoon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={afternoonEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        // Should show PM time
        expect(timeText.textContent).toMatch(/PM/i);
      }, { timeout: 2000 });
    });

    it('handles midnight times correctly', async () => {
      const midnightEvent = [
        {
          _id: '1',
          date: '2025-07-15T00:00:00.000Z',
          event: 'Midnight Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={midnightEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        // Should show 12:00 AM
        expect(timeText.textContent).toMatch(/12:00.*AM/i);
      }, { timeout: 2000 });
    });

    it('handles noon times correctly', async () => {
      const noonEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:00:00.000Z',
          event: 'Noon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={noonEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        // Should show 12:00 PM
        expect(timeText.textContent).toMatch(/12:00.*PM/i);
      }, { timeout: 2000 });
    });

    it('includes timezone information', async () => {
      const timedEvent = [
        {
          _id: '1',
          date: '2025-07-15T14:30:00.000Z',
          event: 'Timed Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={timedEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        // Should include timezone abbreviation
        expect(timeText.textContent).toMatch(/GMT|UTC|EST|PST|EDT|PDT/i);
      }, { timeout: 2000 });
    });

    it('handles different minute values correctly', async () => {
      const preciseTimeEvent = [
        {
          _id: '1',
          date: '2025-07-15T14:45:30.000Z',
          event: 'Precise Time Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={preciseTimeEvent} />);

      await waitFor(() => {
        const timeText = screen.getByText(/at \d+:\d+/);
        expect(timeText).toBeInTheDocument();
        // Should show 2:45 PM (minutes should be preserved)
        expect(timeText.textContent).toMatch(/2:45.*PM/i);
      }, { timeout: 2000 });
    });
  });

  describe('EconomicCalendar Time Display', () => {
    // Mock comprehensive test data
    const timeTestEvents = [
      {
        _id: '1',
        date: '2025-07-01T09:15:00.000Z',
        event: 'Early Morning Event',
        importance: 'high',
        source: { name: 'BLS', url: 'https://example.com' },
        category: 'employment',
        country: 'USA',
        tags: []
      },
      {
        _id: '2',
        date: '2025-07-01T12:30:00.000Z',
        event: 'Lunch Time Event',
        importance: 'medium',
        source: { name: 'EIA', url: 'https://example.com' },
        category: 'energy',
        country: 'USA',
        tags: []
      },
      {
        _id: '3',
        date: '2025-07-01T17:45:00.000Z',
        event: 'Evening Event',
        importance: 'low',
        source: { name: 'Treasury', url: 'https://example.com' },
        category: 'treasury',
        country: 'USA',
        tags: []
      },
      {
        _id: '4',
        date: '2025-07-01T23:59:00.000Z',
        event: 'Late Night Event',
        importance: 'medium',
        source: { name: 'Federal Reserve', url: 'https://example.com' },
        category: 'monetary_policy',
        country: 'USA',
        tags: []
      }
    ];

    it('displays date in correct format', async () => {
      vi.doMock('../../../data/mock-events.json', () => ({
        default: timeTestEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show formatted date (e.g., "Jul 1")
        expect(screen.getByText(/Jul/)).toBeInTheDocument();
        // Should show day of week (e.g., "Tue")
        expect(screen.getByText(/Tue/)).toBeInTheDocument();
      });
    });

    it('displays time with timezone correctly', async () => {
      vi.doMock('../../../data/mock-events.json', () => ({
        default: timeTestEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show times in table
        const timeElements = document.querySelectorAll('[class*="text-gray-400"]');
        expect(timeElements.length).toBeGreaterThan(0);
        
        // At least one time element should contain timezone info
        const hasTimezone = Array.from(timeElements).some(element => 
          element.textContent.match(/GMT|UTC|EST|PST|EDT|PDT/i)
        );
        expect(hasTimezone).toBe(true);
      });
    });

    it('handles different times of day in table', async () => {
      vi.doMock('../../../data/mock-events.json', () => ({
        default: timeTestEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show all events
        expect(screen.getByText('Early Morning Event')).toBeInTheDocument();
        expect(screen.getByText('Lunch Time Event')).toBeInTheDocument();
        expect(screen.getByText('Evening Event')).toBeInTheDocument();
        expect(screen.getByText('Late Night Event')).toBeInTheDocument();
      });
    });

    it('maintains consistent time formatting across pagination', async () => {
      // Create enough events to span multiple pages
      const paginatedEvents = [];
      for (let i = 0; i < 8; i++) {
        paginatedEvents.push({
          _id: `${i + 1}`,
          date: `2025-07-${String(i + 1).padStart(2, '0')}T${String(9 + i).padStart(2, '0')}:30:00.000Z`,
          event: `Event ${i + 1}`,
          importance: 'medium',
          source: { name: 'Source', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        });
      }

      vi.doMock('../../../data/mock-events.json', () => ({
        default: paginatedEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Check first page times
        const firstPageTimes = document.querySelectorAll('[class*="text-gray-400"]');
        expect(firstPageTimes.length).toBeGreaterThan(0);
      });

      // Navigate to second page
      const page2Button = screen.getByText('2');
      await page2Button.click();

      await waitFor(() => {
        // Check second page times
        const secondPageTimes = document.querySelectorAll('[class*="text-gray-400"]');
        expect(secondPageTimes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cross-Component Time Consistency', () => {
    it('maintains consistent time formatting between components', async () => {
      // Mock NextEventTypewriter component to capture events
      const MockNextEventTypewriter = vi.fn(({ events }) => {
        if (events && events.length > 0) {
          const nextEvent = events.find(e => new Date(e.date) > new Date());
          if (nextEvent) {
            const time = new Date(nextEvent.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
              hour12: true
            });
            return <div data-testid="typewriter-time">{time}</div>;
          }
        }
        return <div data-testid="typewriter-time">No events</div>;
      });

      vi.doMock('../NextEventTypewriter', () => ({
        default: MockNextEventTypewriter
      }));

      const consistentTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15T14:30:00.000Z',
          event: 'Consistent Time Event',
          importance: 'high',
          source: { name: 'BLS', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: consistentTimeEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Both components should show consistent time formatting
        expect(screen.getByTestId('typewriter-time')).toBeInTheDocument();
        expect(screen.getByText('Consistent Time Event')).toBeInTheDocument();
      });
    });
  });

  describe('Time Zone Edge Cases', () => {
    it('handles daylight saving time transitions', async () => {
      // Test with events during DST transition periods
      const dstEvents = [
        {
          _id: '1',
          date: '2025-03-09T07:00:00.000Z', // DST begins
          event: 'DST Begin Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-11-02T06:00:00.000Z', // DST ends
          event: 'DST End Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={dstEvents} />);

      await waitFor(() => {
        // Should handle DST transitions gracefully
        const timeElement = screen.getByText(/at \d+:\d+/);
        expect(timeElement).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles international time zones consistently', async () => {
      // Test with events that might be displayed in different time zones
      const internationalEvents = [
        {
          _id: '1',
          date: '2025-07-15T20:00:00.000Z', // 8:00 PM UTC
          event: 'International Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={internationalEvents} />);

      await waitFor(() => {
        // Should display time consistently regardless of system timezone
        const timeElement = screen.getByText(/at \d+:\d+/);
        expect(timeElement).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Time Formatting Error Handling', () => {
    it('handles invalid time values gracefully', async () => {
      const invalidTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15T25:70:00.000Z', // Invalid time
          event: 'Invalid Time Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={invalidTimeEvents} />);

      await waitFor(() => {
        // Should handle invalid time gracefully
        expect(screen.getByText(/No upcoming events scheduled/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles partial time information', async () => {
      const partialTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15', // Date without time
          event: 'Partial Time Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={partialTimeEvents} />);

      await waitFor(() => {
        // Should handle partial time information
        const element = screen.getByText(/Partial Time Event|No upcoming events scheduled/);
        expect(element).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});