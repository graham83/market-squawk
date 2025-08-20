# Serverless Functions - Economic Calendar

This document describes the serverless functions implemented for ISR-like caching and SEO optimization.

## Overview

The application now supports server-side rendering of weekly economic calendar pages via Vercel serverless functions. This provides:

- **Pre-rendered HTML** with embedded JSON-LD structured data for search engines
- **ISR-like caching** with `Cache-Control: s-maxage=600, stale-while-revalidate=59`
- **SEO optimization** with canonical URLs, meta tags, and structured data
- **Crawlable URLs** at `/calendar/week` and `/calendar/week/:start`

## API Endpoints

### `/api/calendar/week`
- **Purpose**: Serverless function that renders weekly calendar HTML
- **Method**: GET
- **Parameters**:
  - `start` (optional): Week start date in YYYY-MM-DD format
- **Response**: Pre-rendered HTML with JSON-LD structured data
- **Caching**: 10 minutes cache, 59 seconds stale-while-revalidate

### Public Routes (via URL Rewrites)

- `/calendar/week` → `/api/calendar/week` (current week)
- `/calendar/week/:start` → `/api/calendar/week?start=:start` (specific week)

## Implementation Details

### File Structure
```
api/
├── utils.js                 # Server-side utilities
├── calendar/
│   └── week.js             # Weekly calendar serverless function
└── __tests__/
    ├── utils.test.js       # Tests for server utilities
    └── serverless.test.js  # Tests for serverless structure
```

### Key Features

#### 1. Week Range Computation
- Uses `computeWeekRange()` to calculate Monday-Sunday week boundaries
- Handles various date input formats (Date objects, ISO strings)
- Consistent with client-side date handling

#### 2. Data Fetching
- Fetches from `https://data-dev.pricesquawk.com/calendar` with date range parameters
- Graceful fallback to empty events array if API fails
- 8-second timeout to prevent hanging requests

#### 3. HTML Generation
- Clean, semantic HTML with embedded CSS
- Responsive design matching the main application
- Proper meta tags for SEO and social sharing

#### 4. JSON-LD Structured Data
- Schema.org Event markup for each economic event
- ItemList container with proper positioning
- Rich metadata including location, organizer, and description

#### 5. Navigation
- Previous/next week links for crawler discovery
- Canonical URLs pointing to dated week pages
- Breadcrumb navigation within the page

## URL Structure

### Canonical URLs
- Current week: `/calendar/week` canonicalizes to `/calendar/week/YYYY-MM-DD`
- Specific week: `/calendar/week/YYYY-MM-DD` (canonical)

### Week Start Dates
- Always uses Monday as the week start
- Dates in YYYY-MM-DD format (ISO 8601)
- Example: `/calendar/week/2024-08-19` for week of August 19-25, 2024

## SEO Features

### Structured Data
- `@type: "ItemList"` containing `@type: "Event"` items
- Complete event metadata with timezone information
- Proper organization and location data

### Meta Tags
- Dynamic titles with week dates
- Descriptive meta descriptions
- Open Graph tags for social sharing
- Canonical links and prev/next relationships

### Sitemap
- `public/sitemap.xml` includes weekly calendar URLs
- Rolling 12-week coverage (4 past + current + 7 future weeks)
- Different update frequencies for past vs. future weeks

## Caching Strategy

### Response Headers
- `Cache-Control: s-maxage=600, stale-while-revalidate=59`
- 10-minute edge cache with 59-second stale serving
- Allows fresh data while maintaining performance

### Vercel Configuration
- URL rewrites in `vercel.json`
- Function timeout set to 30 seconds
- Proper routing for both current and dated week pages

## Testing

### Unit Tests
- Server-side utilities thoroughly tested
- Date range computation validation
- HTML escaping and timezone formatting
- File structure verification

### Manual Testing
- Test URLs: `/calendar/week` and `/calendar/week/2024-08-19`
- Verify HTML output contains proper structured data
- Check caching headers and meta tags
- Validate prev/next navigation links

## Deployment

### Vercel
- Automatic deployment when `vercel.json` is present
- Functions deployed to `/api/` directory
- URL rewrites active for clean URLs

### GitHub Pages (Fallback)
- Client-side application continues to work
- Serverless functions not available but app remains functional
- Build configuration supports both platforms

## Performance

### Cold Start
- Minimal dependencies for fast cold starts
- Pure JavaScript without heavy frameworks
- Optimized for Vercel Edge Runtime

### Response Times
- < 1s for cached responses
- < 3s for fresh data from upstream API
- Graceful degradation if API is slow/unavailable