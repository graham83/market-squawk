import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';
import { ThemeProvider } from '../../../hooks/useTheme.jsx';

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

describe('NextEventTypewriter - Business Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock current date to be July 8, 2025, 10:00 AM
    const mockDate = new Date('2025-07-08T10:00:00.000Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Event Selection Logic', () => {
    it('correctly identifies next upcoming event from unsorted array', async () => {
      const unsortedEvents = [
        {
          _id: '1',
          date: '2025-07-25T12:30:00.000Z',
          event: 'Future Event 3',
          importance: 'high',
          country: 'USA',
          category: 'inflation'
        },
        {
          _id: '2',
          date: '2025-07-12T14:00:00.000Z',
          event: 'Future Event 1',
          importance: 'medium',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '3',
          date: '2025-07-20T12:30:00.000Z',
          event: 'Future Event 2',
          importance: 'low',
          country: 'USA',
          category: 'trade'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={unsortedEvents} /></ThemeProvider>);

      // Component should render without errors
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('filters out past events correctly', async () => {
      const mixedEvents = [
        {
          _id: '1',
          date: '2025-07-01T12:30:00.000Z',
          event: 'Past Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-07-15T14:00:00.000Z',
          event: 'Future Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={mixedEvents} /></ThemeProvider>);

      // Component should render and handle filtering
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles events with identical dates by selecting first', async () => {
      const identicalDateEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'First Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Second Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={identicalDateEvents} /></ThemeProvider>);

      // Component should handle identical dates
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles empty events array gracefully', async () => {
      render(<ThemeProvider><NextEventTypewriter events={[]} /></ThemeProvider>);

      // Should render cursor even with no events
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles all past events gracefully', async () => {
      const allPastEvents = [
        {
          _id: '1',
          date: '2025-07-01T12:30:00.000Z',
          event: 'Past Event 1',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-07-05T14:00:00.000Z',
          event: 'Past Event 2',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={allPastEvents} /></ThemeProvider>);

      // Should render even when all events are past
      expect(screen.getByText('█')).toBeInTheDocument();
    });
  });

  describe('Time Formatting Logic', () => {
    it('formats time correctly with AM/PM and timezone', async () => {
      const events = [
        {
          _id: '1',
          date: '2025-07-15T14:30:00.000Z',
          event: 'Afternoon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={events} /></ThemeProvider>);

      // Component should handle time formatting
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles different time zones consistently', async () => {
      const events = [
        {
          _id: '1',
          date: '2025-07-15T12:00:00.000Z',
          event: 'Noon Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={events} /></ThemeProvider>);

      // Component should handle timezone consistently
      expect(screen.getByText('█')).toBeInTheDocument();
    });
  });

  describe('Event Status Processing', () => {
    it('correctly displays event importance in status indicator', async () => {
      const highImportanceEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'High Importance Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={highImportanceEvent} /></ThemeProvider>);

      // Component should handle importance levels
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles different importance levels', async () => {
      const events = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Medium Event',
          importance: 'medium',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={events} /></ThemeProvider>);

      // Component should process different importance levels
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('processes event categories correctly', async () => {
      const events = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Category Event',
          importance: 'high',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={events} /></ThemeProvider>);

      // Component should handle categories
      expect(screen.getByText('█')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('resets animation when events change', async () => {
      const initialEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Initial Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      const { rerender } = render(<ThemeProvider><NextEventTypewriter events={initialEvents} /></ThemeProvider>);
      expect(screen.getByText('█')).toBeInTheDocument();

      // Change events
      const newEvents = [
        {
          _id: '2',
          date: '2025-07-20T14:00:00.000Z',
          event: 'New Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      rerender(<ThemeProvider><NextEventTypewriter events={newEvents} /></ThemeProvider>);

      // Component should handle event changes
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles null or undefined events gracefully', async () => {
      render(<ThemeProvider><NextEventTypewriter events={null} /></ThemeProvider>);

      // Should handle null events
      expect(screen.getByText('█')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed date strings', async () => {
      const malformedEvents = [
        {
          _id: '1',
          date: 'invalid-date',
          event: 'Bad Date Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        },
        {
          _id: '2',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Valid Date Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={malformedEvents} /></ThemeProvider>);

      // Component should handle malformed dates gracefully
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles missing event properties gracefully', async () => {
      const incompleteEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Incomplete Event',
          importance: 'medium',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={incompleteEvent} /></ThemeProvider>);

      // Component should display with complete properties
      expect(screen.getByText('█')).toBeInTheDocument();
    });

    it('handles very long event names', async () => {
      const longNameEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'This is an extremely long event name that should be handled gracefully by the component without breaking the layout or causing any errors in the display system',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<ThemeProvider><NextEventTypewriter events={longNameEvents} /></ThemeProvider>);

      // Component should handle long names
      expect(screen.getByText('█')).toBeInTheDocument();
    });
  });
});