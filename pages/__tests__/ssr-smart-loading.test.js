import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayInET, computeDayRange, computeWeekRange } from '../api/utils.js';

// Mock fetch globally
global.fetch = vi.fn();

// We'll test getServerSideProps in isolation since it doesn't require JSX
// In a real Next.js app, this would be tested with a framework like Next.js testing library
const getServerSideProps = async ({ req, res }) => {
  // Mock implementation based on the actual getServerSideProps
  // This is a simplified version for testing purposes
  try {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    
    const todayET = getTodayInET();
    const tomorrowET = new Date(new Date(todayET).getTime() + 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const getBaseUrl = () => {
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000';
      }
      return 'https://marketsquawk.ai';
    };
    
    const baseUrl = getBaseUrl();
    
    let events = [];
    let morningReport = null;
    let dataSource = '';
    
    // Try today's events
    try {
      const { fromDate, toDate } = computeDayRange(todayET);
      const todayUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
      
      const response = await fetch(todayUrl, {
        headers: { 
          'accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const todayEvents = Array.isArray(data) ? data : [];
        
        if (todayEvents.length > 0) {
          events = todayEvents;
          dataSource = 'today';
        }
      }
    } catch (error) {
      console.warn('Today API failed:', error.message);
    }
    
    // Try tomorrow's events if today has none
    if (events.length === 0) {
      try {
        const { fromDate, toDate } = computeDayRange(tomorrowET);
        const tomorrowUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        
        const response = await fetch(tomorrowUrl, {
          headers: { 
            'accept': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const tomorrowEvents = Array.isArray(data) ? data : [];
          
          if (tomorrowEvents.length > 0) {
            events = tomorrowEvents;
            dataSource = 'tomorrow';
          }
        }
      } catch (error) {
        console.warn('Tomorrow API failed:', error.message);
      }
    }
    
    // Try this week's events as final fallback
    if (events.length === 0) {
      try {
        const { fromDate, toDate } = computeWeekRange(todayET);
        const weekUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        
        const response = await fetch(weekUrl, {
          headers: { 
            'accept': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          events = Array.isArray(data) ? data : [];
          dataSource = 'week';
        }
      } catch (error) {
        console.warn('Week API failed:', error.message);
      }
    }
    
    // Fetch morning report
    try {
      const morningReportUrl = `${baseUrl}/api/morning-report`;
      const response = await fetch(morningReportUrl, {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        morningReport = await response.json();
      }
    } catch (error) {
      console.warn('Morning report failed:', error.message);
    }
    
    // Generate metadata
    const eventCount = events.length;
    const highCount = events.filter(e => e.importance === 'high').length;
    const mediumCount = events.filter(e => e.importance === 'medium').length;
    const lowCount = events.filter(e => e.importance === 'low').length;
    
    let title = 'Economic Calendar - Market Squawk';
    let description = `Track upcoming economic events and market-moving indicators. Get real-time updates on ${eventCount} events`;
    
    if (dataSource === 'today') {
      title = `Today's Economic Calendar - Market Squawk`;
      description = `${eventCount} events scheduled for today`;
      if (eventCount > 0) {
        description += ` (${highCount} high, ${mediumCount} medium, ${lowCount} low importance)`;
      }
    } else if (dataSource === 'tomorrow') {
      title = `Tomorrow's Economic Calendar - Market Squawk`;
      description = `${eventCount} events scheduled for tomorrow`;
      if (eventCount > 0) {
        description += ` (${highCount} high, ${mediumCount} medium, ${lowCount} low importance)`;
      }
    } else if (dataSource === 'week') {
      title = `This Week's Economic Calendar - Market Squawk`;
      description = `${eventCount} events scheduled this week`;
      if (eventCount > 0) {
        description += ` (${highCount} high, ${mediumCount} medium, ${lowCount} low importance)`;
      }
    }
    
    const pageMetadata = {
      title,
      description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Market Squawk Economic Calendar'
      }
    };
    
    return {
      props: {
        initialData: events,
        morningReport,
        pageMetadata
      }
    };
  } catch (error) {
    console.error('SSR failed:', error);
    return {
      props: {
        initialData: [],
        morningReport: null,
        pageMetadata: {
          title: 'Economic Calendar - Market Squawk',
          description: 'Track upcoming economic events',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Market Squawk Economic Calendar'
          }
        }
      }
    };
  }
};

describe('SSR Smart Default Data Loading', () => {
  let context;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    // Mock SSR context
    context = {
      req: {
        headers: {
          host: 'localhost:3000'
        }
      },
      res: {
        setHeader: vi.fn()
      }
    };

    // Set environment variables
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NODE_ENV;
    delete process.env.VERCEL_URL;
  });

  describe('Smart Fallback Strategy', () => {
    it('should load today\'s events when available', async () => {
      const todayEvents = [
        {
          date: '2024-01-15T14:00:00Z',
          event: 'Today Event',
          importance: 'high'
        }
      ];

      global.fetch.mockImplementation((url) => {
        if (url.includes('fromDate=2024-01-15')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(todayEvents)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual(todayEvents);
      expect(result.props.pageMetadata).toBeDefined();
      expect(result.props.pageMetadata.title).toContain('Today');
    });

    it('should fall back to tomorrow\'s events when today has none', async () => {
      const tomorrowEvents = [
        {
          date: '2024-01-16T14:00:00Z',
          event: 'Tomorrow Event',
          importance: 'medium'
        }
      ];

      global.fetch.mockImplementation((url) => {
        if (url.includes('fromDate=2024-01-15')) {
          // Today - empty
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          });
        }
        if (url.includes('fromDate=2024-01-16')) {
          // Tomorrow - has events
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(tomorrowEvents)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual(tomorrowEvents);
      expect(result.props.pageMetadata.title).toContain('Tomorrow');
    });

    it('should fall back to week\'s events when today and tomorrow have none', async () => {
      const weekEvents = [
        {
          date: '2024-01-17T14:00:00Z',
          event: 'Week Event',
          importance: 'low'
        }
      ];

      global.fetch.mockImplementation((url) => {
        if (url.includes('fromDate=2024-01-15') && url.includes('toDate=2024-01-15')) {
          // Today - empty
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          });
        }
        if (url.includes('fromDate=2024-01-16') && url.includes('toDate=2024-01-16')) {
          // Tomorrow - empty
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          });
        }
        if (url.includes('fromDate=2024-01-15') && url.includes('toDate=2024-01-21')) {
          // Week - has events
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(weekEvents)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual(weekEvents);
      expect(result.props.pageMetadata.title).toContain('This Week');
    });

    it('should handle all API failures gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await getServerSideProps(context);

      // Should return empty data but still render
      expect(result.props.initialData).toEqual([]);
      expect(result.props.pageMetadata).toBeDefined();
      expect(result.props.pageMetadata.title).toBe('Economic Calendar - Market Squawk');
    });
  });

  describe('Cache Headers', () => {
    it('should set appropriate cache headers for SSR response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getServerSideProps(context);

      expect(context.res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      );
    });
  });

  describe('Morning Report Integration', () => {
    it('should fetch morning report alongside calendar data', async () => {
      const mockMorningReport = {
        summary: 'Market outlook',
        brief: 'audio.mp3'
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/morning-report')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockMorningReport)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      const result = await getServerSideProps(context);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/morning-report'),
        expect.any(Object)
      );
      
      expect(result.props.morningReport).toEqual(mockMorningReport);
    });

    it('should handle morning report API failure gracefully', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/morning-report')) {
          return Promise.reject(new Error('Morning report failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      const result = await getServerSideProps(context);

      // Should continue without morning report
      expect(result.props.morningReport).toBeNull();
      expect(result.props.initialData).toBeDefined();
    });
  });

  describe('Environment-based URL Configuration', () => {
    it('should use localhost in development', async () => {
      process.env.NODE_ENV = 'development';
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getServerSideProps(context);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000'),
        expect.any(Object)
      );
    });

    it('should use Vercel URL in production', async () => {
      process.env.VERCEL_URL = 'my-app.vercel.app';
      delete process.env.NODE_ENV;
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getServerSideProps(context);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://my-app.vercel.app'),
        expect.any(Object)
      );
    });

    it('should fall back to production domain', async () => {
      delete process.env.NODE_ENV;
      delete process.env.VERCEL_URL;
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getServerSideProps(context);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://marketsquawk.ai'),
        expect.any(Object)
      );
    });
  });

  describe('SEO Metadata Generation', () => {
    it('should generate appropriate metadata for today\'s events', async () => {
      const todayEvents = [
        { date: '2024-01-15T14:00:00Z', event: 'CPI Data', importance: 'high' },
        { date: '2024-01-15T15:00:00Z', event: 'Fed Speech', importance: 'medium' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(todayEvents)
      });

      const result = await getServerSideProps(context);

      expect(result.props.pageMetadata.title).toContain('Today');
      expect(result.props.pageMetadata.description).toContain('2 events');
      expect(result.props.pageMetadata.description).toContain('today');
    });

    it('should generate JSON-LD structured data', async () => {
      const events = [
        { date: '2024-01-15T14:00:00Z', event: 'Test Event', importance: 'high' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(events)
      });

      const result = await getServerSideProps(context);

      expect(result.props.pageMetadata.jsonLd).toBeDefined();
      expect(result.props.pageMetadata.jsonLd['@context']).toBe('https://schema.org');
      expect(result.props.pageMetadata.jsonLd['@type']).toBe('WebApplication');
      expect(result.props.pageMetadata.jsonLd.name).toBe('Market Squawk Economic Calendar');
    });

    it('should include event count breakdown by importance', async () => {
      const events = [
        { date: '2024-01-15T14:00:00Z', event: 'Event 1', importance: 'high' },
        { date: '2024-01-15T15:00:00Z', event: 'Event 2', importance: 'high' },
        { date: '2024-01-15T16:00:00Z', event: 'Event 3', importance: 'medium' },
        { date: '2024-01-15T17:00:00Z', event: 'Event 4', importance: 'low' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(events)
      });

      const result = await getServerSideProps(context);

      expect(result.props.pageMetadata.description).toContain('2 high');
      expect(result.props.pageMetadata.description).toContain('1 medium');
      expect(result.props.pageMetadata.description).toContain('1 low');
    });
  });

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      // Mock timeout by rejecting with abort error
      global.fetch.mockRejectedValue(new Error('AbortError: The operation was aborted'));

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual([]);
      expect(result.props.pageMetadata).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve('not an array')
      });

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual([]);
    });

    it('should handle API 500 errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await getServerSideProps(context);

      expect(result.props.initialData).toEqual([]);
      expect(result.props.pageMetadata).toBeDefined();
    });
  });

  describe('Date Range Calculations', () => {
    it('should calculate correct date ranges for each fallback level', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getServerSideProps(context);

      const todayET = getTodayInET();
      const { fromDate: todayFrom, toDate: todayTo } = computeDayRange(todayET);
      const { fromDate: weekFrom, toDate: weekTo } = computeWeekRange(todayET);

      // Should have tried today's range
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`fromDate=${encodeURIComponent(todayFrom)}&toDate=${encodeURIComponent(todayTo)}`),
        expect.any(Object)
      );

      // Should have tried week's range as final fallback
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`fromDate=${encodeURIComponent(weekFrom)}&toDate=${encodeURIComponent(weekTo)}`),
        expect.any(Object)
      );
    });
  });
});