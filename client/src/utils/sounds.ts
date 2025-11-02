// Sound utility using Web Audio API
class GameSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playSequence(notes: Array<{ freq: number; duration: number; delay: number }>, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.enabled) return;

    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.freq, note.duration, type);
      }, note.delay);
    });
  }

  // Sound when your guess is too low
  playTooLow() {
    this.playTone(200, 0.2, 'sine', 0.2);
  }

  // Sound when your guess is too high
  playTooHigh() {
    this.playTone(400, 0.2, 'sine', 0.2);
  }

  // Sound when you make a correct guess and win
  playWin() {
    const notes = [
      { freq: 523, duration: 0.15, delay: 0 },      // C
      { freq: 659, duration: 0.15, delay: 100 },    // E
      { freq: 784, duration: 0.15, delay: 200 },    // G
      { freq: 1047, duration: 0.4, delay: 300 }     // C (high)
    ];
    this.playSequence(notes, 'triangle');
  }

  // Sound when opponent wins
  playLose() {
    const notes = [
      { freq: 392, duration: 0.2, delay: 0 },       // G
      { freq: 349, duration: 0.2, delay: 150 },     // F
      { freq: 294, duration: 0.4, delay: 300 }      // D
    ];
    this.playSequence(notes, 'sine');
  }

  // Sound when it becomes your turn
  playYourTurn() {
    const notes = [
      { freq: 440, duration: 0.1, delay: 0 },
      { freq: 550, duration: 0.1, delay: 100 }
    ];
    this.playSequence(notes, 'square');
  }

  // Sound when game starts
  playGameStart() {
    const notes = [
      { freq: 523, duration: 0.1, delay: 0 },
      { freq: 659, duration: 0.1, delay: 100 },
      { freq: 523, duration: 0.2, delay: 200 }
    ];
    this.playSequence(notes, 'triangle');
  }

  // Sound for button clicks
  playClick() {
    this.playTone(600, 0.05, 'square', 0.1);
  }

  // Sound when joining/creating room
  playJoin() {
    const notes = [
      { freq: 400, duration: 0.1, delay: 0 },
      { freq: 500, duration: 0.15, delay: 100 }
    ];
    this.playSequence(notes, 'sine');
  }

  // Enable/disable sounds
  toggleSounds() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setSoundsEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isSoundsEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const gameSounds = new GameSounds();
