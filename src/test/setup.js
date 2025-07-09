import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API for sound tests
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        setValueAtTime: vi.fn()
      },
      type: 'square'
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      }
    })),
    destination: {},
    currentTime: 0,
    resume: vi.fn(() => Promise.resolve()),
    state: 'running'
  }))
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: window.AudioContext
});

// Mock Audio constructor for sound fallback
Object.defineProperty(window, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    volume: 1,
    currentTime: 0,
    duration: 0,
    src: ''
  }))
});

// Mock IntersectionObserver (sometimes needed for Material Tailwind)
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
});

// Mock console.warn for cleaner test output
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});