import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  formatDateInTimezone, 
  getStoredTimezone, 
  storeTimezone, 
  isValidTimezone,
  DEFAULT_TIMEZONE,
  TIMEZONE_STORAGE_KEY
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
});