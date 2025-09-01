// JSON API: /api/calendar
// Proxies economic calendar data from upstream and supports optional filtering.
import { computeWeekRange } from '../../../lib/utils.js';

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    let { fromDate, toDate } = q;

    const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isYmd(fromDate)) fromDate = undefined;
    if (!isYmd(toDate)) toDate = undefined;

    // Default to the current week if dates are missing
    if (!fromDate && !toDate) {
      const r = computeWeekRange(new Date());
      fromDate = r.fromDate;
      toDate = r.toDate;
    } else if (!fromDate && toDate) {
      const r = computeWeekRange(toDate);
      fromDate = r.fromDate;
      // keep provided toDate if valid; else use computed
      toDate = toDate || r.toDate;
    } else if (fromDate && !toDate) {
      const r = computeWeekRange(fromDate);
      // keep provided fromDate if valid; else use computed
      fromDate = fromDate || r.fromDate;
      toDate = r.toDate;
    }

    const API_BASE = process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com';
    const url = `${API_BASE}/calendar?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;

    const upstream = await fetch(url, {
      headers: { 
        'accept': 'application/json',
        'user-agent': 'Market-Squawk-Calendar/1.0 (+https://marketsquawk.ai)',
        'referer': 'https://marketsquawk.ai'
      },
      // Node 18+ supports AbortSignal.timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error: ${upstream.status}` });
    }

    const data = await upstream.json();
    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'Invalid upstream response' });
    }

    // Optional lightweight server-side filtering
    const { importance, country, category } = q;
    let result = data;
    if (importance) {
      const val = String(importance).toLowerCase();
      result = result.filter((ev) => (ev.importance || '').toLowerCase() === val);
    }
    if (country) {
      const val = String(country).toLowerCase();
      result = result.filter((ev) => (ev.country || '').toLowerCase() === val);
    }
    if (category) {
      const val = String(category).toLowerCase();
      result = result.filter((ev) => (ev.category || '').toLowerCase() === val);
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=59');
    return res.status(200).json(result);
  } catch (e) {
    console.error('Calendar API error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
