import { computeWeekRange, linkForWeekOffset, getWeekStartDate } from '../utils.js';

describe('Week Navigation Endpoints', () => {
  describe('Date-specific week generation', () => {
    it('should compute correct week range for specific start date', () => {
      const testDate = '2024-08-15'; // Thursday
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      // Should start from Monday of that week
      expect(fromDate).toBe('2024-08-12'); // Monday
      expect(toDate).toBe('2024-08-18');   // Sunday
    });

    it('should handle Sunday edge case correctly', () => {
      const testDate = '2024-08-18'; // Sunday
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      // Sunday should be part of the week starting the previous Monday
      expect(fromDate).toBe('2024-08-12'); // Previous Monday
      expect(toDate).toBe('2024-08-18');   // Same Sunday
    });

    it('should handle Monday correctly', () => {
      const testDate = '2024-08-12'; // Monday
      const { fromDate, toDate } = computeWeekRange(testDate);
      
      // Monday should be the start of its own week
      expect(fromDate).toBe('2024-08-12'); // Same Monday
      expect(toDate).toBe('2024-08-18');   // Following Sunday
    });
  });

  describe('Navigation links generation', () => {
    it('should generate correct previous week link', () => {
      const currentWeek = '2024-08-12'; // Monday
      const prevLink = linkForWeekOffset(currentWeek, -7);
      
      expect(prevLink).toBe('/calendar/week/2024-08-05');
    });

    it('should generate correct next week link', () => {
      const currentWeek = '2024-08-12'; // Monday
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
      expect(nextLink).toBe('/calendar/week/2024-08-19');
    });

    it('should handle month boundaries correctly', () => {
      const currentWeek = '2024-07-29'; // Monday, near month end
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
  expect(nextLink).toBe('/calendar/week/2024-08-05');
    });

    it('should handle year boundaries correctly', () => {
      const currentWeek = '2024-12-30'; // Monday, near year end
      const nextLink = linkForWeekOffset(currentWeek, +7);
      
  expect(nextLink).toBe('/calendar/week/2025-01-06');
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
  });

  describe('URL format compatibility', () => {
    it('should generate URLs compatible with vercel.json routing', () => {
      // Test that generated URLs match the expected format for vercel routing
      const weekStart = '2024-08-12';
      const link = linkForWeekOffset(weekStart, 0);
      
      // Should match pattern /calendar/week/:start where :start is YYYY-MM-DD
  expect(link).toMatch(/^\/calendar\/week\/\d{4}-\d{2}-\d{2}$/);
  expect(link).toBe('/calendar/week/2024-08-12');
    });

    it('should generate links that work with existing rewrite rules', () => {
      // Verify the format matches what vercel.json expects
      // { "source": "/calendar/week/:start", "destination": "/api/calendar/week?start=:start" }
      const weekStart = '2024-08-12';
      const link = linkForWeekOffset(weekStart, +7);
      
      // Extract the date part that would be passed as :start parameter
      const dateMatch = link.match(/\/calendar\/week\/(.+)$/);
      expect(dateMatch).toBeTruthy();
      expect(dateMatch[1]).toBe('2024-08-19');
      
      // Verify it's a valid date format
      const parsedDate = new Date(dateMatch[1]);
      expect(parsedDate.getTime()).not.toBeNaN();
    });
  });
});