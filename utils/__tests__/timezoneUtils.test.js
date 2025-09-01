import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  formatDateInTimezone, 
  getStoredTimezone, 
  storeTimezone, 
  isValidTimezone,
  getCurrentTimeInCalendarTimezone,
  DEFAULT_TIMEZONE,
  TIMEZONE_STORAGE_KEY,
  CALENDAR_TIMEZONE
} from '../../utils/timezoneUtils';

describe('TimezoneUtils', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  let originalLocalStorage;

  beforeEach(() => {
    // Store original localStorage
    originalLocalStorage = window.localStorage;
    
    // Replace localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    
    // Clear mock calls
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    });
  });

  describe('formatDateInTimezone', () => {
    it('should format EIA event correctly in UTC', () => {
      const eiaDate = '2025-07-02T14:30:00.000Z';
      const result = formatDateInTimezone(eiaDate, 'UTC');
      
      expect(result.time).toContain('2:30');
      expect(result.time).toContain('PM');
      expect(result.time).toContain('UTC');
    });

    it('should handle API date format without Z suffix as UTC', () => {
      // Test the exact case from the bug report
      const apiDate = '2025-08-07T12:30:00'; // No Z suffix - this is the bug!
      const result = formatDateInTimezone(apiDate, 'UTC');
      
      // Should show 12:30 PM UTC, not be affected by local timezone
      expect(result.time).toContain('12:30');
      expect(result.time).toContain('PM');
      expect(result.time).toContain('UTC');
    });

    it('should convert API date format to Eastern Time correctly', () => {
      // Test the exact case from the bug report
      const apiDate = '2025-08-07T12:30:00'; // No Z suffix 
      const result = formatDateInTimezone(apiDate, 'America/New_York');
      
      // 12:30 PM UTC should be 8:30 AM EDT in August
      expect(result.time).toContain('8:30');
      expect(result.time).toContain('AM');
    });

    it('should still handle dates with Z suffix correctly', () => {
      // Ensure existing behavior with Z suffix still works
      const utcDate = '2025-08-07T12:30:00Z';
      const resultUTC = formatDateInTimezone(utcDate, 'UTC');
      const resultET = formatDateInTimezone(utcDate, 'America/New_York');
      
      expect(resultUTC.time).toContain('12:30');
      expect(resultUTC.time).toContain('PM');
      expect(resultUTC.time).toContain('UTC');
      
      expect(resultET.time).toContain('8:30');
      expect(resultET.time).toContain('AM');
    });

    it('should format EIA event correctly in Eastern Time', () => {
      const eiaDate = '2025-07-02T14:30:00.000Z';
      const result = formatDateInTimezone(eiaDate, 'America/New_York');
      
      expect(result.time).toContain('10:30');
      expect(result.time).toContain('AM');
    });

    it('should format date correctly in UTC', () => {
      const eiaDate = '2025-07-02T14:30:00.000Z';
      const result = formatDateInTimezone(eiaDate, 'UTC');
      
      expect(result.date).toContain('Jul');
      expect(result.date).toContain('2');
      expect(result.date).toContain('Wed');
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDateInTimezone('invalid-date', 'UTC');
      
      expect(result.date).toBe('Invalid Date');
      expect(result.time).toBe('Invalid Time');
      expect(result.datetime).toBe('Invalid DateTime');
    });
  });

  describe('localStorage integration', () => {
    it('should store timezone in localStorage', () => {
      storeTimezone('America/New_York');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TIMEZONE_STORAGE_KEY,
        'America/New_York'
      );
    });

    it('should retrieve timezone from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('America/New_York');
      
      const result = getStoredTimezone();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(TIMEZONE_STORAGE_KEY);
      expect(result).toBe('America/New_York');
    });

    it('should return default timezone when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = getStoredTimezone();
      
      expect(result).toBe(DEFAULT_TIMEZONE);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const result = getStoredTimezone();
      
      expect(result).toBe(DEFAULT_TIMEZONE);
    });
  });

  describe('timezone validation', () => {
    it('should validate supported timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('should reject unsupported timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
    });
  });

  describe('calendar timezone functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should have calendar timezone set to Eastern Time', () => {
      expect(CALENDAR_TIMEZONE).toBe('America/New_York');
    });

    it('should convert current time to calendar timezone correctly', () => {
      // Mock a specific time - Wednesday Aug 13, 2025 at 8pm Sydney time (10:00 UTC)
      const mockTime = new Date('2025-08-13T10:00:00.000Z');
      vi.setSystemTime(mockTime);

      // Mock toLocaleString to simulate Eastern Time conversion
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // When it's 10:00 UTC (8pm Sydney), it's 6:00am Eastern
          return '2025-08-13, 06:00:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const calendarTime = getCurrentTimeInCalendarTimezone();
      
      // The returned time should represent 6am Eastern as UTC
      expect(calendarTime).toBeInstanceOf(Date);
      expect(calendarTime.getUTCFullYear()).toBe(2025);
      expect(calendarTime.getUTCMonth()).toBe(7); // August (0-indexed)
      expect(calendarTime.getUTCDate()).toBe(13);
      expect(calendarTime.getUTCHours()).toBe(6);
      expect(calendarTime.getUTCMinutes()).toBe(0);
    });

    it('should handle DST correctly in calendar timezone', () => {
      // Mock a time during DST (July when EDT is active)
      const mockSummerTime = new Date('2025-07-15T14:00:00.000Z');
      vi.setSystemTime(mockSummerTime);

      // Mock toLocaleString for EDT
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // During DST, UTC-4 offset, so 14:00 UTC = 10:00 EDT
          return '2025-07-15, 10:00:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const calendarTime = getCurrentTimeInCalendarTimezone();
      
      expect(calendarTime.getUTCFullYear()).toBe(2025);
      expect(calendarTime.getUTCMonth()).toBe(6); // July (0-indexed)
      expect(calendarTime.getUTCDate()).toBe(15);
      expect(calendarTime.getUTCHours()).toBe(10);
    });

    it('should handle standard time correctly in calendar timezone', () => {
      // Mock a time during standard time (December when EST is active)
      const mockWinterTime = new Date('2025-12-15T15:00:00.000Z');
      vi.setSystemTime(mockWinterTime);

      // Mock toLocaleString for EST
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // During standard time, UTC-5 offset, so 15:00 UTC = 10:00 EST
          return '2025-12-15, 10:00:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const calendarTime = getCurrentTimeInCalendarTimezone();
      
      expect(calendarTime.getUTCFullYear()).toBe(2025);
      expect(calendarTime.getUTCMonth()).toBe(11); // December (0-indexed)
      expect(calendarTime.getUTCDate()).toBe(15);
      expect(calendarTime.getUTCHours()).toBe(10);
    });

    it('should handle midnight crossovers correctly', () => {
      // Mock Tuesday 11:30pm Pacific Time which is Wednesday 2:30am Eastern
      const mockLateNight = new Date('2025-08-13T06:30:00.000Z');
      vi.setSystemTime(mockLateNight);

      // Mock toLocaleString for Eastern Time
      const originalToLocaleString = Date.prototype.toLocaleString;
      vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function(locale, options) {
        if (options?.timeZone === 'America/New_York') {
          // It's already Wednesday in Eastern Time
          return '2025-08-13, 02:30:00';
        }
        return originalToLocaleString.call(this, locale, options);
      });

      const calendarTime = getCurrentTimeInCalendarTimezone();
      
      // Should correctly show Wednesday in Eastern Time
      expect(calendarTime.getUTCDate()).toBe(13); // Wednesday
      expect(calendarTime.getUTCHours()).toBe(2);
      expect(calendarTime.getUTCMinutes()).toBe(30);
    });
  });
});