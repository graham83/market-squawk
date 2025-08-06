import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  IMPORTANCE_LEVELS,
  DEFAULT_IMPORTANCE,
  IMPORTANCE_STORAGE_KEY,
  getStoredImportance,
  storeImportance,
  isValidImportance,
  getImportanceConfig,
  filterEventsByImportance
} from '../importanceUtils';

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('ImportanceUtils', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct default importance', () => {
      expect(DEFAULT_IMPORTANCE).toBe('all');
    });

    it('should have correct storage key', () => {
      expect(IMPORTANCE_STORAGE_KEY).toBe('economicCalendar_selectedImportance');
    });

    it('should have all required importance levels', () => {
      expect(IMPORTANCE_LEVELS).toHaveLength(4);
      expect(IMPORTANCE_LEVELS.map(level => level.value)).toEqual(['all', 'low', 'medium', 'high']);
    });
  });

  describe('getStoredImportance', () => {
    it('should return stored importance when available', () => {
      mockLocalStorage.store[IMPORTANCE_STORAGE_KEY] = 'high';
      expect(getStoredImportance()).toBe('high');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(IMPORTANCE_STORAGE_KEY);
    });

    it('should return default importance when nothing stored', () => {
      expect(getStoredImportance()).toBe(DEFAULT_IMPORTANCE);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(getStoredImportance()).toBe(DEFAULT_IMPORTANCE);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to read importance from localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('storeImportance', () => {
    it('should store importance in localStorage', () => {
      storeImportance('medium');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(IMPORTANCE_STORAGE_KEY, 'medium');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      storeImportance('high');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to store importance in localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('isValidImportance', () => {
    it('should validate correct importance levels', () => {
      expect(isValidImportance('all')).toBe(true);
      expect(isValidImportance('low')).toBe(true);
      expect(isValidImportance('medium')).toBe(true);
      expect(isValidImportance('high')).toBe(true);
    });

    it('should reject invalid importance levels', () => {
      expect(isValidImportance('invalid')).toBe(false);
      expect(isValidImportance('')).toBe(false);
      expect(isValidImportance(null)).toBe(false);
      expect(isValidImportance(undefined)).toBe(false);
    });
  });

  describe('getImportanceConfig', () => {
    it('should return config for valid importance', () => {
      const config = getImportanceConfig('high');
      expect(config).toEqual({
        value: 'high',
        label: 'High Importance',
        color: 'red'
      });
    });

    it('should return null for invalid importance', () => {
      expect(getImportanceConfig('invalid')).toBeNull();
    });
  });

  describe('filterEventsByImportance', () => {
    const mockEvents = [
      { id: 1, event: 'Event 1', importance: 'low' },
      { id: 2, event: 'Event 2', importance: 'medium' },
      { id: 3, event: 'Event 3', importance: 'high' },
      { id: 4, event: 'Event 4', importance: 'medium' }
    ];

    it('should return all events when importance is "all"', () => {
      expect(filterEventsByImportance(mockEvents, 'all')).toEqual(mockEvents);
    });

    it('should filter events by importance level', () => {
      const highEvents = filterEventsByImportance(mockEvents, 'high');
      expect(highEvents).toHaveLength(1);
      expect(highEvents[0].importance).toBe('high');

      const mediumEvents = filterEventsByImportance(mockEvents, 'medium');
      expect(mediumEvents).toHaveLength(2);
      expect(mediumEvents.every(event => event.importance === 'medium')).toBe(true);
    });

    it('should handle empty events array', () => {
      expect(filterEventsByImportance([], 'high')).toEqual([]);
    });

    it('should handle null/undefined events', () => {
      expect(filterEventsByImportance(null, 'high')).toEqual([]);
      expect(filterEventsByImportance(undefined, 'high')).toEqual([]);
    });

    it('should handle invalid importance by returning all events', () => {
      expect(filterEventsByImportance(mockEvents, '')).toEqual(mockEvents);
      expect(filterEventsByImportance(mockEvents, null)).toEqual(mockEvents);
    });
  });
});