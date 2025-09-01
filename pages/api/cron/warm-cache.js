// API endpoint for warming up the cache via Vercel Cron
// This endpoint will be called automatically by Vercel's cron scheduler

import { getTodayInET, computeDayRange, computeWeekRange } from '../../../lib/utils.js';

export default async function handler(req, res) {
  // Verify this is a cron job request (optional security)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://marketsquawk.ai';

  try {
    // Get current date in ET
    const todayET = getTodayInET();
    const tomorrowET = new Date(new Date(todayET).getTime() + 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    // Warm up today's calendar
    const { fromDate: todayFrom, toDate: todayTo } = computeDayRange(todayET);
    const todayUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(todayFrom)}&toDate=${encodeURIComponent(todayTo)}`;
    
    try {
      const todayResponse = await fetch(todayUrl, {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      results.push({
        endpoint: 'calendar/today',
        status: todayResponse.status,
        cached: todayResponse.headers.get('x-vercel-cache') || 'unknown'
      });
    } catch (error) {
      results.push({
        endpoint: 'calendar/today',
        status: 'error',
        error: error.message
      });
    }

    // Warm up tomorrow's calendar
    const { fromDate: tomorrowFrom, toDate: tomorrowTo } = computeDayRange(tomorrowET);
    const tomorrowUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(tomorrowFrom)}&toDate=${encodeURIComponent(tomorrowTo)}`;
    
    try {
      const tomorrowResponse = await fetch(tomorrowUrl, {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      results.push({
        endpoint: 'calendar/tomorrow',
        status: tomorrowResponse.status,
        cached: tomorrowResponse.headers.get('x-vercel-cache') || 'unknown'
      });
    } catch (error) {
      results.push({
        endpoint: 'calendar/tomorrow',
        status: 'error',
        error: error.message
      });
    }

    // Warm up this week's calendar
    const { fromDate: weekFrom, toDate: weekTo } = computeWeekRange(todayET);
    const weekUrl = `${baseUrl}/api/calendar?fromDate=${encodeURIComponent(weekFrom)}&toDate=${encodeURIComponent(weekTo)}`;
    
    try {
      const weekResponse = await fetch(weekUrl, {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      results.push({
        endpoint: 'calendar/week',
        status: weekResponse.status,
        cached: weekResponse.headers.get('x-vercel-cache') || 'unknown'
      });
    } catch (error) {
      results.push({
        endpoint: 'calendar/week',
        status: 'error',
        error: error.message
      });
    }

    // Warm up morning report
    const morningReportUrl = `${baseUrl}/api/morning-report`;
    
    try {
      const morningResponse = await fetch(morningReportUrl, {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      results.push({
        endpoint: 'morning-report',
        status: morningResponse.status,
        cached: morningResponse.headers.get('x-vercel-cache') || 'unknown'
      });
    } catch (error) {
      results.push({
        endpoint: 'morning-report',
        status: 'error',
        error: error.message
      });
    }

    // Warm up main pages (SSR cache)
    const pagesToWarm = [
      '/',
      '/calendar/today',
      '/calendar/week'
    ];

    for (const page of pagesToWarm) {
      try {
        const pageResponse = await fetch(`${baseUrl}${page}`, {
          headers: { 'accept': 'text/html' },
          signal: AbortSignal.timeout(8000)
        });
        results.push({
          endpoint: `page:${page}`,
          status: pageResponse.status,
          cached: pageResponse.headers.get('x-vercel-cache') || 'unknown'
        });
      } catch (error) {
        results.push({
          endpoint: `page:${page}`,
          status: 'error',
          error: error.message
        });
      }
    }

    // Log results for monitoring
    console.log('Cache warming completed:', JSON.stringify(results, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Cache warmed successfully',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Cache warming failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      results
    });
  }
}