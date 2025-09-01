import { computeWeekRange, linkForWeekOffset, escapeHtml, formatTimeET } from '../../../lib/utils.js';

/**
 * Vercel Serverless Function for Weekly Economic Calendar
 * Returns pre-rendered HTML with JSON-LD structured data for SEO
 */
export default async function handler(req, res) {
  try {
    const { start } = req.query; // optional ISO date (YYYY-MM-DD)
    
    // Determine the week start date
    let startDate;
    if (start) {
      // Validate the provided start date
      const parsedDate = new Date(start);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD.' });
      }
      startDate = parsedDate;
    } else {
      // Default to current week
      startDate = new Date();
    }
    
    // Compute week range
    const { fromDate, toDate } = computeWeekRange(startDate);
    
    // Fetch events directly from upstream API
    const API_BASE = process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com';
    const apiUrl = `${API_BASE}/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    
    let events = [];
    try {
      const response = await fetch(apiUrl, {
        headers: { 
          'accept': 'application/json',
          'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
          'referer': 'https://marketsquawk.ai'
        },
        // Add timeout
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        throw new Error(`Upstream API error: ${response.status}`);
      }
      
      const data = await response.json();
      events = Array.isArray(data) ? data : [];
    } catch (apiError) {
      console.error('API fetch failed:', apiError.message);
      // Return empty events array if API fails, but still render the page
      events = [];
    }
    
    // Build table rows
    const rows = events.map((ev, i) => {
      const eventDate = new Date(ev.date);
      const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
      const timeET = formatTimeET(ev.date);
      const eventName = escapeHtml(ev.event || 'Unknown Event');
      const country = escapeHtml(ev.country || 'Unknown');
      const importance = escapeHtml(ev.importance || 'low');
      const sourceName = escapeHtml(ev.source?.name || 'Unknown');
      const sourceUrl = ev.source?.url || '#';
      
      return `<tr>
        <td class="px-4 py-2 border-b border-gray-200">${dayName}</td>
        <td class="px-4 py-2 border-b border-gray-200">${timeET} ET</td>
        <td class="px-4 py-2 border-b border-gray-200">${eventName}</td>
        <td class="px-4 py-2 border-b border-gray-200">${country}</td>
        <td class="px-4 py-2 border-b border-gray-200">
          <span class="importance-${importance.toLowerCase()}">${importance}</span>
        </td>
        <td class="px-4 py-2 border-b border-gray-200">
          <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800">${sourceName}</a>
        </td>
      </tr>`;
    }).join('');
    
    // JSON-LD: ItemList of Events
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Economic Calendar - Week of ${fromDate}`,
      "description": "Weekly economic calendar with market events and announcements",
      "itemListElement": events.map((ev, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Event",
          "@id": `https://marketsquawk.ai/calendar/week/${fromDate}#event-${idx}`,
          "name": ev.event || 'Economic Event',
          "startDate": new Date(ev.date).toISOString(),
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
          "location": { 
            "@type": "Place", 
            "name": ev.country || 'Global',
            "address": {
              "@type": "PostalAddress",
              "addressCountry": ev.country || 'Global'
            }
          },
          "organizer": { 
            "@type": "Organization", 
            "name": ev.source?.name || 'Economic Authority',
            "url": ev.source?.url || ''
          },
          "description": `${ev.importance || 'Medium'} importance economic event`,
          "keywords": ev.tags ? ev.tags.join(', ') : 'economic calendar, market events'
        }
      }))
    };
    
    // Set response headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=59');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Generate navigation URLs
    const canonical = `https://marketsquawk.ai/calendar/week/${fromDate}`;
    const prev = linkForWeekOffset(fromDate, -7);
    const next = linkForWeekOffset(fromDate, +7);
    
    // Format the week display
    const weekStartFormatted = new Date(fromDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const weekEndFormatted = new Date(toDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Render HTML response
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Economic Calendar — Week of ${weekStartFormatted}</title>
  <link rel="canonical" href="${canonical}"/>
  <link rel="prev" href="${prev}"/>
  <link rel="next" href="${next}"/>
  <meta name="description" content="Weekly economic calendar for ${weekStartFormatted} to ${weekEndFormatted}. Track major economic events, market announcements, and financial indicators with AI-powered market analysis."/>
  <meta name="keywords" content="economic calendar, market events, financial calendar, economic indicators, market analysis"/>
  <meta property="og:title" content="Economic Calendar — Week of ${weekStartFormatted}"/>
  <meta property="og:description" content="Weekly economic calendar with ${events.length} events for market analysis and trading insights."/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${canonical}"/>
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    h1 { margin: 0; padding: 20px; background: #1e293b; color: white; font-size: 1.5rem; }
    nav { padding: 15px 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
    nav a { color: #3b82f6; text-decoration: none; margin: 0 10px; }
    nav a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:hover { background: #f9fafb; }
    .importance-high { color: #dc2626; font-weight: 600; }
    .importance-medium { color: #f59e0b; font-weight: 500; }
    .importance-low { color: #10b981; }
    .events-count { padding: 15px 20px; color: #6b7280; font-size: 0.9rem; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 0.85rem; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Economic Calendar — Week of ${weekStartFormatted}</h1>
    <nav>
      <a href="${prev}">← Previous week</a>
      <span>|</span>
      <a href="/calendar/week">Current week</a>
      <span>|</span>
      <a href="${next}">Next week →</a>
    </nav>
    <div class="events-count">
      ${events.length} economic events scheduled for ${weekStartFormatted} to ${weekEndFormatted}
    </div>
    <table>
      <thead>
        <tr>
          <th>Day</th>
          <th>Time (ET)</th>
          <th>Event</th>
          <th>Country</th>
          <th>Importance</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">No events scheduled for this week</td></tr>'}
      </tbody>
    </table>
    <div class="footer">
      Economic Calendar powered by Market Squawk • Data updated every 10 minutes
    </div>
  </div>
</body>
</html>`;
    
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return a basic error page
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(`<!doctype html>
<html>
<head>
  <title>Economic Calendar - Error</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="font-family: sans-serif; padding: 20px; text-align: center;">
  <h1>Economic Calendar Temporarily Unavailable</h1>
  <p>We're experiencing technical difficulties. Please try again in a few minutes.</p>
  <p><a href="/calendar/week">← Return to current week</a></p>
</body>
</html>`);
  }
}