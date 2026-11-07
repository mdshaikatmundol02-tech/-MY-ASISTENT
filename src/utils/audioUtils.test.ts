import test from 'node:test';
import assert from 'node:assert/strict';
import {
  float32ToPcm16,
  pcm16ToFloat32,
  pcm16ToLittleEndianBytes,
  uint8ArrayToBase64,
  pcmToBase64,
  base64ToFloat32,
  resampleAudio,
  calculateRms,
  processMicrophoneAudioChunk,
} from './audioUtils';

test('float32ToPcm16 clamps and converts properly', () => {
  const input = new Float32Array([-1.5, -1.0, 0, 0.5, 1.0, 1.5]);
  const pcm16 = float32ToPcm16(input);

  assert.equal(pcm16.length, input.length);
  assert.equal(pcm16[0], -32768); // Clamped to -1
  assert.equal(pcm16[1], -32768);
  assert.equal(pcm16[2], 0);
  assert.equal(pcm16[4], 32767);
  assert.equal(pcm16[5], 32767); // Clamped to 1
});

test('pcm16ToFloat32 recovers float values within quantization error', () => {
  const pcm = new Int16Array([-32768, 0, 16384, 32767]);
  const float32 = pcm16ToFloat32(pcm);

  assert.equal(float32.length, pcm.length);
  assert.equal(float32[0], -1);
  assert.equal(float32[1], 0);
  assert.ok(Math.abs(float32[2] - 0.5) < 0.001);
  assert.ok(Math.abs(float32[3] - 1.0) < 0.001);
});

test('pcm16ToLittleEndianBytes writes correct little-endian byte pairs', () => {
  // Test specific integer: 0x0102 (258 decimal) -> byte 0: 0x02, byte 1: 0x01
  // -1 (0xFFFF) -> byte 0: 0xFF, byte 1: 0xFF
  // 1 (0x0001) -> byte 0: 0x01, byte 1: 0x00
  const pcm = new Int16Array([0x0102, -1, 1]);
  const bytes = pcm16ToLittleEndianBytes(pcm);

  assert.equal(bytes.length, 6);
  assert.equal(bytes[0], 0x02);
  assert.equal(bytes[1], 0x01);
  assert.equal(bytes[2], 0xff);
  assert.equal(bytes[3], 0xff);
  assert.equal(bytes[4], 0x01);
  assert.equal(bytes[5], 0x00);
});

test('uint8ArrayToBase64 safely encodes full binary byte range [0..255] without corruption', () => {
  const allBytes = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    allBytes[i] = i;
  }
  const base64 = uint8ArrayToBase64(allBytes);
  assert.equal(typeof base64, 'string');
  assert.ok(base64.length > 0);

  // Decode and verify all bytes match
  const buf = Buffer.from(base64, 'base64');
  assert.equal(buf.length, 256);
  for (let i = 0; i < 256; i++) {
    assert.equal(buf[i], i);
  }
});

test('pcmToBase64 and base64ToFloat32 round-trip', () => {
  const originalFloat = new Float32Array([0, 0.25, -0.5, 0.75]);
  const pcm16 = float32ToPcm16(originalFloat);
  const base64 = pcmToBase64(pcm16);

  assert.equal(typeof base64, 'string');
  assert.ok(base64.length > 0);

  const decodedFloat = base64ToFloat32(base64);
  assert.equal(decodedFloat.length, originalFloat.length);
  for (let i = 0; i < originalFloat.length; i++) {
    assert.ok(Math.abs(decodedFloat[i] - originalFloat[i]) < 0.001);
  }
});

test('resampleAudio resamples 48kHz to 16kHz', () => {
  const samples48k = new Float32Array(480); // 10ms of 48kHz
  for (let i = 0; i < 480; i++) {
    samples48k[i] = Math.sin((i / 480) * Math.PI * 2);
  }

  const samples16k = resampleAudio(samples48k, 48000, 16000);
  assert.equal(samples16k.length, 160); // 10ms of 16kHz
});

test('calculateRms measures energy correctly', () => {
  const silent = new Float32Array([0, 0, 0, 0]);
  assert.equal(calculateRms(silent), 0);

  const active = new Float32Array([0.5, -0.5, 0.5, -0.5]);
  const rms = calculateRms(active);
  assert.ok(rms > 0.5 && rms <= 1);
});

test('processMicrophoneAudioChunk end-to-end pipeline produces valid 16kHz PCM chunk', () => {
  // Simulate 2048 samples at 48kHz hardware microphone capture (~42.6ms)
  const hardwareSamples = new Float32Array(2048);
  for (let i = 0; i < 2048; i++) {
    hardwareSamples[i] = Math.sin((i / 2048) * Math.PI * 8) * 0.6;
  }

  const chunk = processMicrophoneAudioChunk(hardwareSamples, 48000);

  assert.equal(chunk.mimeType, 'audio/pcm;rate=16000');
  assert.ok(chunk.base64.length > 0);
  // Resampled from 48000 to 16000 (ratio 3:1) -> 2048 / 3 ≈ 683 samples
  assert.equal(chunk.sampleCount, Math.round(2048 / 3));
  assert.ok(chunk.rms > 0);
  assert.ok(chunk.durationMs > 0);

  // Verify decoded chunk can be recovered back into valid Float32 audio
  const decoded = base64ToFloat32(chunk.base64);
  assert.equal(decoded.length, chunk.sampleCount);
});
