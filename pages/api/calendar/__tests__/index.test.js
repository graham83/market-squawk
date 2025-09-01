import { describe, it, expect } from 'vitest';

describe('Calendar API Index Handler', () => {
  it('exports a default handler function', async () => {
    const { default: handler } = await import('../index.js');
    expect(typeof handler).toBe('function');
  });

  it('handler has the correct function signature', async () => {
    const { default: handler } = await import('../index.js');
    expect(handler.length).toBe(2);
  });
});