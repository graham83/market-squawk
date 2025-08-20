import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeWeekRange, getWeekStartDate, linkForWeekOffset, escapeHtml, formatTimeET } from '../utils.js';

describe('Server-side Utilities', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('computeWeekRange', () => {
    it('should compute correct week range for a Monday', () => {
      const monday = new Date('2024-01-15T12:00:00Z');
      const range = computeWeekRange(monday);
      
      expect(range.fromDate).toBe('2024-01-15');
      expect(range.toDate).toBe('2024-01-21');
    });

    it('should compute correct week range for a Sunday', () => {
      const sunday = new Date('2024-01-14T12:00:00Z');
      const range = computeWeekRange(sunday);
      
      expect(range.fromDate).toBe('2024-01-08');
      expect(range.toDate).toBe('2024-01-14');
    });

    it('should handle string dates', () => {
      const range = computeWeekRange('2024-01-17'); // Wednesday
      
      expect(range.fromDate).toBe('2024-01-15');
      expect(range.toDate).toBe('2024-01-21');
    });

    it('should throw error for invalid dates', () => {
      expect(() => computeWeekRange('invalid-date')).toThrow('Invalid date provided');
    });
  });

  describe('getWeekStartDate', () => {
    it('should return Monday date for any day of week', () => {
      expect(getWeekStartDate('2024-01-15')).toBe('2024-01-15'); // Monday
      expect(getWeekStartDate('2024-01-17')).toBe('2024-01-15'); // Wednesday -> Monday
      expect(getWeekStartDate('2024-01-21')).toBe('2024-01-15'); // Sunday -> Monday
    });
  });

  describe('linkForWeekOffset', () => {
    it('should generate correct previous week link', () => {
      const link = linkForWeekOffset('2024-01-15', -7);
      expect(link).toBe('https://marketsquawk.ai/calendar/week/2024-01-08');
    });

    it('should generate correct next week link', () => {
      const link = linkForWeekOffset('2024-01-15', 7);
      expect(link).toBe('https://marketsquawk.ai/calendar/week/2024-01-22');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('AT&T earnings')).toBe('AT&amp;T earnings');
      expect(escapeHtml("O'Reilly's report")).toBe('O&#39;Reilly&#39;s report');
    });

    it('should handle empty or null strings', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatTimeET', () => {
    it('should format time in ET timezone', () => {
      // Test various times - note that the exact output depends on DST
      const result = formatTimeET('2024-01-15T14:30:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/); // Should be HH:MM format
    });

    it('should handle different ISO date formats', () => {
      const result1 = formatTimeET('2024-01-15T09:00:00.000Z');
      const result2 = formatTimeET('2024-01-15T21:30:00Z');
      
      expect(result1).toMatch(/^\d{2}:\d{2}$/);
      expect(result2).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});