export const speakMessage = (message: string): void => {
  // Check if browser supports speech synthesis
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(message);
  
  // Configure voice settings
  utterance.rate = 0.8;  // Slower speed of speech (default is 1.0)
  utterance.pitch = 1.0; // Pitch of voice
  utterance.volume = 1.0; // Volume (0 to 1)
  
  // Try to get a male voice if available
  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(voice => 
    voice.name.includes('Male') || 
    voice.name.includes('male') ||
    voice.name.includes('Google UK English Male') ||
    voice.name.includes('Microsoft David') ||
    voice.name.includes('Microsoft James')
  );
  
  if (maleVoice) {
    utterance.voice = maleVoice;
  }

  // Speak the message
  window.speechSynthesis.speak(utterance);
}; 