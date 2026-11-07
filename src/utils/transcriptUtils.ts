/**
 * Transcript utilities for Live API speech-to-speech interaction.
 */

export interface TranscriptItem {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  isInterim?: boolean;
}

/**
 * Appends or updates the current active turn transcript.
 */
export function appendOrUpdateTurn(
  turns: TranscriptItem[],
  sender: 'user' | 'gemini',
  newText: string,
  isInterim: boolean = false
): TranscriptItem[] {
  if (!newText.trim()) return turns;

  const lastTurn = turns[turns.length - 1];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // If last turn matches sender and was interim, update it
  if (lastTurn && lastTurn.sender === sender && lastTurn.isInterim) {
    const updated: TranscriptItem = {
      ...lastTurn,
      text: isInterim ? newText : newText,
      isInterim,
    };
    return [...turns.slice(0, -1), updated];
  }

  // If last turn matches sender and was finalized within same turn stream, append
  if (lastTurn && lastTurn.sender === sender && !lastTurn.isInterim && !isInterim) {
    // Only concatenate if it continues naturally
    const updated: TranscriptItem = {
      ...lastTurn,
      text: `${lastTurn.text} ${newText}`.trim(),
    };
    return [...turns.slice(0, -1), updated];
  }

  // Otherwise, create a new turn
  const newItem: TranscriptItem = {
    id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: newText.trim(),
    timestamp: now,
    isInterim,
  };

  return [...turns, newItem];
}

/**
 * Marks all turns as non-interim (finalized) upon turn completion.
 */
export function finalizeAllTurns(turns: TranscriptItem[]): TranscriptItem[] {
  return turns.map((t) => (t.isInterim ? { ...t, isInterim: false } : t));
}
