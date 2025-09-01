import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeWeekRange, getWeekStartDate, linkForWeekOffset, escapeHtml, formatTimeET } from '../utils.js';

describe('API Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
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
      const range = computeWeekRange('2024-01-17');
      
      expect(range.fromDate).toBe('2024-01-15');
      expect(range.toDate).toBe('2024-01-21');
    });

    it('should throw error for invalid dates', () => {
      expect(() => computeWeekRange('invalid-date')).toThrow('Invalid date provided');
    });

    it('should handle different days of the week correctly', () => {
      const testCases = [
        { date: '2024-01-15', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Monday
        { date: '2024-01-16', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Tuesday
        { date: '2024-01-17', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Wednesday
        { date: '2024-01-18', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Thursday
        { date: '2024-01-19', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Friday
        { date: '2024-01-20', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Saturday
        { date: '2024-01-21', expectedFrom: '2024-01-15', expectedTo: '2024-01-21' }, // Sunday
      ];

      testCases.forEach(({ date, expectedFrom, expectedTo }) => {
        const range = computeWeekRange(date);
        expect(range.fromDate).toBe(expectedFrom);
        expect(range.toDate).toBe(expectedTo);
      });
    });
  });

  describe('getWeekStartDate', () => {
    it('should return Monday date for any day of week', () => {
      expect(getWeekStartDate('2024-01-15')).toBe('2024-01-15'); // Monday
      expect(getWeekStartDate('2024-01-17')).toBe('2024-01-15'); // Wednesday -> Monday
      expect(getWeekStartDate('2024-01-21')).toBe('2024-01-15'); // Sunday -> Monday
    });

    it('should handle month boundaries', () => {
      expect(getWeekStartDate('2024-02-01')).toBe('2024-01-29'); // Thursday Feb 1 -> Monday Jan 29
      expect(getWeekStartDate('2024-01-31')).toBe('2024-01-29'); // Wednesday Jan 31 -> Monday Jan 29
    });

    it('should handle year boundaries', () => {
      expect(getWeekStartDate('2024-01-01')).toBe('2024-01-01'); // Monday Jan 1
      expect(getWeekStartDate('2023-12-31')).toBe('2023-12-25'); // Sunday Dec 31 -> Monday Dec 25
    });
  });

  describe('linkForWeekOffset', () => {
    it('should generate correct previous week link', () => {
      const link = linkForWeekOffset('2024-01-15', -7);
      expect(link).toBe('/calendar/week/2024-01-08');
    });

    it('should generate correct next week link', () => {
      const link = linkForWeekOffset('2024-01-15', 7);
      expect(link).toBe('/calendar/week/2024-01-22');
    });

    it('should handle current week (no offset)', () => {
      const link = linkForWeekOffset('2024-01-15', 0);
      expect(link).toBe('/calendar/week/2024-01-15');
    });

    it('should handle multiple week offsets', () => {
      expect(linkForWeekOffset('2024-01-15', -14)).toBe('/calendar/week/2024-01-01');
      expect(linkForWeekOffset('2024-01-15', 14)).toBe('/calendar/week/2024-01-29');
      expect(linkForWeekOffset('2024-01-15', 21)).toBe('/calendar/week/2024-02-05');
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

    it('should escape all special characters', () => {
      const input = '& < > " \'';
      const expected = '&amp; &lt; &gt; &quot; &#39;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle normal text without changes', () => {
      const normalText = 'This is normal text with numbers 123 and symbols !@#$%^*()';
      expect(escapeHtml(normalText)).toBe(normalText);
    });
  });

  describe('formatTimeET', () => {
    it('should format time in ET timezone', () => {
      const result = formatTimeET('2024-01-15T14:30:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle different ISO date formats', () => {
      const result1 = formatTimeET('2024-01-15T09:00:00.000Z');
      const result2 = formatTimeET('2024-01-15T21:30:00Z');
      
      expect(result1).toMatch(/^\d{2}:\d{2}$/);
      expect(result2).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should correctly convert UTC to ET', () => {
      const testCases = [
        { utc: '2024-01-15T05:00:00Z', expected: '00:00' }, // 5 AM UTC = Midnight ET (EST)
        { utc: '2024-01-15T17:00:00Z', expected: '12:00' }, // 5 PM UTC = Noon ET (EST)
        { utc: '2024-07-15T04:00:00Z', expected: '00:00' }, // 4 AM UTC = Midnight ET (EDT)
        { utc: '2024-07-15T16:00:00Z', expected: '12:00' }, // 4 PM UTC = Noon ET (EDT)
      ];

      testCases.forEach(({ utc, expected }) => {
        const result = formatTimeET(utc);
        expect(result).toBe(expected);
      });
    });
  });
});