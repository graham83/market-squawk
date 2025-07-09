import { describe, it, expect, vi } from 'vitest';

describe('soundUtils', () => {
  it('can import soundUtils module', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    expect(typewriterSound).toBeDefined();
  });

  it('has required methods', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    
    expect(typeof typewriterSound.playTypingSound).toBe('function');
    expect(typeof typewriterSound.playClickSound).toBe('function');
    expect(typeof typewriterSound.toggle).toBe('function');
    expect(typeof typewriterSound.setEnabled).toBe('function');
  });

  it('can call methods without errors', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    
    expect(() => typewriterSound.playTypingSound()).not.toThrow();
    expect(() => typewriterSound.playClickSound()).not.toThrow();
    expect(() => typewriterSound.toggle()).not.toThrow();
    expect(() => typewriterSound.setEnabled(false)).not.toThrow();
  });
});