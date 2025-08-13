import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NextEventTypewriter from '../NextEventTypewriter';
import { ThemeProvider } from '../../../hooks/useTheme.jsx';

// Mock the sound utils
vi.mock('../../../utils/soundUtils', () => ({
  default: {
    playTypingSound: vi.fn()
  }
}));

// Helper function to render component with theme provider
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('NextEventTypewriter - Basic Rendering', () => {
  const mockEvents = [
    {
      _id: '1',
      date: '2025-07-15T12:30:00.000Z',
      event: 'Test Event',
      importance: 'high',
      country: 'USA',
      category: 'employment'
    }
  ];

  it('renders without crashing', () => {
    renderWithTheme(<NextEventTypewriter events={mockEvents} />);
    // Check for the cursor character
    expect(screen.getByText('█')).toBeInTheDocument();
  });

  it('handles empty events array', () => {
    renderWithTheme(<NextEventTypewriter events={[]} />);
    // Should still render the cursor
    expect(screen.getByText('█')).toBeInTheDocument();
  });

  it('renders cursor with correct styling', () => {
    renderWithTheme(<NextEventTypewriter events={mockEvents} />);
    const cursor = screen.getByText('█');
    expect(cursor).toHaveClass('text-green-400');
  });

  it('renders terminal container', () => {
    renderWithTheme(<NextEventTypewriter events={mockEvents} />);
    const container = document.querySelector('.bg-gray-900');
    expect(container).toBeInTheDocument();
  });
});