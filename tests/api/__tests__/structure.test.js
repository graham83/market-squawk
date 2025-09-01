import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Next.js API Structure', () => {
  it('should have the correct file structure for Vercel deployment', () => {
    const pagesDir = path.resolve(process.cwd(), 'pages');
    const apiDir = path.resolve(pagesDir, 'api');
    const calendarDir = path.resolve(apiDir, 'calendar');
    const weekFile = path.resolve(calendarDir, 'week.js');
    const todayFile = path.resolve(calendarDir, 'today.js');
    const indexFile = path.resolve(calendarDir, 'index.js');
    const utilsFile = path.resolve(apiDir, 'utils.js');
    
    expect(fs.existsSync(pagesDir)).toBe(true);
    expect(fs.existsSync(apiDir)).toBe(true);
    expect(fs.existsSync(calendarDir)).toBe(true);
    expect(fs.existsSync(weekFile)).toBe(true);
    expect(fs.existsSync(todayFile)).toBe(true);
    expect(fs.existsSync(indexFile)).toBe(true);
    expect(fs.existsSync(utilsFile)).toBe(true);
  });

  it('should have vercel.json configuration', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);
    
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    expect(config.rewrites).toBeDefined();
    expect(config.rewrites).toEqual(expect.arrayContaining([
      { "source": "/calendar/today", "destination": "/api/calendar/today" },
      { "source": "/calendar/week", "destination": "/api/calendar/week" },
      { "source": "/calendar/week/:start", "destination": "/api/calendar/week?start=:start" }
    ]));
  });

  it('should have function configurations in vercel.json', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    expect(config.functions).toBeDefined();
    expect(config.functions['pages/api/calendar/today.js']).toBeDefined();
    expect(config.functions['pages/api/calendar/week.js']).toBeDefined();
    expect(config.functions['pages/api/calendar/index.js']).toBeDefined();
    
    expect(config.functions['pages/api/calendar/today.js'].maxDuration).toBe(30);
    expect(config.functions['pages/api/calendar/week.js'].maxDuration).toBe(30);
    expect(config.functions['pages/api/calendar/index.js'].maxDuration).toBe(15);
  });

  it('should have cron configuration for cache warming', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    expect(config.crons).toBeDefined();
    expect(config.crons).toEqual(expect.arrayContaining([
      {
        "path": "/api/cron/warm-cache",
        "schedule": "*/5 * * * *"
      }
    ]));
  });

  it('should export default functions from API handlers', async () => {
    const { default: weekHandler } = await import('../calendar/week.js');
    const { default: todayHandler } = await import('../calendar/today.js');
    const { default: indexHandler } = await import('../calendar/index.js');
    
    expect(typeof weekHandler).toBe('function');
    expect(typeof todayHandler).toBe('function');
    expect(typeof indexHandler).toBe('function');
  });

  it('should have sitemap.xml for SEO', () => {
    const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemapContent).toContain('/calendar/week');
  });

  it('should have morning report API endpoint', async () => {
    const morningReportFile = path.resolve(process.cwd(), 'pages', 'api', 'morning-report.js');
    expect(fs.existsSync(morningReportFile)).toBe(true);
    
    const { default: handler } = await import('../morning-report.js');
    expect(typeof handler).toBe('function');
  });

  it('should have cron warm-cache endpoint', () => {
    const cronDir = path.resolve(process.cwd(), 'pages', 'api', 'cron');
    const warmCacheFile = path.resolve(cronDir, 'warm-cache.js');
    
    expect(fs.existsSync(cronDir)).toBe(true);
    expect(fs.existsSync(warmCacheFile)).toBe(true);
  });
});