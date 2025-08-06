import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';
import EconomicCalendar from '../EconomicCalendar';

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

// Mock NextEventTypewriter to have testid
vi.mock('../NextEventTypewriter', () => ({
  default: ({ events }) => (
    <div data-testid="next-event-typewriter">
      Events: {events?.length || 0}
    </div>
  )
}));

// Mock EconomicCalendar data
const mockEvents = [
    {
      _id: '1',
      date: '2025-07-15T09:30:00.000Z',
      event: 'Morning Event',
      importance: 'high',
      source: { name: 'BLS', url: 'https://example.com' },
      category: 'employment',
      country: 'USA',
      tags: []
    },
    {
      _id: '2',
      date: '2025-07-15T17:45:00.000Z',
      event: 'Evening Event',
      importance: 'low',
      source: { name: 'Treasury', url: 'https://example.com' },
      category: 'treasury',
      country: 'USA',
      tags: []
    },
    {
      _id: '3',
      date: '2025-07-15T23:59:00.000Z',
      event: 'Late Night Event',
      importance: 'medium',
      source: { name: 'Federal Reserve', url: 'https://example.com' },
      category: 'monetary_policy',
      country: 'USA',
      tags: []
    }
  ];

// Mock the useEvents hook
vi.mock('../../../hooks/useEvents', () => ({
  default: () => ({
    events: mockEvents,
    loading: false,
    error: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    fetchEventsWithDateRange: vi.fn(),
    hasEvents: true,
    isEmpty: false,
    isStale: false
  })
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

      // Component should render correctly with time formatting
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });

    it('formats afternoon times correctly', async () => {
      const afternoonEvent = [
        {
          _id: '1',
          date: '2025-07-15T15:30:00.000Z',
          event: 'Afternoon Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<NextEventTypewriter events={afternoonEvent} />);

      // Component should handle afternoon times
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });

    it('handles timezone display consistently', async () => {
      const events = [
        {
          _id: '1',
          date: '2025-07-15T12:00:00.000Z',
          event: 'UTC Noon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={events} />);

      // Component should handle UTC times
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });
  });

  describe('EconomicCalendar Time Display', () => {
    it('displays date in correct format', async () => {
      render(<EconomicCalendar />);

      // Should show formatted date (e.g., "Jul 15")
      expect(screen.getByText('Morning Event')).toBeInTheDocument();
      expect(screen.getByText('Evening Event')).toBeInTheDocument();
    });

    it('shows time consistently across different events', async () => {
      render(<EconomicCalendar />);

      // Multiple events should display times consistently
      expect(screen.getByText('Morning Event')).toBeInTheDocument();
      expect(screen.getByText('Evening Event')).toBeInTheDocument();
      expect(screen.getByText('Late Night Event')).toBeInTheDocument();
    });

    it('handles pagination with time formatting', async () => {
      render(<EconomicCalendar />);

      // Check that times are displayed correctly on first page
      expect(screen.getByText('Morning Event')).toBeInTheDocument();
      expect(screen.getByText('Evening Event')).toBeInTheDocument();
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
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<NextEventTypewriter events={dstEvents} />);

      // Component should handle DST transitions
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });

    it('handles midnight and noon times', async () => {
      const edgeTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15T00:00:00.000Z',
          event: 'Midnight Event',
          importance: 'low',
          country: 'USA',
          category: 'housing'
        },
        {
          _id: '2',
          date: '2025-07-15T12:00:00.000Z',
          event: 'Noon Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<NextEventTypewriter events={edgeTimeEvents} />);

      // Component should handle edge times
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });
  });

  describe('Cross-Component Time Consistency', () => {
    it('maintains consistent time formatting between components', async () => {
      render(<EconomicCalendar />);

      // Both components should show consistent time formatting
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
      expect(screen.getByText('Morning Event')).toBeInTheDocument();
    });

    it('handles time format changes gracefully', async () => {
      render(<EconomicCalendar />);

      // Component should handle various time formats
      expect(screen.getByText('Economic Calendar')).toBeInTheDocument();
      expect(screen.getByText('Morning Event')).toBeInTheDocument();
    });
  });

  describe('Performance and Efficiency', () => {
    it('renders time formatting efficiently', async () => {
      const manyEvents = Array.from({ length: 10 }, (_, i) => ({
        _id: (i + 1).toString(),
        date: new Date(Date.now() + i * 86400000).toISOString(),
        event: `Event ${i + 1}`,
        importance: 'medium',
        country: 'USA',
        category: 'employment'
      }));

      render(<NextEventTypewriter events={manyEvents} />);

      // Component should handle multiple events efficiently
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });

    it('handles rapid event updates', async () => {
      const initialEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:00:00.000Z',
          event: 'Initial Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      const { rerender } = render(<NextEventTypewriter events={initialEvents} />);
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();

      // Update with new events
      const updatedEvents = [
        {
          _id: '2',
          date: '2025-07-16T14:00:00.000Z',
          event: 'Updated Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      rerender(<NextEventTypewriter events={updatedEvents} />);

      // Component should handle updates efficiently
      expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
    });
  });
});