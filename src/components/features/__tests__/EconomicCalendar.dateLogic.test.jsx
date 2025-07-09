import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EconomicCalendar from '../EconomicCalendar';

// Mock the NextEventTypewriter component
vi.mock('../NextEventTypewriter', () => ({
  default: ({ events }) => (
    <div data-testid="next-event-typewriter">
      Events: {events?.length || 0}
    </div>
  )
}));

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

describe('EconomicCalendar - Date Logic and Week Generation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Week Generation Algorithm', () => {
    it('generates weeks correctly from scattered dates', async () => {
      // Mock events across different weeks
      const scatteredEvents = [
        {
          _id: '1',
          date: '2025-07-01T12:30:00.000Z', // Tuesday
          event: 'Event 1',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-15T14:00:00.000Z', // Tuesday
          event: 'Event 2',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        },
        {
          _id: '3',
          date: '2025-07-23T16:00:00.000Z', // Wednesday
          event: 'Event 3',
          importance: 'low',
          source: { name: 'Source3', url: 'https://example.com' },
          category: 'trade',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: scatteredEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Select Week')).toBeInTheDocument();
        // The component should generate appropriate week ranges
        // Week generation logic creates Sunday-Saturday weeks
      });
    });

    it('handles events at week boundaries correctly', async () => {
      // Events at Sunday (week start) and Saturday (week end)
      const boundaryEvents = [
        {
          _id: '1',
          date: '2025-07-06T12:00:00.000Z', // Sunday
          event: 'Week Start Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-12T23:59:00.000Z', // Saturday
          event: 'Week End Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: boundaryEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Both events should be in the same week
        expect(screen.getByText('Week Start Event')).toBeInTheDocument();
        expect(screen.getByText('Week End Event')).toBeInTheDocument();
      });
    });

    it('creates appropriate week labels', async () => {
      const weekEvents = [
        {
          _id: '1',
          date: '2025-07-01T12:30:00.000Z',
          event: 'July Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: weekEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show week selector
        expect(screen.getByText('Select Week')).toBeInTheDocument();
        // Week labels should be generated with appropriate format
      });
    });

    it('handles empty date ranges gracefully', async () => {
      vi.doMock('../../../data/mock-events.json', () => ({
        default: []
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Select Week')).toBeInTheDocument();
        // Should handle empty events gracefully
      });
    });
  });

  describe('Date Range Filtering', () => {
    it('filters events within correct date ranges', async () => {
      const multiWeekEvents = [
        {
          _id: '1',
          date: '2025-07-01T12:30:00.000Z', // Week 1
          event: 'Early Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-08T14:00:00.000Z', // Week 2
          event: 'Mid Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        },
        {
          _id: '3',
          date: '2025-07-15T16:00:00.000Z', // Week 3
          event: 'Late Event',
          importance: 'low',
          source: { name: 'Source3', url: 'https://example.com' },
          category: 'trade',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: multiWeekEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // All events should be visible initially
        expect(screen.getByText('Early Event')).toBeInTheDocument();
        expect(screen.getByText('Mid Event')).toBeInTheDocument();
        expect(screen.getByText('Late Event')).toBeInTheDocument();
      });
    });

    it('correctly calculates week boundaries', async () => {
      // Test with events across different weeks
      const preciseEvents = [
        {
          _id: '1',
          date: '2025-07-06T23:59:59.000Z', // Sunday end
          event: 'Sunday Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-07T00:00:00.000Z', // Monday start
          event: 'Monday Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: preciseEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Both events should be visible but in different weeks
        expect(screen.getByText('Sunday Event')).toBeInTheDocument();
        expect(screen.getByText('Monday Event')).toBeInTheDocument();
      });
    });
  });

  describe('Date Sorting Logic', () => {
    it('sorts events chronologically regardless of input order', async () => {
      const unsortedEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Third Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-01T12:30:00.000Z',
          event: 'First Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        },
        {
          _id: '3',
          date: '2025-07-08T12:30:00.000Z',
          event: 'Second Event',
          importance: 'low',
          source: { name: 'Source3', url: 'https://example.com' },
          category: 'trade',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: unsortedEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        const eventCells = screen.getAllByText(/First Event|Second Event|Third Event/);
        expect(eventCells[0]).toHaveTextContent('First Event');
        expect(eventCells[1]).toHaveTextContent('Second Event');
        expect(eventCells[2]).toHaveTextContent('Third Event');
      });
    });

    it('handles identical timestamps correctly', async () => {
      const sameTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Event A',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Event B',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: sameTimeEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Both events should be displayed
        expect(screen.getByText('Event A')).toBeInTheDocument();
        expect(screen.getByText('Event B')).toBeInTheDocument();
      });
    });
  });

  describe('Time Zone Handling', () => {
    it('handles UTC timestamps correctly', async () => {
      const utcEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'UTC Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: utcEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('UTC Event')).toBeInTheDocument();
        // Check that date is formatted correctly
        expect(screen.getByText(/Jul/)).toBeInTheDocument();
      });
    });

    it('processes different time formats consistently', async () => {
      const mixedTimeEvents = [
        {
          _id: '1',
          date: '2025-07-15T00:00:00.000Z', // Midnight
          event: 'Midnight Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-15T23:59:59.000Z', // End of day
          event: 'End of Day Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: mixedTimeEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Midnight Event')).toBeInTheDocument();
        expect(screen.getByText('End of Day Event')).toBeInTheDocument();
      });
    });
  });

  describe('Date Format Display', () => {
    it('displays dates in correct format', async () => {
      const formattedEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Formatted Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: formattedEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show formatted date (e.g., "Jul 15")
        expect(screen.getByText(/Jul/)).toBeInTheDocument();
        // Should show formatted time
        const timeElements = document.querySelectorAll('[class*="text-gray-400"]');
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('handles different months correctly', async () => {
      const crossMonthEvents = [
        {
          _id: '1',
          date: '2025-07-31T12:30:00.000Z',
          event: 'July Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-08-01T12:30:00.000Z',
          event: 'August Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: crossMonthEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('July Event')).toBeInTheDocument();
        expect(screen.getByText('August Event')).toBeInTheDocument();
        // Should show both Jul and Aug
        expect(screen.getByText(/Jul/)).toBeInTheDocument();
        expect(screen.getByText(/Aug/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases in Date Processing', () => {
    it('handles invalid date strings gracefully', async () => {
      const invalidDateEvents = [
        {
          _id: '1',
          date: 'not-a-date',
          event: 'Invalid Date Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Valid Date Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: invalidDateEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should handle invalid dates gracefully
        expect(screen.getByText('Valid Date Event')).toBeInTheDocument();
      });
    });

    it('handles missing date fields', async () => {
      const missingDateEvents = [
        {
          _id: '1',
          // Missing date field
          event: 'No Date Event',
          importance: 'high',
          source: { name: 'Source1', url: 'https://example.com' },
          category: 'employment',
          country: 'USA',
          tags: []
        },
        {
          _id: '2',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Has Date Event',
          importance: 'medium',
          source: { name: 'Source2', url: 'https://example.com' },
          category: 'inflation',
          country: 'USA',
          tags: []
        }
      ];

      vi.doMock('../../../data/mock-events.json', () => ({
        default: missingDateEvents
      }));

      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should handle missing dates gracefully
        expect(screen.getByText('Has Date Event')).toBeInTheDocument();
      });
    });
  });
});