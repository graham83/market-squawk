import { describe, it, expect, vi } from 'vitest';

describe('Serverless Function Structure', () => {
  it('should have the correct file structure for Vercel deployment', async () => {
    // Test that the serverless function file exists and can be imported
    const fs = await import('fs');
    const path = await import('path');
    
    // Check that the api directory structure exists
    const apiDir = path.resolve(process.cwd(), 'api');
    const calendarDir = path.resolve(apiDir, 'calendar');
    const weekFile = path.resolve(calendarDir, 'week.js');
    const utilsFile = path.resolve(apiDir, 'utils.js');
    
    expect(fs.existsSync(apiDir)).toBe(true);
    expect(fs.existsSync(calendarDir)).toBe(true);
    expect(fs.existsSync(weekFile)).toBe(true);
    expect(fs.existsSync(utilsFile)).toBe(true);
  });

  it('should have vercel.json configuration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);
    
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    expect(config.rewrites).toBeDefined();
    expect(config.rewrites).toEqual([
      { "source": "/calendar/week", "destination": "/api/calendar/week" },
      { "source": "/calendar/week/:start", "destination": "/api/calendar/week?start=:start" }
    ]);
  });

  it('should export a default function from the serverless handler', async () => {
    // Note: We can't fully test the handler without a mock HTTP environment
    // but we can verify the file structure is correct
    const { default: handler } = await import('../calendar/week.js');
    expect(typeof handler).toBe('function');
  });

  it('should have sitemap.xml for SEO', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemapContent).toContain('/calendar/week');
  });
});