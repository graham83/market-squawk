import { describe, it, expect, vi } from 'vitest';

describe('soundUtils', () => {
  it('can import soundUtils module', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    expect(typewriterSound).toBeDefined();
  });

  it('has required methods', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    
    expect(typeof typewriterSound.playKey).toBe('function');
    expect(typeof typewriterSound.resume).toBe('function');
    expect(typeof typewriterSound.setConfig).toBe('function');
    expect(typeof typewriterSound.getConfig).toBe('function');
    
    // Legacy methods for backward compatibility
    expect(typeof typewriterSound.playTypingSound).toBe('function');
    expect(typeof typewriterSound.playClickSound).toBe('function');
    expect(typeof typewriterSound.toggle).toBe('function');
    expect(typeof typewriterSound.setEnabled).toBe('function');
  });

  it('can call methods without errors', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    
    expect(() => typewriterSound.playKey('normal')).not.toThrow();
    expect(() => typewriterSound.playKey('space')).not.toThrow();
    expect(() => typewriterSound.playKey('enter')).not.toThrow();
    expect(() => typewriterSound.playKey('backspace')).not.toThrow();
    expect(() => typewriterSound.setConfig({ masterVolume: 0.3 })).not.toThrow();
    expect(() => typewriterSound.getConfig()).not.toThrow();
    
    // Legacy methods
    expect(() => typewriterSound.playTypingSound()).not.toThrow();
    expect(() => typewriterSound.playClickSound()).not.toThrow();
    expect(() => typewriterSound.toggle()).not.toThrow();
    expect(() => typewriterSound.setEnabled(false)).not.toThrow();
  });

  it('has correct default configuration', async () => {
    const { createTypewriterAudio } = await import('../soundUtils');
    
    // Use a fresh instance to avoid state pollution from previous tests
    const freshAudio = createTypewriterAudio();
    const config = freshAudio.getConfig();
    expect(config.masterVolume).toBe(0.5);
    expect(config.baseFreqHz).toBe(80);
    expect(config.clickLevel).toBe(0.7);
    expect(config.thunkLevel).toBe(0.5);
    expect(config.bellLevel).toBe(0.6);
    expect(config.oscType).toBe('triangle');
    expect(config.reverbEnabled).toBe(false);
    expect(config.reverbMix).toBe(0.3);
    expect(config.reverbSize).toBe(3);
  });

  it('can update configuration', async () => {
    const { default: typewriterSound } = await import('../soundUtils');
    
    typewriterSound.setConfig({ 
      masterVolume: 0.8, 
      baseFreqHz: 100,
      clickLevel: 0.9 
    });
    
    const config = typewriterSound.getConfig();
    expect(config.masterVolume).toBe(0.8);
    expect(config.baseFreqHz).toBe(100);
    expect(config.clickLevel).toBe(0.9);
    // Other values should remain unchanged
    expect(config.thunkLevel).toBe(0.5);
    expect(config.oscType).toBe('triangle');
  });

  it('can create new typewriter audio instance', async () => {
    const { createTypewriterAudio } = await import('../soundUtils');
    
    const customAudio = createTypewriterAudio({
      masterVolume: 0.3,
      baseFreqHz: 120
    });
    
    expect(customAudio).toBeDefined();
    expect(typeof customAudio.playKey).toBe('function');
    expect(typeof customAudio.resume).toBe('function');
    expect(typeof customAudio.setConfig).toBe('function');
    
    const config = customAudio.getConfig();
    expect(config.masterVolume).toBe(0.3);
    expect(config.baseFreqHz).toBe(120);
  });
});