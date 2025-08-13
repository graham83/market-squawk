/* 
Typewriter audio synthesizer (no UI sliders; controlled by code).
Usage:

import { createTypewriterAudio } from "./soundUtils";

const audio = createTypewriterAudio({
  masterVolume: 0.5,
  baseFreqHz: 80,
  clickLevel: 0.7,
  thunkLevel: 0.5,
  bellLevel: 0.6,
  oscType: "triangle",
  reverbEnabled: true,
  reverbMix: 0.3,
  reverbSize: 3
});

// Important: call resume() from a user gesture (e.g., first click) to unlock audio
window.addEventListener("click", () => audio.resume(), { once: true });

// When you render a character to the top display, call:
audio.playKey("normal");
// For space/enter/backspace specifically:
audio.playKey("space");
audio.playKey("enter");
audio.playKey("backspace");

// You can tweak params later without UI:
audio.setConfig({ thunkLevel: 0.6, reverbMix: 0.25 });

*/

const defaultConfig = {
  masterVolume: 0.5,
  baseFreqHz: 80,
  clickLevel: 0.7,
  thunkLevel: 0.5,
  bellLevel: 0.6,
  oscType: "triangle",
  reverbEnabled: false,
  reverbMix: 0.3,
  reverbSize: 3
};

const VALID_OSC_TYPES = ["sine", "square", "sawtooth", "triangle"];

function validateConfig(config) {
  const validated = {};
  
  // Only validate and include properties that are explicitly provided
  if (config.masterVolume !== undefined) {
    validated.masterVolume = clamp(Number(config.masterVolume), 0, 1);
  }
  if (config.baseFreqHz !== undefined) {
    validated.baseFreqHz = clamp(Number(config.baseFreqHz), 20, 2000);
  }
  if (config.clickLevel !== undefined) {
    validated.clickLevel = clamp(Number(config.clickLevel), 0, 1);
  }
  if (config.thunkLevel !== undefined) {
    validated.thunkLevel = clamp(Number(config.thunkLevel), 0, 1);
  }
  if (config.bellLevel !== undefined) {
    validated.bellLevel = clamp(Number(config.bellLevel), 0, 1);
  }
  if (config.reverbMix !== undefined) {
    validated.reverbMix = clamp(Number(config.reverbMix), 0, 1);
  }
  if (config.reverbSize !== undefined) {
    validated.reverbSize = clamp(Number(config.reverbSize), 0.2, 12);
  }
  if (config.oscType !== undefined) {
    validated.oscType = VALID_OSC_TYPES.includes(config.oscType) ? config.oscType : "triangle";
  }
  if (config.reverbEnabled !== undefined) {
    validated.reverbEnabled = Boolean(config.reverbEnabled);
  }
  
  return validated;
}

// Constants
const EXPONENTIAL_RAMP_MIN = 0.001;
const REVERB_FILTER_FREQ = 4000;
const REVERB_FILTER_Q = 0.7;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scheduleNodeCleanup(node, activeNodes, delay = 0.1) {
  activeNodes.add(node);
  setTimeout(() => {
    activeNodes.delete(node);
  }, (delay + 0.1) * 1000);
}

export function createTypewriterAudio(initial = {}) {
  let config = { ...defaultConfig, ...validateConfig(initial) };

  let audioContext = null;
  let masterGain = null;
  let dryGain = null;
  let wetGain = null;
  let convolverNode = null;
  let reverbFilter = null;
  
  // Track active audio nodes for cleanup
  const activeNodes = new Set();

  function ensureAudio() {
    if (audioContext) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        throw new Error('Web Audio API not supported');
      }
      audioContext = new Ctx();
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error);
      return;
    }

    // Master
    masterGain = audioContext.createGain();
    masterGain.gain.value = clamp(config.masterVolume, 0, 1);

    // Dry/Wet for reverb
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();

    // Convolver and gentle LP filter for the reverb tail
    convolverNode = audioContext.createConvolver();
    reverbFilter = audioContext.createBiquadFilter();
    reverbFilter.type = "lowpass";
    reverbFilter.frequency.value = REVERB_FILTER_FREQ;
    reverbFilter.Q.value = REVERB_FILTER_Q;

    // Connect graph
    dryGain.connect(masterGain);
    convolverNode.connect(reverbFilter);
    reverbFilter.connect(wetGain);
    wetGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    // Build initial IR and mix
    createReverbImpulse();
    updateReverbMix();
  }

  function createReverbImpulse() {
    if (!audioContext || !convolverNode) return;

    const sizeSec = clamp(config.reverbSize, 0.2, 12);
    const length = Math.max(1, Math.floor(audioContext.sampleRate * sizeSec));
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);

      // Early reflections (sparse)
      const earlyReflections = Math.floor(sizeSec * 8);
      for (let i = 0; i < earlyReflections; i++) {
        const t = Math.random() * 0.1 * audioContext.sampleRate;
        const idx = Math.floor(t);
        if (idx < length) {
          data[idx] =
            (Math.random() - 0.5) *
            Math.pow(1 - idx / length, 1.5) *
            0.5;
        }
      }

      // Late tail (lighter noise, smoothed)
      const start = Math.floor(0.1 * audioContext.sampleRate);
      for (let i = start; i < length; i++) {
        if (i % 3 === 0) {
          const decay = Math.pow(1 - (i - start) / (length - start), 2);
          data[i] = (Math.random() - 0.5) * decay * 0.1;
          if (i > start + 1) {
            data[i] = (data[i] + data[i - 1] * 0.5) / 1.5;
          }
        }
      }

      // Additional smoothing pass
      for (let i = 1; i < length - 1; i++) {
        data[i] = data[i - 1] * 0.25 + data[i] * 0.5 + data[i + 1] * 0.25;
      }
    }

    convolverNode.buffer = impulse;
  }

  function updateReverbMix() {
    if (!dryGain || !wetGain) return;
    const mix = clamp(config.reverbMix, 0, 1);
    if (config.reverbEnabled) {
      dryGain.gain.value = 1 - mix;
      wetGain.gain.value = mix;
    } else {
      dryGain.gain.value = 1;
      wetGain.gain.value = 0;
    }
  }

  function setMasterVolume(vol) {
    config.masterVolume = clamp(vol, 0, 1);
    if (masterGain) masterGain.gain.value = config.masterVolume;
  }

  function playBellSound() {
    if (!audioContext || !dryGain || !convolverNode) return;
    const level = clamp(config.bellLevel, 0, 1);
    if (level <= 0) return;

    const now = audioContext.currentTime;
    const bellGain = audioContext.createGain();
    bellGain.connect(dryGain);
    bellGain.connect(convolverNode);

    const fundamentalFreq = 2200;
    const harmonics = [1, 2.2, 3.5, 5.1];
    const gains = [1, 0.5, 0.3, 0.2];

    harmonics.forEach((h, i) => {
      const osc = audioContext.createOscillator();
      osc.type = "sine";
      osc.frequency.value = fundamentalFreq * h;

      const g = audioContext.createGain();
      g.gain.setValueAtTime(level * 0.1 * gains[i], now);
      g.gain.exponentialRampToValueAtTime(EXPONENTIAL_RAMP_MIN, now + 0.8);
      
      scheduleNodeCleanup(osc, activeNodes, 1);
      scheduleNodeCleanup(g, activeNodes, 1);

      osc.connect(g);
      g.connect(bellGain);
      osc.start(now + 0.05);
      osc.stop(now + 1);
    });
  }

  function playKey(type = "normal") {
    if (!audioContext || !dryGain || !convolverNode) return;

    const now = audioContext.currentTime;
    const keyGain = audioContext.createGain();
    keyGain.connect(dryGain);
    keyGain.connect(convolverNode);

    // Click: short noise burst
    const clickLevel = clamp(config.clickLevel, 0, 1);
    if (clickLevel > 0) {
      const noiseLen = Math.max(1, Math.floor(audioContext.sampleRate * 0.005));
      const noiseBuffer = audioContext.createBuffer(1, noiseLen, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() - 0.5) * 2;
      }

      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(clickLevel * 0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(EXPONENTIAL_RAMP_MIN, now + 0.01);
      
      scheduleNodeCleanup(noiseSource, activeNodes, 0.01);
      scheduleNodeCleanup(noiseGain, activeNodes, 0.01);
      scheduleNodeCleanup(hp, activeNodes, 0.01);

      const hp = audioContext.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = type === "space" ? 800 : 2000;

      noiseSource.connect(hp);
      hp.connect(noiseGain);
      noiseGain.connect(keyGain);
      noiseSource.start(now);
    }

    // Thunk: short tone
    const thunkLevel = clamp(config.thunkLevel, 0, 1);
    if (thunkLevel > 0) {
      const osc = audioContext.createOscillator();
      osc.type = config.oscType;

      let freq = config.baseFreqHz;
      let duration = 0.05;
      let g = thunkLevel * 0.2;

      switch (type) {
        case "space":
          freq = config.baseFreqHz * 0.5;
          duration = 0.08;
          g *= 1.2;
          break;
        case "enter":
          freq = config.baseFreqHz * 0.7;
          duration = 0.1;
          g *= 1.5;
          playBellSound();
          break;
        case "backspace":
          freq = config.baseFreqHz * 1.5;
          duration = 0.03;
          g *= 0.8;
          break;
        default:
          // Small natural variation for normal keys
          freq += (Math.random() - 0.5) * 10;
      }

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, freq * 0.5), now + duration);

      const oscGain = audioContext.createGain();
      oscGain.gain.setValueAtTime(g, now);
      oscGain.gain.exponentialRampToValueAtTime(EXPONENTIAL_RAMP_MIN, now + duration);
      
      scheduleNodeCleanup(osc, activeNodes, duration + 0.1);
      scheduleNodeCleanup(oscGain, activeNodes, duration + 0.1);

      osc.connect(oscGain);
      oscGain.connect(keyGain);
      osc.start(now);
      osc.stop(now + duration + 0.1);
    }

    // Overall key envelope
    keyGain.gain.setValueAtTime(1, now);
    keyGain.gain.exponentialRampToValueAtTime(EXPONENTIAL_RAMP_MIN, now + 0.2);
    
    scheduleNodeCleanup(keyGain, activeNodes, 0.2);
  }

  return {
    // Call from a user gesture to unlock and initialize audio
    async resume() {
      ensureAudio();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    },

    async suspend() {
      if (!audioContext) return;
      if (audioContext.state === "running") {
        await audioContext.suspend();
      }
    },

    isInitialized() {
      return !!audioContext;
    },

    playKey,

    setConfig(patch) {
      const prevSize = config.reverbSize;
      const validatedPatch = validateConfig(patch);
      config = { ...config, ...validatedPatch };

      // Apply live-updatable params
      setMasterVolume(config.masterVolume);
      if (validatedPatch.reverbMix !== undefined || validatedPatch.reverbEnabled !== undefined) {
        updateReverbMix();
      }
      if (validatedPatch.reverbSize !== undefined && config.reverbSize !== prevSize) {
        createReverbImpulse();
      }
    },

    getConfig() {
      return { ...config };
    },

    // Legacy methods for backward compatibility
    initializeAudioContext() {
      ensureAudio();
    },

    playTypingSound() {
      playKey("normal");
    },

    playClickSound() {
      playKey("normal");
    },

    toggle() {
      config.masterVolume = config.masterVolume > 0 ? 0 : 0.5;
      setMasterVolume(config.masterVolume);
    },

    setEnabled(enabled) {
      config.masterVolume = enabled ? 0.5 : 0;
      setMasterVolume(config.masterVolume);
    },

    // Cleanup method for proper resource management
    cleanup() {
      activeNodes.clear();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        audioContext = null;
        masterGain = null;
        dryGain = null;
        wetGain = null;
        convolverNode = null;
        reverbFilter = null;
      }
    },

    // Get count of active audio nodes for debugging
    getActiveNodeCount() {
      return activeNodes.size;
    }
  };
}

// Create singleton instance with default configuration
const typewriterSound = createTypewriterAudio();

export default typewriterSound;