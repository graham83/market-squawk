import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../today.js';
import { getTodayInET, computeDayRange, formatDateET } from '../../utils.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Today Calendar API Endpoint', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    
    // Mock request and response objects
    req = {
      method: 'GET',
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Set default environment variable
    process.env.CALENDAR_API_BASE = 'https://data-dev.pricesquawk.com';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.CALENDAR_API_BASE;
  });

  it('should export a default handler function', () => {
    expect(typeof handler).toBe('function');
  });

  it('should have correct function signature', () => {
    expect(handler.length).toBe(2);
  });

  it('should fetch calendar events and morning report in parallel', async () => {
    const mockEvents = [
      {
        date: '2024-01-15T14:30:00Z',
        event: 'Consumer Price Index',
        country: 'USA',
        importance: 'high',
        source: { name: 'BLS', url: 'https://bls.gov' }
      }
    ];
    
    const mockMorningReport = {
      summary: 'Market outlook positive',
      brief: 'audio-brief.mp3'
    };

    // Mock successful API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/calendar')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents)
        });
      }
      if (url.includes('/morning_report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMorningReport)
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await handler(req, res);

    // Verify parallel fetching
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // Verify calendar API call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/calendar?fromDate='),
      expect.objectContaining({
        headers: expect.objectContaining({
          'accept': 'application/json',
          'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)'
        }),
        signal: expect.any(AbortSignal)
      })
    );
    
    // Verify morning report API call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/morning_report'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'accept': 'application/json'
        })
      })
    );

    // Verify response contains HTML
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    expect(res.send).toHaveBeenCalled();
  });

  it('should handle API failures gracefully', async () => {
    // Mock failed API responses
    global.fetch.mockRejectedValue(new Error('Network error'));

    await handler(req, res);

    // Should still return HTML response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
    
    const htmlResponse = res.send.mock.calls[0][0];
    expect(htmlResponse).toContain('<!doctype html>');
    expect(htmlResponse).toContain('Market');
  });

  it('should include proper cache headers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      's-maxage=600, stale-while-revalidate=59'
    );
  });

  it('should generate proper date range for today', async () => {
    const todayET = getTodayInET();
    const { fromDate, toDate } = computeDayRange(todayET);
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    await handler(req, res);

    // Verify the calendar API was called with today's date range
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`fromDate=${encodeURIComponent(fromDate)}`),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`toDate=${encodeURIComponent(toDate)}`),
      expect.any(Object)
    );
  });

  it('should include JSON-LD structured data', async () => {
    const mockEvents = [
      {
        date: '2024-01-15T14:30:00Z',
        event: 'CPI Data',
        country: 'USA',
        importance: 'high',
        source: { name: 'BLS', url: 'https://bls.gov' }
      }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEvents)
    });

    await handler(req, res);

    const htmlResponse = res.send.mock.calls[0][0];
    
    // Check for JSON-LD script tag
    expect(htmlResponse).toContain('<script type="application/ld+json">');
    expect(htmlResponse).toContain('"@context": "https://schema.org"');
    expect(htmlResponse).toContain('"@type": "ItemList"');
  });

  it('should handle morning report with audio brief', async () => {
    const mockMorningReport = {
      summary: 'Markets expected to open higher',
      brief: 'https://example.com/brief-2024-01-15.mp3'
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/morning_report')) {
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

    await handler(req, res);

    const htmlResponse = res.send.mock.calls[0][0];
    
    // Should include morning report summary
    expect(htmlResponse).toContain('Markets expected to open higher');
    
    // Should include link to audio brief (not audio player)
    expect(htmlResponse).toContain('Listen to Morning Brief');
    expect(htmlResponse).toContain('.mp3');
  });

  it('should sort events by time', async () => {
    const mockEvents = [
      {
        date: '2024-01-15T16:00:00Z',
        event: 'Event 2',
        country: 'USA',
        importance: 'medium'
      },
      {
        date: '2024-01-15T14:00:00Z',
        event: 'Event 1',
        country: 'USA',
        importance: 'high'
      },
      {
        date: '2024-01-15T18:00:00Z',
        event: 'Event 3',
        country: 'USA',
        importance: 'low'
      }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEvents)
    });

    await handler(req, res);

    const htmlResponse = res.send.mock.calls[0][0];
    
    // Events should appear in chronological order
    const event1Index = htmlResponse.indexOf('Event 1');
    const event2Index = htmlResponse.indexOf('Event 2');
    const event3Index = htmlResponse.indexOf('Event 3');
    
    expect(event1Index).toBeLessThan(event2Index);
    expect(event2Index).toBeLessThan(event3Index);
  });

  it('should escape HTML in event data', async () => {
    const mockEvents = [
      {
        date: '2024-01-15T14:00:00Z',
        event: '<script>alert("XSS")</script>',
        country: 'USA & Canada',
        importance: 'high',
        source: { name: "O'Reilly's", url: 'https://example.com' }
      }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEvents)
    });

    await handler(req, res);

    const htmlResponse = res.send.mock.calls[0][0];
    
    // Should escape dangerous HTML
    expect(htmlResponse).not.toContain('<script>alert("XSS")</script>');
    expect(htmlResponse).toContain('&lt;script&gt;');
    expect(htmlResponse).toContain('USA &amp; Canada');
    expect(htmlResponse).toContain('O&#39;Reilly&#39;s');
  });
});