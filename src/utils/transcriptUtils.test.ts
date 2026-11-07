import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendOrUpdateTurn,
  finalizeAllTurns,
  TranscriptItem,
} from './transcriptUtils';

test('appendOrUpdateTurn creates new turn if turns array is empty', () => {
  const turns: TranscriptItem[] = [];
  const res = appendOrUpdateTurn(turns, 'user', 'Hello Gemini', false);
  assert.equal(res.length, 1);
  assert.equal(res[0].sender, 'user');
  assert.equal(res[0].text, 'Hello Gemini');
  assert.equal(res[0].isInterim, false);
});

test('appendOrUpdateTurn updates interim turn in place', () => {
  let turns: TranscriptItem[] = [];
  turns = appendOrUpdateTurn(turns, 'gemini', 'I am', true);
  assert.equal(turns[0].text, 'I am');
  assert.equal(turns[0].isInterim, true);

  turns = appendOrUpdateTurn(turns, 'gemini', 'I am here to help you', true);
  assert.equal(turns.length, 1);
  assert.equal(turns[0].text, 'I am here to help you');
});

test('finalizeAllTurns resets isInterim flags to false', () => {
  const turns: TranscriptItem[] = [
    { id: '1', sender: 'user', text: 'turn on flashlight', timestamp: '12:00', isInterim: true },
  ];
  const finalized = finalizeAllTurns(turns);
  assert.equal(finalized[0].isInterim, false);
});
