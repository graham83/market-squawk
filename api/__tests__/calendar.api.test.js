import { describe, it, expect } from 'vitest';

describe('Serverless JSON Calendar API', () => {
  it('exports a default handler function', async () => {
    const { default: handler } = await import('../calendar/index.js');
    expect(typeof handler).toBe('function');
  });
});
