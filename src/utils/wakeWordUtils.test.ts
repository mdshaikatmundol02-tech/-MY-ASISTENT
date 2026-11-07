import test from 'node:test';
import assert from 'node:assert/strict';
import { checkWakeWord } from './wakeWordUtils';

test('checkWakeWord detects "Hey Soha"', () => {
  const res = checkWakeWord('Hey Soha, what is my battery?');
  assert.equal(res.matched, true);
  assert.equal(res.detectedPhrase, 'hey soha');
  assert.equal(res.commandRemainder, ', what is my battery?');
});

test('checkWakeWord detects Bengali "হেই সোহা"', () => {
  const res = checkWakeWord('হেই সোহা আমার মেসেজগুলো পড়ে শোনাও');
  assert.equal(res.matched, true);
  assert.equal(res.detectedPhrase, 'হেই সোহা');
});

test('checkWakeWord returns false for non-wake phrases', () => {
  const res = checkWakeWord('What is the weather outside?');
  assert.equal(res.matched, false);
});
