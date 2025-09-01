import React from 'react';
import Head from 'next/head';
import EconomicCalendar from '../components/features/EconomicCalendar';
import { getTodayInET, computeDayRange, computeWeekRange, escapeHtml, formatDateET } from '../lib/utils.js';

export default function HomePage({ initialData, pageMetadata }) {
  return (
    <>
      <Head>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content="economic calendar, market events, financial calendar, economic indicators, market analysis, trading schedule" />
        
        <link rel="canonical" href="https://marketsquawk.ai/" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://marketsquawk.ai/" />
        <meta property="og:site_name" content="Market Squawk" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageMetadata.title} />
        <meta name="twitter:description" content={pageMetadata.description} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(pageMetadata.jsonLd)
          }}
        />
      </Head>
      
      <EconomicCalendar initialData={initialData} />
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  try {
    // Set cache headers for the SSR response
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    
    // Get current date in Eastern Time
    const todayET = getTodayInET();
    const tomorrowET = new Date(new Date(todayET).getTime() + 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    // For Vercel preview deployments, we need to fetch directly from external API
    // because preview deployments have authentication that blocks internal requests
    const isVercelPreview = process.env.VERCEL && process.env.VERCEL_ENV === 'preview';
    const EXTERNAL_API_BASE = process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com';
    
    // Determine base URL for different environments
    let baseUrl, apiPath;
    if (isVercelPreview) {
      // Preview deployments: use external API directly
      baseUrl = EXTERNAL_API_BASE;
      apiPath = '/calendar';
    } else if (process.env.VERCEL_URL) {
      // Production Vercel: use internal API with full URL
      baseUrl = `https://${process.env.VERCEL_URL}`;
      apiPath = '/api/calendar';
    } else if (process.env.NODE_ENV === 'development') {
      // Local development
      const host = req.headers.host || 'localhost:3000';
      baseUrl = `http://${host}`;
      apiPath = '/api/calendar';
    } else {
      // Fallback
      baseUrl = 'https://marketsquawk.ai';
      apiPath = '/api/calendar';
    }
    
    // Log for debugging in production
    console.log('[SSR] Is Vercel Preview:', isVercelPreview);
    console.log('[SSR] Base URL:', baseUrl);
    console.log('[SSR] API Path:', apiPath);
    console.log('[SSR] Today ET:', todayET);
    
    let events = [];
    let morningReport = null;
    let dataSource = '';
    
    // Smart fallback strategy: today → tomorrow → week
    
    // Try 1: Today's events
    try {
      const { fromDate, toDate } = computeDayRange(todayET);
      const todayUrl = `${baseUrl}${apiPath}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
      
      console.log('[SSR] Fetching today:', todayUrl);
      
      const response = await fetch(todayUrl, {
        headers: { 
          'accept': 'application/json',
          'user-agent': 'Market-Squawk-SSR/1.0'
        },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const todayEvents = Array.isArray(data) ? data : [];
        
        console.log('[SSR] Today events count:', todayEvents.length);
        
        if (todayEvents.length > 0) {
          events = todayEvents;
          dataSource = 'today';
        }
      } else {
        console.warn('[SSR] Today API response not ok:', response.status);
      }
    } catch (error) {
      console.warn('[SSR] Today API failed:', error.message);
    }
    
    // Try 2: Tomorrow's events (if today has no events)
    if (events.length === 0) {
      try {
        const { fromDate, toDate } = computeDayRange(tomorrowET);
        const tomorrowUrl = `${baseUrl}${apiPath}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        
        console.log('[SSR] Fetching tomorrow:', tomorrowUrl);
        
        const response = await fetch(tomorrowUrl, {
          headers: { 
            'accept': 'application/json',
            'user-agent': 'Market-Squawk-SSR/1.0'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const tomorrowEvents = Array.isArray(data) ? data : [];
          
          console.log('[SSR] Tomorrow events count:', tomorrowEvents.length);
          
          if (tomorrowEvents.length > 0) {
            events = tomorrowEvents;
            dataSource = 'tomorrow';
          }
        } else {
          console.warn('[SSR] Tomorrow API response not ok:', response.status);
        }
      } catch (error) {
        console.warn('[SSR] Tomorrow API failed:', error.message);
      }
    }
    
    // Try 3: This week's events (final fallback)
    if (events.length === 0) {
      try {
        const { fromDate, toDate } = computeWeekRange(todayET);
        const weekUrl = `${baseUrl}${apiPath}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        
        const response = await fetch(weekUrl, {
          headers: { 
            'accept': 'application/json',
            'user-agent': 'Market-Squawk-SSR/1.0'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          events = Array.isArray(data) ? data : [];
          if (events.length > 0) {
            dataSource = 'week';
          }
        }
      } catch (error) {
        console.warn('Week API failed:', error.message);
      }
    }
    
    // Try to fetch morning report (using our cached API)
    try {
      const morningReportUrl = `${baseUrl}/api/morning-report`;
      const response = await fetch(morningReportUrl, {
        headers: { 
          'accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        morningReport = await response.json();
      }
    } catch (error) {
      console.warn('Morning report API failed:', error.message);
    }
    
    // Sort events by date
    const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Generate page metadata
    const todayFormatted = formatDateET(todayET + 'T12:00:00Z');
    const eventCount = sortedEvents.length;
    
    let title, description;
    
    switch (dataSource) {
      case 'today':
        title = `Economic Calendar — ${todayFormatted}`;
        description = `Today's economic calendar with ${eventCount} market events and economic indicators. Real-time market analysis and trading insights.`;
        break;
      case 'tomorrow':
        const tomorrowFormatted = formatDateET(tomorrowET + 'T12:00:00Z');
        title = `Economic Calendar — ${tomorrowFormatted}`;
        description = `Tomorrow's economic calendar with ${eventCount} scheduled market events. Advance market analysis and trading preparation.`;
        break;
      case 'week':
        title = `Economic Calendar — Week of ${todayFormatted}`;
        description = `Weekly economic calendar with ${eventCount} market events and economic indicators. Complete trading week analysis.`;
        break;
      default:
        title = `Economic Calendar — Market Squawk`;
        description = `Economic calendar with market events, financial indicators, and AI-powered market analysis for traders and investors.`;
    }
    
    // JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "description": description,
      "url": "https://marketsquawk.ai/",
      "provider": {
        "@type": "Organization",
        "name": "Market Squawk",
        "url": "https://marketsquawk.ai"
      },
      "itemListElement": sortedEvents.slice(0, 20).map((ev, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Event",
          "@id": `https://marketsquawk.ai/#event-${idx}`,
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
    
    return {
      props: {
        initialData: {
          events: sortedEvents,
          morningReport,
          dataSource,
          lastUpdated: new Date().toISOString()
        },
        pageMetadata: {
          title,
          description,
          jsonLd
        }
      }
    };
    
  } catch (error) {
    console.error('SSR data fetch failed:', error);
    
    // Return minimal fallback data
    const todayFormatted = formatDateET(getTodayInET() + 'T12:00:00Z');
    
    return {
      props: {
        initialData: {
          events: [],
          morningReport: null,
          dataSource: 'fallback',
          lastUpdated: new Date().toISOString()
        },
        pageMetadata: {
          title: `Economic Calendar — ${todayFormatted}`,
          description: 'Economic calendar with market events and financial indicators. Real-time market analysis for traders and investors.',
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Economic Calendar",
            "description": "Economic calendar with market events and financial indicators",
            "url": "https://marketsquawk.ai/"
          }
        }
      }
    };
  }
}