import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../pages/api/morning-report.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Morning Report API Endpoint', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock request and response objects
    req = {
      method: 'GET',
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Set default environment variable
    process.env.CALENDAR_API_BASE = 'https://data-dev.pricesquawk.com';
  });

  afterEach(() => {
    delete process.env.CALENDAR_API_BASE;
  });

  it('should export a default handler function', () => {
    expect(typeof handler).toBe('function');
  });

  it('should have correct function signature', () => {
    expect(handler.length).toBe(2);
  });

  it('should fetch morning report from upstream API', async () => {
    const mockReport = {
      summary: 'Markets are expected to open higher today',
      brief: 'https://example.com/audio-brief.mp3'
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReport)
    });

    await handler(req, res);

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data-dev.pricesquawk.com/morning_report',
      expect.objectContaining({
        headers: expect.objectContaining({
          'accept': 'application/json',
          'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
          'referer': 'https://marketsquawk.ai'
        }),
        signal: expect.any(AbortSignal)
      })
    );

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockReport);
  });

  it('should set appropriate cache headers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ summary: 'Test', brief: null })
    });

    await handler(req, res);

    // Morning reports cache for 30 minutes
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      's-maxage=1800, stale-while-revalidate=600'
    );
  });

  it('should handle upstream API errors gracefully', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Upstream error: 503',
      summary: null,
      brief: null
    });
  });

  it('should handle network errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'));

    await handler(req, res);

    // Returns 200 with empty data on error
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      summary: null,
      brief: null,
      error: 'Network failure'
    });
  });

  it('should handle timeout correctly', async () => {
    // Mock a timeout/abort scenario
    global.fetch.mockRejectedValue(new Error('AbortError: The operation was aborted'));

    await handler(req, res);

    // Should handle timeout error gracefully
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: null,
        brief: null
      })
    );
  });

  it('should use custom API base URL from environment', async () => {
    process.env.CALENDAR_API_BASE = 'https://custom-api.example.com';
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ summary: 'Test' })
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/morning_report',
      expect.any(Object)
    );
  });

  it('should use default API base URL when environment variable not set', async () => {
    delete process.env.CALENDAR_API_BASE;
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ summary: 'Test' })
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://data-dev.pricesquawk.com/morning_report',
      expect.any(Object)
    );
  });

  it('should pass through complete morning report data', async () => {
    const mockReport = {
      summary: 'Detailed market analysis for today',
      brief: 'https://example.com/brief-2024-01-15.mp3',
      additionalField: 'Extra data',
      metadata: {
        generated: '2024-01-15T05:00:00Z',
        author: 'Market Analysis Team'
      }
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReport)
    });

    await handler(req, res);

    // Should pass through all fields from upstream
    expect(res.json).toHaveBeenCalledWith(mockReport);
  });

  it('should handle empty morning report', async () => {
    const emptyReport = {
      summary: null,
      brief: null
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyReport)
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(emptyReport);
  });

  it('should handle morning report with only summary', async () => {
    const summaryOnlyReport = {
      summary: 'Markets closed for holiday',
      brief: null
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(summaryOnlyReport)
    });

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(summaryOnlyReport);
  });

  it('should handle morning report with only audio brief', async () => {
    const audioOnlyReport = {
      summary: null,
      brief: 'https://example.com/audio-only.mp3'
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(audioOnlyReport)
    });

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(audioOnlyReport);
  });
});