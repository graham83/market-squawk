// API endpoint for morning report with caching
export default async function handler(req, res) {
  try {
    const API_BASE = process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com';
    const morningReportUrl = `${API_BASE}/morning_report`;
    
    const response = await fetch(morningReportUrl, {
      headers: { 
        'accept': 'application/json',
        'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
        'referer': 'https://marketsquawk.ai'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Upstream error: ${response.status}`,
        summary: null,
        brief: null 
      });
    }
    
    const data = await response.json();
    
    // Cache for 30 minutes - morning reports update less frequently
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=600');
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Morning report API error:', error);
    
    // Return empty report on error
    return res.status(200).json({
      summary: null,
      brief: null,
      error: error.message
    });
  }
}