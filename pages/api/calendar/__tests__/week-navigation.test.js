import { describe, it, expect } from 'vitest';
import { computeWeekRange, linkForWeekOffset, getWeekStartDate } from '../../utils.js';

describe('Week Navigation Endpoints', () => {
  describe('Date-specific week generation', () => {
    it('should compute correct week range for specific start date', () => {
      const testDate = '2024-08-15';
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      expect(fromDate).toBe('2024-08-12');
      expect(toDate).toBe('2024-08-18');
    });

    it('should handle Sunday edge case correctly', () => {
      const testDate = '2024-08-18';
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      expect(fromDate).toBe('2024-08-12');
      expect(toDate).toBe('2024-08-18');
    });

    it('should handle Monday correctly', () => {
      const testDate = '2024-08-12';
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      expect(fromDate).toBe('2024-08-12');
      expect(toDate).toBe('2024-08-18');
    });

    it('should handle mid-week days correctly', () => {
      const testCases = [
        { date: '2024-08-13', expectedFrom: '2024-08-12', expectedTo: '2024-08-18' }, // Tuesday
        { date: '2024-08-14', expectedFrom: '2024-08-12', expectedTo: '2024-08-18' }, // Wednesday
        { date: '2024-08-15', expectedFrom: '2024-08-12', expectedTo: '2024-08-18' }, // Thursday
        { date: '2024-08-16', expectedFrom: '2024-08-12', expectedTo: '2024-08-18' }, // Friday
        { date: '2024-08-17', expectedFrom: '2024-08-12', expectedTo: '2024-08-18' }, // Saturday
      ];

      testCases.forEach(({ date, expectedFrom, expectedTo }) => {
        const { fromDate, toDate } = computeWeekRange(date);
        expect(fromDate).toBe(expectedFrom);
        expect(toDate).toBe(expectedTo);
      });
    });
  });

  describe('Navigation links generation', () => {
    it('should generate correct previous week link', () => {
      const currentWeek = '2024-08-12';
      const prevLink = linkForWeekOffset(currentWeek, -7);
      
      expect(prevLink).toBe('/calendar/week/2024-08-05');
    });

    it('should generate correct next week link', () => {
      const currentWeek = '2024-08-12';
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
      expect(nextLink).toBe('/calendar/week/2024-08-19');
    });

    it('should handle month boundaries correctly', () => {
      const currentWeek = '2024-07-29';
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
      expect(nextLink).toBe('/calendar/week/2024-08-05');
    });

    it('should handle year boundaries correctly', () => {
      const currentWeek = '2024-12-30';
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
      expect(nextLink).toBe('/calendar/week/2025-01-06');
    });

    it('should handle leap year correctly', () => {
      const currentWeek = '2024-02-26';
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
      expect(nextLink).toBe('/calendar/week/2024-03-04');
    });
  });

  describe('Week start date extraction', () => {
    it('should extract correct Monday for any day of week', () => {
      const testCases = [
        { input: '2024-08-12', expected: '2024-08-12' }, // Monday
        { input: '2024-08-13', expected: '2024-08-12' }, // Tuesday
        { input: '2024-08-14', expected: '2024-08-12' }, // Wednesday
        { input: '2024-08-15', expected: '2024-08-12' }, // Thursday
        { input: '2024-08-16', expected: '2024-08-12' }, // Friday
        { input: '2024-08-17', expected: '2024-08-12' }, // Saturday
        { input: '2024-08-18', expected: '2024-08-12' }, // Sunday
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getWeekStartDate(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle dates at month boundaries', () => {
      const testCases = [
        { input: '2024-08-01', expected: '2024-07-29' }, // Thursday Aug 1 -> Monday Jul 29
        { input: '2024-07-31', expected: '2024-07-29' }, // Wednesday Jul 31 -> Monday Jul 29
        { input: '2024-09-01', expected: '2024-08-26' }, // Sunday Sep 1 -> Monday Aug 26
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getWeekStartDate(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle dates at year boundaries', () => {
      const testCases = [
        { input: '2025-01-01', expected: '2024-12-30' }, // Wednesday Jan 1 2025 -> Monday Dec 30 2024
        { input: '2024-12-31', expected: '2024-12-30' }, // Tuesday Dec 31 2024 -> Monday Dec 30 2024
        { input: '2023-12-31', expected: '2023-12-25' }, // Sunday Dec 31 2023 -> Monday Dec 25 2023
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getWeekStartDate(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('URL format compatibility', () => {
    it('should generate URLs compatible with vercel.json routing', () => {
      const weekStart = '2024-08-12';
      const link = linkForWeekOffset(weekStart, 0);
      
      expect(link).toMatch(/^\/calendar\/week\/\d{4}-\d{2}-\d{2}$/);
      expect(link).toBe('/calendar/week/2024-08-12');
    });

    it('should generate links that work with existing rewrite rules', () => {
      const weekStart = '2024-08-12';
      const link = linkForWeekOffset(weekStart, +7);
      
      const dateMatch = link.match(/\/calendar\/week\/(.+)$/);
      expect(dateMatch).toBeTruthy();
      expect(dateMatch[1]).toBe('2024-08-19');
      
      const parsedDate = new Date(dateMatch[1]);
      expect(parsedDate.getTime()).not.toBeNaN();
    });

    it('should generate valid ISO date format in URLs', () => {
      const testDates = [
        '2024-01-01',
        '2024-06-15',
        '2024-12-31',
        '2025-02-28',
      ];

      testDates.forEach(date => {
        const link = linkForWeekOffset(date, 0);
        const match = link.match(/\/calendar\/week\/(\d{4}-\d{2}-\d{2})$/);
        expect(match).toBeTruthy();
        
        const [, extractedDate] = match;
        expect(extractedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        const parsed = new Date(extractedDate);
        expect(parsed.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('Week handler integration', () => {
    it('should export week handler function', async () => {
      const { default: handler } = await import('../week.js');
      expect(typeof handler).toBe('function');
    });

    it('should have correct handler signature for Next.js API', async () => {
      const { default: handler } = await import('../week.js');
      expect(handler.length).toBe(2);
    });
  });
});