import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EconomicCalendar from '../EconomicCalendar';

// Mock the NextEventTypewriter component
vi.mock('../NextEventTypewriter', () => ({
  default: () => <div data-testid="next-event-typewriter">Mock Typewriter</div>
}));

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

// Mock the data
vi.mock('../../../data/mock-events.json', () => ({
  default: [
    {
      _id: '1',
      date: '2025-07-01T12:30:00.000Z',
      event: 'Test Event',
      importance: 'high',
      source: { name: 'BLS', url: 'https://example.com' },
      category: 'employment',
      country: 'USA',
      tags: ['monthly']
    }
  ]
}));

describe('EconomicCalendar - Basic Rendering', () => {
  it('renders without crashing', () => {
    render(<EconomicCalendar />);
    expect(screen.getByText('Economic Calendar')).toBeInTheDocument();
  });

  it('renders NextEventTypewriter component', () => {
    render(<EconomicCalendar />);
    expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
  });

  it('renders week selector', () => {
    render(<EconomicCalendar />);
    expect(screen.getByText('Select Week')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<EconomicCalendar />);
    expect(screen.getByText('DATE & TIME')).toBeInTheDocument();
    expect(screen.getByText('EVENT')).toBeInTheDocument();
    expect(screen.getByText('COUNTRY')).toBeInTheDocument();
    expect(screen.getByText('IMPORTANCE')).toBeInTheDocument();
    expect(screen.getByText('CATEGORY')).toBeInTheDocument();
    expect(screen.getByText('SOURCE')).toBeInTheDocument();
  });

  it('has theme toggle button', () => {
    render(<EconomicCalendar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});