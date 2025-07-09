// Sound utility for typewriter effect
class TypewriterSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.init();
  }

  init() {
    try {
      // Create audio context on first user interaction
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.isEnabled = false;
    }
  }

  // Generate typing sound using Web Audio API
  playTypingSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (required for autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(
        800 + Math.random() * 200, // Random frequency between 800-1000 Hz
        this.audioContext.currentTime
      );
      oscillator.type = 'square';
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      // Play sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
      
    } catch (error) {
      console.warn('Error playing typing sound:', error);
    }
  }

  // Alternative method using data URI for click sound
  playClickSound() {
    if (!this.isEnabled) return;

    try {
      const audio = new Audio();
      // Generate a simple click sound using data URI
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBS2K2/LQeCoEK4HC8tuMOggWZ7zs46dODAxPpd/t';
      audio.volume = 0.1;
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } catch (error) {
      console.warn('Error playing click sound:', error);
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
const typewriterSound = new TypewriterSound();

export default typewriterSound;