import { computeDayRange, getTodayInET, escapeHtml, formatTimeET, formatDateET } from '../utils.js';

/**
 * Vercel Serverless Function for Daily Economic Calendar
 * Returns pre-rendered HTML with JSON-LD structured data for SEO
 * Shows today's market briefing with cached morning report and events
 */
export default async function handler(req, res) {
  try {
    // Get current date in Eastern Time (trading timezone)
    const todayET = getTodayInET();
    const { fromDate, toDate } = computeDayRange(todayET);
    
    const API_BASE = process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com';
    
    // Fetch today's calendar events
    const calendarUrl = `${API_BASE}/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    let events = [];
    
    // Fetch morning report (with date-based caching)
    const morningReportUrl = `${API_BASE}/morning_report`;
    let morningReport = null;
    
    try {
      // Fetch calendar events and morning report in parallel
      const [calendarResponse, morningReportResponse] = await Promise.allSettled([
        fetch(calendarUrl, {
          headers: { 
            'accept': 'application/json',
            'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
            'referer': 'https://marketsquawk.ai'
          },
          signal: AbortSignal.timeout(8000)
        }),
        fetch(morningReportUrl, {
          headers: { 
            'accept': 'application/json',
            'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
            'referer': 'https://marketsquawk.ai'
          },
          signal: AbortSignal.timeout(8000)
        })
      ]);
      
      // Process calendar events
      if (calendarResponse.status === 'fulfilled' && calendarResponse.value.ok) {
        const calendarData = await calendarResponse.value.json();
        events = Array.isArray(calendarData) ? calendarData : [];
      } else {
        console.error('Calendar API failed:', calendarResponse.reason || 'Unknown error');
      }
      
      // Process morning report
      if (morningReportResponse.status === 'fulfilled' && morningReportResponse.value.ok) {
        morningReport = await morningReportResponse.value.json();
      } else {
        console.error('Morning report API failed:', morningReportResponse.reason || 'Unknown error');
      }
      
    } catch (apiError) {
      console.error('API fetch failed:', apiError.message);
      // Continue with empty data - page will still render
    }
    
    // Sort events by time
    const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Build events table rows
    const eventRows = sortedEvents.map((ev, i) => {
      const eventDate = new Date(ev.date);
      const timeET = formatTimeET(ev.date);
      const eventName = escapeHtml(ev.event || 'Economic Event');
      const country = escapeHtml(ev.country || 'Unknown');
      const importance = escapeHtml(ev.importance || 'low');
      const sourceName = escapeHtml(ev.source?.name || 'Unknown');
      const sourceUrl = ev.source?.url || '#';
      
      return `<tr>
        <td class="px-4 py-2 border-b border-gray-200 font-mono">${timeET} ET</td>
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
    
    // Extract morning report content
    const morningReportSummary = morningReport?.summary || '';
    const morningReportBrief = morningReport?.brief || '';
    const hasAudioBrief = morningReportBrief && typeof morningReportBrief === 'string' && 
                         morningReportBrief.toLowerCase().includes('.mp3');
    
    // Format date for display
    const todayFormatted = formatDateET(todayET + 'T12:00:00Z');
    
    // JSON-LD: ItemList of Events
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Market Briefing — ${todayFormatted}`,
      "description": `Daily market briefing with economic calendar and morning report for ${todayFormatted}`,
      "itemListElement": sortedEvents.map((ev, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Event",
          "@id": `https://marketsquawk.ai/calendar/today#event-${idx}`,
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
          "keywords": ev.tags ? ev.tags.join(', ') : 'economic calendar, market events, trading'
        }
      }))
    };
    
    // Set response headers with caching
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache for 10 minutes (600 seconds), allow stale content while revalidating
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=59');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Generate canonical URL
    const canonical = 'https://marketsquawk.ai/calendar/today';
    
    // Render HTML response
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Market Briefing — ${todayFormatted}</title>
  <link rel="canonical" href="${canonical}"/>
  <meta name="description" content="Daily market briefing for ${todayFormatted} with morning report and economic calendar. Track ${sortedEvents.length} scheduled events with AI-powered market analysis."/>
  <meta name="keywords" content="market briefing, economic calendar, morning report, trading schedule, financial events"/>
  <meta property="og:title" content="Market Briefing — ${todayFormatted}"/>
  <meta property="og:description" content="Daily market briefing with ${sortedEvents.length} economic events and morning market analysis."/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${canonical}"/>
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    h1 { margin: 0; padding: 20px; background: #1e293b; color: white; font-size: 1.5rem; }
    h2 { margin: 20px 0 15px 0; padding: 0 20px; color: #374151; font-size: 1.25rem; }
    .morning-report { padding: 0 20px 20px 20px; }
    .morning-report p { color: #4b5563; margin: 15px 0; }
    .audio-briefing { padding: 0 20px 20px 20px; background: #f1f5f9; border-left: 4px solid #3b82f6; margin: 20px; border-radius: 4px; }
    .audio-briefing a { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .audio-briefing a:hover { text-decoration: underline; }
    .events-schedule { padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:hover { background: #f9fafb; }
    .importance-high { color: #dc2626; font-weight: 600; }
    .importance-medium { color: #f59e0b; font-weight: 500; }
    .importance-low { color: #10b981; }
    .events-count { padding: 15px 20px; color: #6b7280; font-size: 0.9rem; }
    .navigation { padding: 20px; text-align: center; background: #f1f5f9; border-top: 1px solid #e5e7eb; }
    .navigation a { color: #3b82f6; text-decoration: none; margin: 0 15px; }
    .navigation a:hover { text-decoration: underline; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 0.85rem; border-top: 1px solid #f3f4f6; }
    .no-content { text-align: center; padding: 40px; color: #6b7280; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Market Briefing — ${todayFormatted}</h1>
    
    ${morningReportSummary ? `
    <section class="morning-report">
      <h2>Morning Market Summary</h2>
      <p>${escapeHtml(morningReportSummary)}</p>
    </section>
    ` : ''}
    
    ${hasAudioBrief ? `
    <div class="audio-briefing">
      🎧 <a href="${escapeHtml(morningReportBrief)}" target="_blank" rel="noopener noreferrer">Listen to Morning Brief</a>
    </div>
    ` : ''}
    
    <section class="events-schedule">
      <h2>Today's Economic Calendar</h2>
      <div class="events-count">
        ${sortedEvents.length} economic events scheduled for today
      </div>
      
      ${sortedEvents.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Time (ET)</th>
            <th>Event</th>
            <th>Country</th>
            <th>Importance</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          ${eventRows}
        </tbody>
      </table>
      ` : `
      <div class="no-content">
        No economic events scheduled for today
      </div>
      `}
    </section>
    
    <nav class="navigation">
      <a href="/calendar/week">View Weekly Calendar</a>
      <span>|</span>
      <a href="/">Back to Market Squawk</a>
    </nav>
    
    <div class="footer">
      Market Briefing powered by Market Squawk • Data updated every 10 minutes
    </div>
  </div>
</body>
</html>`;
    
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Daily calendar function error:', error);
    
    // Return a basic error page
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(`<!doctype html>
<html>
<head>
  <title>Market Briefing - Temporarily Unavailable</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="font-family: sans-serif; padding: 20px; text-align: center;">
  <h1>Market Briefing Temporarily Unavailable</h1>
  <p>We're experiencing technical difficulties. Please try again in a few minutes.</p>
  <p><a href="/calendar/week">← View Weekly Calendar</a></p>
</body>
</html>`);
  }
}