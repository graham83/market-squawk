import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EconomicCalendar from '../EconomicCalendar';
import { ThemeProvider } from '../../../hooks/useTheme.jsx';

// Mock the NextEventTypewriter component
vi.mock('../NextEventTypewriter', () => ({
  default: () => <div data-testid="next-event-typewriter">Mock Typewriter</div>
}));

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn(),
    initializeAudioContext: vi.fn(),
    setEnabled: vi.fn(),
    cleanup: vi.fn()
  },
  commentaryAudio: {
    playCommentary: vi.fn(),
    stopCommentary: vi.fn(),
    isCommentaryPlaying: vi.fn().mockReturnValue(false),
    onPlaybackStart: vi.fn(),
    onPlaybackEnd: vi.fn(),
    cleanup: vi.fn()
  }
}));

// Mock the market commentary service
vi.mock('../../../services/marketCommentaryService', () => ({
  getCommentaryUrl: vi.fn().mockResolvedValue(null)
}));

// Mock the data and useEvents hook
const mockEvents = [
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
];

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

// Helper function to render component with theme provider
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('EconomicCalendar - Basic Rendering', () => {
  it('renders without crashing', () => {
    renderWithTheme(<EconomicCalendar />);
    expect(screen.getByText('Economic Calendar')).toBeInTheDocument();
  });

  it('renders NextEventTypewriter component', () => {
    renderWithTheme(<EconomicCalendar />);
    expect(screen.getByTestId('next-event-typewriter')).toBeInTheDocument();
  });

  it('renders period selector', () => {
    renderWithTheme(<EconomicCalendar />);
    expect(screen.getByText('Select Period')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    renderWithTheme(<EconomicCalendar />);
    expect(screen.getByText('DATE & TIME')).toBeInTheDocument();
    expect(screen.getByText('EVENT')).toBeInTheDocument();
    expect(screen.getByText('COUNTRY')).toBeInTheDocument();
    expect(screen.getByText('IMPORTANCE')).toBeInTheDocument();
    expect(screen.getByText('CATEGORY')).toBeInTheDocument();
    expect(screen.getByText('SOURCE')).toBeInTheDocument();
  });

  it('has theme toggle button', () => {
    renderWithTheme(<EconomicCalendar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});