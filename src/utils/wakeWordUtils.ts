/**
 * Wake-Word Detection Utilities for "Hey Soha"
 * Detects voice triggers and generates Web Audio chime feedback.
 */

const WAKE_PHRASES = [
  'hey soha',
  'hi soha',
  'hello soha',
  'soha',
  'hey zoha',
  'hey zoha',
  'হেই সোহা',
  'সোহা',
  'এই সোহা',
];

export interface WakeWordMatchResult {
  matched: boolean;
  detectedPhrase?: string;
  commandRemainder: string;
}

/**
 * Checks if a string contains any of the wake phrases.
 */
export function checkWakeWord(text: string): WakeWordMatchResult {
  if (!text) {
    return { matched: false, commandRemainder: '' };
  }

  const normalized = text.toLowerCase().trim();

  for (const phrase of WAKE_PHRASES) {
    const idx = normalized.indexOf(phrase);
    if (idx !== -1) {
      const commandRemainder = normalized.slice(idx + phrase.length).trim();
      return {
        matched: true,
        detectedPhrase: phrase,
        commandRemainder,
      };
    }
  }

  return { matched: false, commandRemainder: text };
}

/**
 * Plays an upbeat, friendly wake-up chime using Web Audio API oscillator
 * (Two-tone musical chime: D5 (587Hz) -> A5 (880Hz))
 */
export function playWakeChime(audioCtx?: AudioContext): void {
  try {
    const ctx =
      audioCtx ||
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First note: 587 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second note: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.warn('[WakeWord] Audio chime playback notice:', err);
  }
}
