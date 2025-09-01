/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Experimental features disabled for stable build
  

  // Configure image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Configure headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Environment variables that should be available to the browser
  env: {
    CALENDAR_API_BASE: process.env.CALENDAR_API_BASE || 'https://data-dev.pricesquawk.com',
  },

  // Rewrites for API routes (matches vercel.json)
  async rewrites() {
    return [
      {
        source: '/calendar/today',
        destination: '/api/calendar/today',
      },
      {
        source: '/calendar/week',
        destination: '/api/calendar/week',
      },
      {
        source: '/calendar/week/:start',
        destination: '/api/calendar/week?start=:start',
      },
    ];
  },
};

module.exports = nextConfig;