import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';

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

      render(<NextEventTypewriter events={unsortedEvents} />);

      // Advance timers to allow component to process and start typing
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should find "Future Event 1" as it's chronologically next (July 12)
      await waitFor(() => {
        expect(screen.getByText(/Future Event 1/)).toBeInTheDocument();
      }, { timeout: 2000 });
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
        },
        {
          _id: '3',
          date: '2025-07-05T12:30:00.000Z',
          event: 'Another Past Event',
          importance: 'low',
          country: 'USA',
          category: 'trade'
        }
      ];

      render(<NextEventTypewriter events={mixedEvents} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should only show the future event
      await waitFor(() => {
        expect(screen.getByText(/Future Event/)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should not show past events
      expect(screen.queryByText(/Past Event/)).not.toBeInTheDocument();
    });

    it('handles events with identical dates by selecting first', async () => {
      const sameTimeEvents = [
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

      render(<NextEventTypewriter events={sameTimeEvents} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should show the first event in the sorted array
      await waitFor(() => {
        expect(screen.getByText(/First Event/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles empty events array gracefully', async () => {
      render(<NextEventTypewriter events={[]} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/No upcoming events scheduled/)).toBeInTheDocument();
      }, { timeout: 2000 });
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

      render(<NextEventTypewriter events={allPastEvents} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/No upcoming events scheduled/)).toBeInTheDocument();
      }, { timeout: 2000 });
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

      render(<NextEventTypewriter events={events} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should format time with AM/PM and timezone
      await waitFor(() => {
        const element = screen.getByText(/at \d+:\d+/);
        expect(element).toBeInTheDocument();
        expect(element.textContent).toMatch(/\d+:\d+\s?(AM|PM)/i);
      }, { timeout: 2000 });
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

      render(<NextEventTypewriter events={events} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should show formatted time
      await waitFor(() => {
        const timeElement = screen.getByText(/at \d+:\d+/);
        expect(timeElement).toBeInTheDocument();
      }, { timeout: 2000 });
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

      render(<NextEventTypewriter events={highImportanceEvent} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/HIGH/)).toBeInTheDocument();
        expect(screen.getByText(/USA/)).toBeInTheDocument();
        expect(screen.getByText(/employment/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles different importance levels', async () => {
      const mediumImportanceEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Medium Importance Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ];

      render(<NextEventTypewriter events={mediumImportanceEvent} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/MEDIUM/)).toBeInTheDocument();
        // Should show medium importance indicator (yellow dot)
        const indicator = document.querySelector('.bg-yellow-500');
        expect(indicator).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('processes event categories correctly', async () => {
      const categorizedEvents = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Monetary Policy Event',
          importance: 'high',
          country: 'USA',
          category: 'monetary_policy'
        }
      ];

      render(<NextEventTypewriter events={categorizedEvents} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/monetary policy/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Component State Management', () => {
    it('resets animation when events change', async () => {
      const { rerender } = render(<NextEventTypewriter events={[
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Original Event',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ]} />);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Change events
      rerender(<NextEventTypewriter events={[
        {
          _id: '2',
          date: '2025-07-20T14:00:00.000Z',
          event: 'New Event',
          importance: 'medium',
          country: 'USA',
          category: 'inflation'
        }
      ]} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should show new event
      await waitFor(() => {
        expect(screen.getByText(/New Event/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles null or undefined events gracefully', async () => {
      render(<NextEventTypewriter events={null} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/No upcoming events scheduled/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed date strings', async () => {
      const malformedEvents = [
        {
          _id: '1',
          date: 'invalid-date',
          event: 'Malformed Date Event',
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

      render(<NextEventTypewriter events={malformedEvents} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should handle malformed date and show valid event
      await waitFor(() => {
        expect(screen.getByText(/Valid Date Event/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles missing event properties gracefully', async () => {
      const incompleteEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'Incomplete Event',
          // Missing importance, country, category
        }
      ];

      render(<NextEventTypewriter events={incompleteEvent} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should still display the event
      await waitFor(() => {
        expect(screen.getByText(/Incomplete Event/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles very long event names', async () => {
      const longNameEvent = [
        {
          _id: '1',
          date: '2025-07-15T12:30:00.000Z',
          event: 'This is a very long event name that might cause display issues if not handled properly by the component',
          importance: 'high',
          country: 'USA',
          category: 'employment'
        }
      ];

      render(<NextEventTypewriter events={longNameEvent} />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should handle long event name
      await waitFor(() => {
        expect(screen.getByText(/This is a very long event/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});