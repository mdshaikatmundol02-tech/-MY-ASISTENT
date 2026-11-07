/**
 * Audio processing utilities for Gemini Live API
 * Live API requires 16-bit linear PCM little-endian audio at 16kHz for input
 * and produces 24kHz 16-bit linear PCM audio for output.
 */

/**
 * Converts Float32 audio samples [-1.0, 1.0] from Web Audio API to Int16 PCM samples.
 */
export function float32ToPcm16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1.0, 1.0]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Scale to signed 16-bit int [-32768, 32767]
    pcm16[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return pcm16;
}

/**
 * Converts Int16 PCM audio samples to Float32 [-1.0, 1.0] for Web Audio playback.
 */
export function pcm16ToFloat32(pcm16: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    const s = pcm16[i];
    float32[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
  }
  return float32;
}

/**
 * Converts an Int16Array to strict little-endian raw byte buffer.
 * Gemini Live API mandates 16-bit linear PCM with little-endian byte ordering.
 */
export function pcm16ToLittleEndianBytes(pcm16: Int16Array): Uint8Array {
  const buffer = new ArrayBuffer(pcm16.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(i * 2, pcm16[i], true); // true = little-endian
  }
  return new Uint8Array(buffer);
}

/**
 * Encodes a Uint8Array into a base64 string without UTF-8 corruption or call stack overflow.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Encodes an Int16Array into base64 string with guaranteed little-endian byte order.
 */
export function pcmToBase64(pcm16: Int16Array): string {
  const littleEndianBytes = pcm16ToLittleEndianBytes(pcm16);
  return uint8ArrayToBase64(littleEndianBytes);
}

/**
 * Decodes a base64 string representing raw PCM16 audio (little-endian) into Float32Array.
 */
export function base64ToFloat32(base64: string): Float32Array {
  let bytes: Uint8Array;
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } else {
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  }

  // Ensure byte length is a multiple of 2 (16-bit)
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);

  for (let i = 0; i < sampleCount; i++) {
    const s = view.getInt16(i * 2, true); // true = little-endian
    float32[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
  }
  return float32;
}

/**
 * Resamples audio buffer from source sample rate to target sample rate using linear interpolation.
 */
export function resampleAudio(
  sourceData: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return new Float32Array(sourceData);
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.round(sourceData.length / ratio);
  const result = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i * ratio;
    const indexLow = Math.floor(srcIndex);
    const indexHigh = Math.min(indexLow + 1, sourceData.length - 1);
    const fraction = srcIndex - indexLow;

    result[i] = sourceData[indexLow] * (1 - fraction) + sourceData[indexHigh] * fraction;
  }

  return result;
}

/**
 * Calculates Root Mean Square (RMS) volume level between 0 and 1.
 */
export function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 3);
}

export interface PreparedAudioChunk {
  base64: string;
  sampleCount: number;
  durationMs: number;
  rms: number;
  mimeType: string;
}

/**
 * Complete pipeline for incoming raw microphone Float32 audio:
 * 1. Resample to 16,000 Hz if needed.
 * 2. Measure RMS energy.
 * 3. Quantize to signed 16-bit linear PCM [-32768, 32767].
 * 4. Encode to Little-Endian binary bytes.
 * 5. Format to Base64 string for Gemini Live audio chunk.
 */
export function processMicrophoneAudioChunk(
  inputSamples: Float32Array,
  sourceSampleRate: number
): PreparedAudioChunk {
  // 1. Resample to 16kHz mono
  const samples16k =
    sourceSampleRate !== 16000
      ? resampleAudio(inputSamples, sourceSampleRate, 16000)
      : inputSamples;

  // 2. Measure RMS energy
  const rms = calculateRms(samples16k);

  // 3. Convert to 16-bit PCM
  const pcm16 = float32ToPcm16(samples16k);

  // 4. Encode to little-endian Base64
  const base64 = pcmToBase64(pcm16);

  const durationMs = Math.round((samples16k.length / 16000) * 1000);

  return {
    base64,
    sampleCount: samples16k.length,
    durationMs,
    rms,
    mimeType: 'audio/pcm;rate=16000',
  };
}
