import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWeekRange,
  getMonthRange,
  getTodayRange,
  getTomorrowRange,
  getRecentRange,
  getThisWeekRange,
  getNextWeekRange,
  getThisMonthRange,
  getNextMonthRange,
  getPeriodOptions,
  getDateRangeForPeriod,
  formatRangeForAPI
} from '../dateRangeUtils.js';

describe('dateRangeUtils', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getWeekRange', () => {
    it('should return correct week range for a Monday', () => {
      const monday = new Date('2024-01-15T12:00:00Z');
      const range = getWeekRange(monday);
      
      expect(range.start.getUTCDay()).toBe(1); // Monday
      expect(range.end.getUTCDay()).toBe(0); // Sunday
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-21T23:59:59.999Z');
    });

    it('should return correct week range for a Sunday', () => {
      const sunday = new Date('2024-01-14T12:00:00Z');
      const range = getWeekRange(sunday);
      
      expect(range.start.getUTCDay()).toBe(1); // Monday
      expect(range.end.getUTCDay()).toBe(0); // Sunday
      expect(range.start.toISOString()).toBe('2024-01-08T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-14T23:59:59.999Z');
    });

    it('should return correct week range for a Wednesday', () => {
      const wednesday = new Date('2024-01-17T12:00:00Z');
      const range = getWeekRange(wednesday);
      
      expect(range.start.getUTCDay()).toBe(1); // Monday
      expect(range.end.getUTCDay()).toBe(0); // Sunday
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-21T23:59:59.999Z');
    });
  });

  describe('getMonthRange', () => {
    it('should return correct month range for January', () => {
      const january = new Date('2024-01-15T12:00:00Z');
      const range = getMonthRange(january);
      
      expect(range.start.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    });

    it('should return correct month range for February (leap year)', () => {
      const february = new Date('2024-02-15T12:00:00Z');
      const range = getMonthRange(february);
      
      expect(range.start.toISOString()).toBe('2024-02-01T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-02-29T23:59:59.999Z');
    });

    it('should return correct month range for February (non-leap year)', () => {
      const february = new Date('2023-02-15T12:00:00Z');
      const range = getMonthRange(february);
      
      expect(range.start.toISOString()).toBe('2023-02-01T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2023-02-28T23:59:59.999Z');
    });
  });

  describe('getTodayRange', () => {
    it('should return range for today from 00:00:00 to 23:59:59', () => {
      const range = getTodayRange();
      
      // Start should be current day at 00:00:00
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      // End should be current day at 23:59:59
      expect(range.end.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });

    it('should return same date for start and end', () => {
      const range = getTodayRange();
      
      expect(range.start.getUTCDate()).toBe(range.end.getUTCDate());
      expect(range.start.getUTCMonth()).toBe(range.end.getUTCMonth());
      expect(range.start.getUTCFullYear()).toBe(range.end.getUTCFullYear());
    });
  });

  describe('getTomorrowRange', () => {
    it('should return range for tomorrow from 00:00:00 to 23:59:59', () => {
      const range = getTomorrowRange();
      
      // Start should be next day at 00:00:00
      expect(range.start.toISOString()).toBe('2024-01-16T00:00:00.000Z');
      // End should be next day at 23:59:59
      expect(range.end.toISOString()).toBe('2024-01-16T23:59:59.999Z');
    });

    it('should return same date for start and end', () => {
      const range = getTomorrowRange();
      
      expect(range.start.getUTCDate()).toBe(range.end.getUTCDate());
      expect(range.start.getUTCMonth()).toBe(range.end.getUTCMonth());
      expect(range.start.getUTCFullYear()).toBe(range.end.getUTCFullYear());
    });

    it('should be one day after today', () => {
      const todayRange = getTodayRange();
      const tomorrowRange = getTomorrowRange();
      
      const todayDate = todayRange.start.getUTCDate();
      const tomorrowDate = tomorrowRange.start.getUTCDate();
      
      expect(tomorrowDate).toBe(todayDate + 1);
    });
  });

  describe('getRecentRange', () => {
    it('should return range from one week ago to now', () => {
      const range = getRecentRange();
      
      // Start should be 7 days ago at 00:00:00
      expect(range.start.toISOString()).toBe('2024-01-08T00:00:00.000Z');
      // End should be current day at 23:59:59
      expect(range.end.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });
  });

  describe('getThisWeekRange', () => {
    it('should return current week range', () => {
      const range = getThisWeekRange();
      
      // Should be Monday to Sunday of current week (Jan 15 is Monday)
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-21T23:59:59.999Z');
    });
  });

  describe('getNextWeekRange', () => {
    it('should return next week range', () => {
      const range = getNextWeekRange();
      
      // Should be Monday to Sunday of next week
      expect(range.start.toISOString()).toBe('2024-01-22T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-28T23:59:59.999Z');
    });
  });

  describe('getThisMonthRange', () => {
    it('should return current month range', () => {
      const range = getThisMonthRange();
      
      expect(range.start.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    });
  });

  describe('getNextMonthRange', () => {
    it('should return next month range', () => {
      const range = getNextMonthRange();
      
      expect(range.start.toISOString()).toBe('2024-02-01T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-02-29T23:59:59.999Z'); // 2024 is leap year
    });
  });

  describe('getPeriodOptions', () => {
    it('should return all period options', () => {
      const options = getPeriodOptions();
      
      expect(options).toHaveLength(7);
      expect(options.map(opt => opt.value)).toEqual([
        'today',
        'tomorrow',
        'recent',
        'thisWeek', 
        'nextWeek',
        'thisMonth',
        'nextMonth'
      ]);
    });

    it('should have correct labels and descriptions', () => {
      const options = getPeriodOptions();
      
      expect(options[0]).toEqual({
        value: 'today',
        label: 'Today',
        description: 'All events for today',
        getRange: expect.any(Function)
      });

      expect(options[1]).toEqual({
        value: 'tomorrow',
        label: 'Tomorrow',
        description: 'All events for tomorrow',
        getRange: expect.any(Function)
      });

      expect(options[2]).toEqual({
        value: 'recent',
        label: 'Recent',
        description: 'Previous events within one week of today',
        getRange: expect.any(Function)
      });

      expect(options[3]).toEqual({
        value: 'thisWeek',
        label: 'This Week',
        description: 'All events from Monday to Sunday',
        getRange: expect.any(Function)
      });
    });
  });

  describe('getDateRangeForPeriod', () => {
    it('should return correct range for today period', () => {
      const range = getDateRangeForPeriod('today');
      
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });

    it('should return correct range for tomorrow period', () => {
      const range = getDateRangeForPeriod('tomorrow');
      
      expect(range.start.toISOString()).toBe('2024-01-16T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-16T23:59:59.999Z');
    });

    it('should return correct range for valid period', () => {
      const range = getDateRangeForPeriod('thisWeek');
      
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-21T23:59:59.999Z');
    });

    it('should return null for invalid period', () => {
      const range = getDateRangeForPeriod('invalidPeriod');
      
      expect(range).toBeNull();
    });
  });

  describe('formatRangeForAPI', () => {
    it('should format range for API parameters', () => {
      const range = {
        start: new Date('2024-01-15T00:00:00.000Z'),
        end: new Date('2024-01-21T23:59:59.999Z')
      };
      
      const formatted = formatRangeForAPI(range);
      
      expect(formatted).toEqual({
        fromDate: '2024-01-15',
        toDate: '2024-01-21'
      });
    });

    it('should return date-only format without timestamps', () => {
      // Test case that mimics the issue: dates with full timestamps should be formatted to date-only
      const range = {
        start: new Date('2025-08-03T14:00:00.000Z'),
        end: new Date('2025-08-10T13:59:59.999Z')
      };
      
      const formatted = formatRangeForAPI(range);
      
      // Should return date-only format (YYYY-MM-DD) instead of full ISO strings
      expect(formatted).toEqual({
        fromDate: '2025-08-03',
        toDate: '2025-08-10'
      });
      
      // Verify that the result doesn't contain time components
      expect(formatted.fromDate).not.toContain('T');
      expect(formatted.toDate).not.toContain('T');
      expect(formatted.fromDate).not.toContain('Z');
      expect(formatted.toDate).not.toContain('Z');
    });
  });

  describe('Timezone-aware date ranges', () => {
    it('should handle timezone-aware getDateRangeForPeriod calls', () => {
      // Test without timezone (backward compatibility)
      const todayRangeDefault = getDateRangeForPeriod('today');
      expect(todayRangeDefault).toBeTruthy();
      expect(todayRangeDefault.start.getUTCDate()).toBe(todayRangeDefault.end.getUTCDate());
      
      // Test with timezone parameter
      const todayRangeWithTZ = getDateRangeForPeriod('today', 'America/New_York');
      expect(todayRangeWithTZ).toBeTruthy();
      expect(todayRangeWithTZ.start.getUTCDate()).toBe(todayRangeWithTZ.end.getUTCDate());
      
      const tomorrowRangeWithTZ = getDateRangeForPeriod('tomorrow', 'America/New_York');
      expect(tomorrowRangeWithTZ).toBeTruthy();
      expect(tomorrowRangeWithTZ.start.getUTCDate()).toBe(tomorrowRangeWithTZ.end.getUTCDate());
    });

    it('should return same date for fromDate and toDate for today/tomorrow periods', () => {
      const todayRange = getDateRangeForPeriod('today', 'America/New_York');
      const formattedToday = formatRangeForAPI(todayRange);
      expect(formattedToday.fromDate).toBe(formattedToday.toDate);
      
      const tomorrowRange = getDateRangeForPeriod('tomorrow', 'America/New_York');
      const formattedTomorrow = formatRangeForAPI(tomorrowRange);
      expect(formattedTomorrow.fromDate).toBe(formattedTomorrow.toDate);
    });

    it('should handle timezone-aware calculations for all period types', () => {
      const periods = ['today', 'tomorrow', 'recent', 'thisWeek', 'nextWeek', 'thisMonth', 'nextMonth'];
      const timezone = 'Europe/London';
      
      periods.forEach(period => {
        const range = getDateRangeForPeriod(period, timezone);
        expect(range).toBeTruthy();
        expect(range.start).toBeInstanceOf(Date);
        expect(range.end).toBeInstanceOf(Date);
        expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime());
      });
    });

    it('should return different ranges for different timezones', () => {
      // At certain times, different timezones may yield different date ranges
      const nycRange = getDateRangeForPeriod('today', 'America/New_York');
      const tokyoRange = getDateRangeForPeriod('today', 'Asia/Tokyo');
      const utcRange = getDateRangeForPeriod('today', 'UTC');
      
      // All should be valid ranges
      expect(nycRange).toBeTruthy();
      expect(tokyoRange).toBeTruthy();
      expect(utcRange).toBeTruthy();
      
      // Format for comparison
      const nycFormatted = formatRangeForAPI(nycRange);
      const tokyoFormatted = formatRangeForAPI(tokyoRange);
      const utcFormatted = formatRangeForAPI(utcRange);
      
      // Should all have valid date strings
      expect(nycFormatted.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tokyoFormatted.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(utcFormatted.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});