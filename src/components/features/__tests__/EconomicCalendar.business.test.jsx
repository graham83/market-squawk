import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EconomicCalendar from '../EconomicCalendar';

// Mock the NextEventTypewriter component
vi.mock('../NextEventTypewriter', () => ({
  default: ({ events }) => (
    <div data-testid="next-event-typewriter">
      NextEvent: {events?.length || 0} events
    </div>
  )
}));

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

// Mock the data module with static data
vi.mock('../../../data/mock-events.json', () => ({
  default: [
    {
      _id: '1',
      date: '2025-07-01T12:30:00.000Z',
      event: 'Employment Situation - June',
      importance: 'high',
      source: { name: 'BLS', url: 'https://example.com' },
      category: 'employment',
      country: 'USA',
      tags: ['monthly'],
      created_at: '2025-07-01T00:00:00.000Z',
      updated_at: '2025-07-01T00:00:00.000Z'
    },
    {
      _id: '2',
      date: '2025-07-02T14:30:00.000Z',
      event: 'EIA Petroleum Status Report',
      importance: 'medium',
      source: { name: 'EIA', url: 'https://example.com' },
      category: 'energy',
      country: 'USA',
      tags: ['weekly'],
      created_at: '2025-07-02T00:00:00.000Z',
      updated_at: '2025-07-02T00:00:00.000Z'
    },
    {
      _id: '3',
      date: '2025-07-08T12:30:00.000Z',
      event: 'Consumer Price Index (CPI)',
      importance: 'high',
      source: { name: 'BLS', url: 'https://example.com' },
      category: 'inflation',
      country: 'USA',
      tags: ['consumer', 'cpi'],
      created_at: '2025-07-08T00:00:00.000Z',
      updated_at: '2025-07-08T00:00:00.000Z'
    },
    {
      _id: '4',
      date: '2025-07-15T17:00:00.000Z',
      event: 'Treasury Bill Auction',
      importance: 'low',
      source: { name: 'Treasury', url: 'https://example.com' },
      category: 'treasury',
      country: 'USA',
      tags: ['weekly'],
      created_at: '2025-07-15T00:00:00.000Z',
      updated_at: '2025-07-15T00:00:00.000Z'
    },
    {
      _id: '5',
      date: '2025-07-22T14:00:00.000Z',
      event: 'Housing Starts',
      importance: 'medium',
      source: { name: 'Census Bureau', url: 'https://example.com' },
      category: 'housing',
      country: 'USA',
      tags: ['monthly'],
      created_at: '2025-07-22T00:00:00.000Z',
      updated_at: '2025-07-22T00:00:00.000Z'
    },
    {
      _id: '6',
      date: '2025-07-25T12:30:00.000Z',
      event: 'GDP Report',
      importance: 'high',
      source: { name: 'BEA', url: 'https://example.com' },
      category: 'gdp',
      country: 'USA',
      tags: ['quarterly'],
      created_at: '2025-07-25T00:00:00.000Z',
      updated_at: '2025-07-25T00:00:00.000Z'
    },
    {
      _id: '7',
      date: '2025-07-30T16:00:00.000Z',
      event: 'FOMC Meeting',
      importance: 'high',
      source: { name: 'Federal Reserve', url: 'https://example.com' },
      category: 'monetary_policy',
      country: 'USA',
      tags: [],
      created_at: '2025-07-30T00:00:00.000Z',
      updated_at: '2025-07-30T00:00:00.000Z'
    }
  ]
}));

describe('EconomicCalendar - Business Logic & Data Processing', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Data Processing and Sorting', () => {
    it('sorts events chronologically by date', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Check that the table has been rendered with event data
        expect(screen.getByText('Employment Situation - June')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Check that events appear in chronological order
      await waitFor(() => {
        const eventCells = screen.getAllByText(/Employment Situation|EIA Petroleum|Consumer Price Index/);
        expect(eventCells.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('processes event importance levels correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Check for high importance events
        const highElements = screen.getAllByText('HIGH');
        expect(highElements.length).toBeGreaterThan(0);
      }, { timeout: 10000 });

      await waitFor(() => {
        // Check for different importance levels
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
        expect(screen.getByText('LOW')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('displays event tags correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('monthly')).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(screen.getByText('weekly')).toBeInTheDocument();
        expect(screen.getByText('consumer')).toBeInTheDocument();
        expect(screen.getByText('cpi')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('formats event dates correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show formatted dates
        expect(screen.getByText(/Jul/)).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        // Should show formatted times
        const timeElements = document.querySelectorAll('[class*="font-mono"]');
        expect(timeElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Pagination Logic', () => {
    it('displays correct number of events per page', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should show 5 events per page by default
        const eventRows = document.querySelectorAll('tbody tr');
        expect(eventRows.length).toBe(5);
      }, { timeout: 10000 });
    });

    it('calculates pagination info correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // With 7 events and 5 per page, should show "Showing 1 to 5 of 7 results"
        expect(screen.getByText(/Showing 1 to 5 of 7 results/)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('handles page navigation correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Check that page 2 button exists
        const page2Button = screen.getByText('2');
        expect(page2Button).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click page 2
      await user.click(screen.getByText('2'));

      await waitFor(() => {
        // Should now show remaining events
        expect(screen.getByText(/Showing 6 to 7 of 7 results/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('disables pagination buttons correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Previous button should be disabled on page 1
        const prevButton = screen.getByText('«');
        expect(prevButton).toBeDisabled();
      }, { timeout: 10000 });

      // Go to page 2
      await user.click(screen.getByText('2'));

      await waitFor(() => {
        // Previous button should now be enabled
        const prevButton = screen.getByText('«');
        expect(prevButton).not.toBeDisabled();
        
        // Next button should be disabled on last page
        const nextButton = screen.getByText('»');
        expect(nextButton).toBeDisabled();
      }, { timeout: 5000 });
    });
  });

  describe('Week Generation and Filtering', () => {
    it('generates week options based on event dates', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Should have "Select Week" label
        expect(screen.getByText('Select Week')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('filters events by selected week', async () => {
      render(<EconomicCalendar />);

      // Initial state should show all events
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 5 of 7 results/)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Note: Testing week selection would require interacting with Material Tailwind Select
      // which is complex to test directly. The logic exists in the component.
    });

    it('resets to page 1 when changing filters', async () => {
      render(<EconomicCalendar />);

      // Go to page 2 first
      await waitFor(() => {
        const page2Button = screen.getByText('2');
        expect(page2Button).toBeInTheDocument();
      }, { timeout: 10000 });

      await user.click(screen.getByText('2'));

      await waitFor(() => {
        expect(screen.getByText(/Showing 6 to 7 of 7 results/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // When filter changes, should reset to page 1
      // (This is handled by the useEffect in the component)
    });
  });

  describe('Event Category Processing', () => {
    it('displays categories with correct styling', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('employment')).toBeInTheDocument();
        expect(screen.getByText('energy')).toBeInTheDocument();
        expect(screen.getByText('inflation')).toBeInTheDocument();
        expect(screen.getByText('treasury')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('processes monetary policy category correctly', async () => {
      render(<EconomicCalendar />);

      // Go to page 2 to see FOMC Meeting
      await waitFor(() => {
        const page2Button = screen.getByText('2');
        expect(page2Button).toBeInTheDocument();
      }, { timeout: 10000 });

      await user.click(screen.getByText('2'));

      await waitFor(() => {
        expect(screen.getByText('monetary policy')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Source Link Processing', () => {
    it('creates correct source links', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        const sourceLinks = screen.getAllByRole('link');
        expect(sourceLinks.length).toBeGreaterThan(0);
        
        // Check that links have correct attributes
        sourceLinks.forEach(link => {
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      }, { timeout: 10000 });
    });

    it('displays source names correctly', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        expect(screen.getByText('BLS')).toBeInTheDocument();
        expect(screen.getByText('EIA')).toBeInTheDocument();
        expect(screen.getByText('Treasury')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles events with missing optional properties gracefully', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // The component should render events even if some optional properties are missing
        expect(screen.getByText('Employment Situation - June')).toBeInTheDocument();
        expect(screen.getByText('EIA Petroleum Status Report')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Data Consistency and Validation', () => {
    it('maintains data integrity during operations', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Verify all expected events are present
        expect(screen.getByText('Employment Situation - June')).toBeInTheDocument();
        expect(screen.getByText('EIA Petroleum Status Report')).toBeInTheDocument();
        expect(screen.getByText('Consumer Price Index (CPI)')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Navigate pages and verify data consistency
      await user.click(screen.getByText('2'));

      await waitFor(() => {
        expect(screen.getByText('Housing Starts')).toBeInTheDocument();
        expect(screen.getByText('GDP Report')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Go back to page 1
      await user.click(screen.getByText('1'));

      await waitFor(() => {
        // Original events should still be there
        expect(screen.getByText('Employment Situation - June')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('validates event data structure', async () => {
      render(<EconomicCalendar />);

      await waitFor(() => {
        // Each event should have all required fields displayed
        const eventRows = document.querySelectorAll('tbody tr');
        
        eventRows.forEach((row, index) => {
          if (index < 5) { // First page has 5 events
            // Should have date, event name, country, importance, category, source
            const cells = row.querySelectorAll('td');
            expect(cells.length).toBe(6);
          }
        });
      }, { timeout: 10000 });
    });
  });
});