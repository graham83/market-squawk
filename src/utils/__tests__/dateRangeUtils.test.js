import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWeekRange,
  getMonthRange,
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
      
      expect(range.start.getDay()).toBe(1); // Monday
      expect(range.end.getDay()).toBe(0); // Sunday
      expect(range.start.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-21T23:59:59.999Z');
    });

    it('should return correct week range for a Sunday', () => {
      const sunday = new Date('2024-01-14T12:00:00Z');
      const range = getWeekRange(sunday);
      
      expect(range.start.getDay()).toBe(1); // Monday
      expect(range.end.getDay()).toBe(0); // Sunday
      expect(range.start.toISOString()).toBe('2024-01-08T00:00:00.000Z');
      expect(range.end.toISOString()).toBe('2024-01-14T23:59:59.999Z');
    });

    it('should return correct week range for a Wednesday', () => {
      const wednesday = new Date('2024-01-17T12:00:00Z');
      const range = getWeekRange(wednesday);
      
      expect(range.start.getDay()).toBe(1); // Monday
      expect(range.end.getDay()).toBe(0); // Sunday
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
      
      expect(options).toHaveLength(5);
      expect(options.map(opt => opt.value)).toEqual([
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
        value: 'recent',
        label: 'Recent',
        description: 'Previous events within one week of today',
        getRange: expect.any(Function)
      });

      expect(options[1]).toEqual({
        value: 'thisWeek',
        label: 'This Week',
        description: 'All events from Monday to Sunday',
        getRange: expect.any(Function)
      });
    });
  });

  describe('getDateRangeForPeriod', () => {
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
        fromDate: '2024-01-15T00:00:00.000Z',
        toDate: '2024-01-21T23:59:59.999Z'
      });
    });
  });
});