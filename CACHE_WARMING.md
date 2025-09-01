# Cache Warming Strategies for Market Squawk AI

## Current Implementation

### 1. **Vercel Cron Jobs** (Active)
Located at `/api/cron/warm-cache`, this endpoint is configured to run every 5 minutes via `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/warm-cache",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }
]
```

The cron job pre-fetches:
- Today's calendar events
- Tomorrow's calendar events  
- This week's calendar events
- Morning report
- Main pages (/, /calendar/today, /calendar/week)

### 2. **Cache Headers**
All API endpoints use cache headers with `stale-while-revalidate`:

- **Calendar API**: 10-minute cache (`s-maxage=600, stale-while-revalidate=59`)
- **Morning Report**: 30-minute cache (`s-maxage=1800, stale-while-revalidate=600`)
- **SSR Pages**: 5-minute cache (`s-maxage=300, stale-while-revalidate=600`)

### 3. **Benefits of Current Setup**

1. **Always Fresh Cache**: Cron runs every 5 minutes, keeping cache warm before it expires
2. **Zero Cold Starts**: Users always hit warm cache, never wait for upstream API
3. **Graceful Degradation**: `stale-while-revalidate` serves stale content while fetching fresh data
4. **Reduced Upstream Load**: Upstream API only called by cron job, not by users

## Alternative Strategies

### Option 1: More Aggressive Cron Schedule
For critical times (market open/close), you could use multiple cron entries:

```json
"crons": [
  {
    "path": "/api/cron/warm-cache",
    "schedule": "*/5 6-10 * * 1-5"  // Every 5 min, 6am-10am ET, weekdays
  },
  {
    "path": "/api/cron/warm-cache",
    "schedule": "*/15 10-16 * * 1-5"  // Every 15 min during market hours
  },
  {
    "path": "/api/cron/warm-cache",
    "schedule": "0 */1 * * 0,6"  // Hourly on weekends
  }
]
```

### Option 2: ISR (Incremental Static Regeneration)
Convert pages to use `getStaticProps` with revalidation:

```javascript
export async function getStaticProps() {
  // ... fetch data ...
  return {
    props: { data },
    revalidate: 300  // Regenerate every 5 minutes
  }
}
```

### Option 3: Edge Middleware Pre-warming
Use Vercel Edge Middleware to trigger cache warming on specific conditions:

```javascript
// middleware.js
export function middleware(request) {
  // Warm cache if approaching expiration
  const cacheAge = request.headers.get('age');
  if (cacheAge && parseInt(cacheAge) > 540) {  // 9 minutes old
    fetch('/api/cron/warm-cache', { method: 'POST' });
  }
}
```

### Option 4: Manual Cache Warming Button
Add an admin endpoint to manually trigger cache warming:

```javascript
// pages/api/admin/warm-cache.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify admin authentication
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Trigger cache warming
  const warmResult = await fetch('/api/cron/warm-cache');
  return res.json(await warmResult.json());
}
```

## Monitoring Cache Performance

### Check Cache Status
You can monitor cache performance using Vercel's headers:

- `x-vercel-cache`: Shows `HIT`, `MISS`, `STALE`, or `BYPASS`
- `age`: Shows how old the cached response is (in seconds)
- `x-vercel-id`: Unique ID for tracking requests

### Vercel Analytics
Enable Vercel Analytics to track:
- Cache hit rates
- Response times
- Geographic distribution of cache hits

## Environment Variables

Add to `.env.production`:

```env
# Optional: Secure cron endpoint
CRON_SECRET=your-secret-key-here

# Optional: Admin token for manual warming
ADMIN_TOKEN=your-admin-token-here
```

## Testing Cache Warming

### Local Testing
```bash
# Test cache warming endpoint
curl http://localhost:3000/api/cron/warm-cache

# Check cache headers
curl -I http://localhost:3000/api/calendar
```

### Production Testing
```bash
# Check cache status
curl -I https://marketsquawk.ai/api/calendar | grep x-vercel-cache

# Monitor cron execution in Vercel dashboard
# Go to: https://vercel.com/[your-team]/[your-project]/functions
```

## Best Practices

1. **Don't Over-warm**: Balance between fresh data and API costs
2. **Monitor Upstream Health**: Add error handling for upstream failures
3. **Use Appropriate TTLs**: Shorter for volatile data, longer for stable data
4. **Implement Fallbacks**: Always have stale data as backup
5. **Track Metrics**: Monitor cache hit rates and response times

## Troubleshooting

### Cache Not Warming
- Check Vercel Functions logs for cron execution
- Verify `CRON_SECRET` if configured
- Ensure cron schedule syntax is correct

### High Cache Miss Rate
- Increase cron frequency
- Extend cache TTL
- Check if cache keys are consistent

### Upstream API Errors
- Implement retry logic in warm-cache endpoint
- Use longer `stale-while-revalidate` values
- Consider caching error responses briefly