import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import { 
  fetchMorningReport, 
  extractCommentaryUrl, 
  getCommentaryUrl 
} from '../marketCommentaryService';

// Mock the API module
vi.mock('../api');

describe('Market Commentary Service', () => {
  const mockMorningReportData = {
    "summary": "Good morning. Key market-moving events kick off with high importance at eight-thirty AM Eastern, including the July producer price index and initial jobless claims. At ten-thirty AM Eastern, keep watch for the E-I-A natural gas storage data, followed by Treasury auctions at eleven AM. Later in the session, the Fed's H.4.1 report drops at four-thirty PM Eastern. You can configure alerts for all these events in your Dashboard's Alerts Widget. Next major data release is set for eight-thirty AM Eastern.",
    "calendar": [
      {
        "date": "2025-08-14T08:30:00",
        "event": "Producer Price Index - July",
        "country": "USA",
        "importance": "HIGH",
        "source": {
          "name": "Bureau of Labor Statistics",
          "url": "https://www.bls.gov/schedule/news_release/jolts.htm"
        }
      },
      {
        "date": "2025-08-14T08:30:00",
        "event": "Initial Jobless Claims",
        "country": "USA",
        "importance": "HIGH",
        "source": {
          "name": "Department of Labor",
          "url": "https://www.dol.gov/ui/data.pdf"
        }
      },
      {
        "date": "2025-08-14T10:30:00",
        "event": "EIA Weekly Natural Gas Storage Report",
        "country": "USA",
        "importance": "MEDIUM",
        "source": {
          "name": "Energy Information Administration",
          "url": "https://www.eia.gov/"
        }
      },
      {
        "date": "2025-08-14T11:00:00",
        "event": "Treasury Bill Auction (4-Week)",
        "country": "USA",
        "importance": "MEDIUM",
        "source": {
          "name": "U.S. Treasury",
          "url": "https://www.treasury.gov/resource-center/data-chart-center/tic/Pages/ticsec.aspx"
        }
      },
      {
        "date": "2025-08-14T11:00:00",
        "event": "Treasury Bill Auction (8-Week)",
        "country": "USA",
        "importance": "MEDIUM",
        "source": {
          "name": "U.S. Treasury",
          "url": "https://www.treasury.gov/resource-center/data-chart-center/tic/Pages/ticsec.aspx"
        }
      },
      {
        "date": "2025-08-14T16:30:00",
        "event": "H.4.1 - Factors Affecting Reserve Balances",
        "country": "USA",
        "importance": "LOW",
        "source": {
          "name": "Federal Reserve",
          "url": "https://www.federalreserve.gov/newsevents/calendar.htm"
        }
      }
    ],
    "brief": "https://data-dev.pricesquawk.com/20250814_0020.mp3"
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMorningReport', () => {
    it('should fetch morning report data successfully', async () => {
      // Arrange
      const mockResponse = { data: mockMorningReportData };
      api.get.mockResolvedValue(mockResponse);

      // Act
      const result = await fetchMorningReport();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/morning_report');
      expect(result).toEqual(mockMorningReportData);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(fetchMorningReport()).rejects.toThrow('Unable to fetch market commentary');
    });

    it('should log the original error', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      // Act
      try {
        await fetchMorningReport();
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch morning report:', mockError);
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('extractCommentaryUrl', () => {
    it('should extract valid MP3 URL from morning report data', () => {
      // Act
      const result = extractCommentaryUrl(mockMorningReportData);

      // Assert
      expect(result).toBe('https://data-dev.pricesquawk.com/20250814_0020.mp3');
    });

    it('should return null for missing brief field', () => {
      // Arrange
      const dataWithoutBrief = { ...mockMorningReportData };
      delete dataWithoutBrief.brief;

      // Act
      const result = extractCommentaryUrl(dataWithoutBrief);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-MP3 brief field', () => {
      // Arrange
      const dataWithInvalidBrief = {
        ...mockMorningReportData,
        brief: 'https://example.com/not-an-mp3.wav'
      };

      // Act
      const result = extractCommentaryUrl(dataWithInvalidBrief);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-string brief field', () => {
      // Arrange
      const dataWithInvalidBrief = {
        ...mockMorningReportData,
        brief: 123
      };

      // Act
      const result = extractCommentaryUrl(dataWithInvalidBrief);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      // Act & Assert
      expect(extractCommentaryUrl(null)).toBeNull();
      expect(extractCommentaryUrl(undefined)).toBeNull();
    });

    it('should accept MP3 URLs with different formats', () => {
      // Arrange
      const testCases = [
        'https://example.com/file.mp3',
        'http://test.com/audio.MP3',
        'https://cdn.example.com/path/to/file.mp3?param=value'
      ];

      testCases.forEach(mp3Url => {
        const data = { ...mockMorningReportData, brief: mp3Url };
        
        // Act
        const result = extractCommentaryUrl(data);
        
        // Assert
        expect(result).toBe(mp3Url);
      });
    });
  });

  describe('getCommentaryUrl', () => {
    it('should fetch and extract commentary URL successfully', async () => {
      // Arrange
      const mockResponse = { data: mockMorningReportData };
      api.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getCommentaryUrl();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/morning_report');
      expect(result).toBe('https://data-dev.pricesquawk.com/20250814_0020.mp3');
    });

    it('should return null when API call fails', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('API Error');
      api.get.mockRejectedValue(mockError);

      // Act
      const result = await getCommentaryUrl();

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch morning report:', mockError);
      
      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should return null when brief field is missing', async () => {
      // Arrange
      const dataWithoutBrief = { ...mockMorningReportData };
      delete dataWithoutBrief.brief;
      const mockResponse = { data: dataWithoutBrief };
      api.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getCommentaryUrl();

      // Assert
      expect(result).toBeNull();
    });
  });
});