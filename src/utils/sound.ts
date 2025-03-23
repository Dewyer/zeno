// Create a simple beep sound using Web Audio API
export const createBeepSound = (frequency: number = 880, duration: number = 0.1) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// Create a more pleasant alarm sound with multiple tones
export const createAlarmSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create three oscillators for different tones
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const osc3 = audioContext.createOscillator();
  
  // Create gain nodes for each oscillator
  const gain1 = audioContext.createGain();
  const gain2 = audioContext.createGain();
  const gain3 = audioContext.createGain();
  
  // Connect oscillators to their gain nodes
  osc1.connect(gain1);
  osc2.connect(gain2);
  osc3.connect(gain3);
  
  // Connect gain nodes to destination
  gain1.connect(audioContext.destination);
  gain2.connect(audioContext.destination);
  gain3.connect(audioContext.destination);
  
  // Set oscillator types to sine for smoother sound
  osc1.type = 'sine';
  osc2.type = 'sine';
  osc3.type = 'sine';
  
  // Set lower frequencies for a more pleasant sound
  const baseFreq = 440; // A4 note
  const startTime = audioContext.currentTime;
  
  // First tone sequence
  osc1.frequency.setValueAtTime(baseFreq, startTime);
  gain1.gain.setValueAtTime(0.3, startTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
  
  // Second tone sequence (slightly delayed)
  osc2.frequency.setValueAtTime(baseFreq * 1.25, startTime + 0.4);
  gain2.gain.setValueAtTime(0.3, startTime + 0.4);
  gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.7);
  
  // Third tone sequence (slightly delayed)
  osc3.frequency.setValueAtTime(baseFreq * 1.5, startTime + 0.8);
  gain3.gain.setValueAtTime(0.3, startTime + 0.8);
  gain3.gain.exponentialRampToValueAtTime(0.01, startTime + 1.1);
  
  // Start all oscillators
  osc1.start(startTime);
  osc2.start(startTime + 0.4);
  osc3.start(startTime + 0.8);
  
  // Stop all oscillators
  osc1.stop(startTime + 0.3);
  osc2.stop(startTime + 0.7);
  osc3.stop(startTime + 1.1);
}; 