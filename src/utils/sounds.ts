import { GameSettings } from '../types';

// Audio context for better browser support
let audioContext: AudioContext | null = null;
let soundEnabled = true;

// Initialize audio context on user interaction
export const initializeAudio = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  } catch (err) {
    console.warn('Audio context could not be initialized. Sound will be disabled:', err);
    soundEnabled = false;
  }
};

// Set sound enabled/disabled
export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

// Create an oscillator for generating tones
const createOscillator = (
  frequency: number,
  type: OscillatorType = 'sine',
  duration: number = 0.15,
  volume: number = 0.2,
  delay: number = 0
) => {
  if (!soundEnabled || !audioContext) {
    console.log(`Sound not played: enabled=${soundEnabled}, context=${!!audioContext}`);
    return;
  }
  
  console.log(`Creating oscillator: freq=${frequency}, type=${type}, vol=${volume}, dur=${duration}, delay=${delay}`);
  
  try {
    // Create and configure oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
    oscillator.type = type;
  oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    // Start the oscillator with delay if specified
    const startTime = audioContext.currentTime + delay;
    oscillator.start(startTime);
    
    // Fade out for smoother sound
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.stop(startTime + duration);
    
    return oscillator;
  } catch (error) {
    console.error('Failed to create oscillator:', error);
    return null;
  }
};

// Play a sound for X player's move (higher sound)
const playMoveXSound = () => {
  createOscillator(440, 'sine', 0.1); // A4 note
};

// Play a sound for O player's move (lower sound)
const playMoveOSound = () => {
  createOscillator(330, 'sine', 0.1); // E4 note
};

// Play a win sound (fanfare-like)
const playWinSound = () => {
  if (!soundEnabled || !audioContext) {
    console.log("Cannot play win sound - audio not enabled or context missing");
    return;
  }
  
  console.log("Playing winning fanfare sound!");
  
  // Create a more complex victory fanfare
  // First chord - major triad
  createOscillator(523.25, 'sine', 0.5, 0.3); // C5
  createOscillator(659.25, 'sine', 0.5, 0.2); // E5
  createOscillator(783.99, 'sine', 0.5, 0.25); // G5
  
  // Rising arpeggio
  createOscillator(523.25, 'triangle', 0.2, 0.4, 0.5); // C5
  createOscillator(659.25, 'triangle', 0.2, 0.4, 0.7); // E5
  createOscillator(783.99, 'triangle', 0.2, 0.4, 0.9); // G5
  createOscillator(1046.50, 'triangle', 0.3, 0.5, 1.1); // C6 (higher octave)
  
  // Final chord - major with added octave
  createOscillator(523.25, 'sine', 0.6, 0.25, 1.5); // C5
  createOscillator(659.25, 'sine', 0.6, 0.2, 1.5); // E5
  createOscillator(783.99, 'sine', 0.6, 0.2, 1.5); // G5
  createOscillator(1046.50, 'sine', 0.6, 0.3, 1.5); // C6
};

// Play a draw sound (mysterious chord progression)
const playDrawSound = () => {
  if (!soundEnabled || !audioContext) {
    console.log("Cannot play draw sound - audio not enabled or context missing");
    return;
  }
  
  console.log("Playing draw sound effect!");
  
  // First chord - suspended
  createOscillator(523.25, 'sine', 0.4, 0.3); // C5
  createOscillator(587.33, 'sine', 0.4, 0.2); // D5
  createOscillator(783.99, 'sine', 0.4, 0.25); // G5
  
  // Middle section - descending pattern
  createOscillator(493.88, 'triangle', 0.3, 0.25, 0.5); // B4
  createOscillator(440.00, 'triangle', 0.3, 0.25, 0.7); // A4
  createOscillator(392.00, 'triangle', 0.3, 0.25, 0.9); // G4
  
  // Final unresolved chord
  createOscillator(392.00, 'sine', 0.6, 0.2, 1.3); // G4
  createOscillator(493.88, 'sine', 0.6, 0.2, 1.3); // B4
  createOscillator(587.33, 'sine', 0.6, 0.2, 1.3); // D5
};

// Play a click sound (short blip)
const playClickSoundEffect = () => {
  createOscillator(800, 'sine', 0.05, 0.1);
};

// Play a notification sound (double beep)
const playNotificationSoundEffect = () => {
  createOscillator(880, 'sine', 0.1, 0.15);
  createOscillator(988, 'sine', 0.1, 0.15, 0.12);
};

// Play an error sound (descending dissonant)
const playErrorSoundEffect = () => {
  createOscillator(220, 'sawtooth', 0.1, 0.15);
  createOscillator(196, 'sawtooth', 0.1, 0.15, 0.1);
};

// Play a sound for X or O move
export const playMoveSound = (player: 'X' | 'O') => {
  if (player === 'X') {
    playMoveXSound();
  } else {
    playMoveOSound();
  }
};

// Play sound for game result
export const playResultSound = (result: 'win' | 'draw') => {
  console.log(`Playing ${result} sound effect`); // Debug log
  if (result === 'win') {
    playWinSound();
  } else {
    playDrawSound();
  }
};

// Play UI interaction sound
export const playClickSound = () => {
  playClickSoundEffect();
};

// Play notification sound
export const playNotificationSound = () => {
  playNotificationSoundEffect();
};

// Play error sound
export const playErrorSound = () => {
  playErrorSoundEffect();
};