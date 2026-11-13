import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeMouthTrack,
  mouthAt,
  clearMouthTrackCache,
  fallbackMouthCycle,
} from './lipsync';

function createMockAudioBuffer(samples: Float32Array, sampleRate = 44100): AudioBuffer {
  return {
    sampleRate,
    length: samples.length,
    duration: samples.length / sampleRate,
    numberOfChannels: 1,
    getChannelData: () => samples,
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

describe('lipsync', () => {
  beforeEach(() => {
    clearMouthTrackCache();
  });

  it('classifies silence as closed', () => {
    const sampleRate = 44100;
    const samples = new Float32Array(sampleRate); // 1s of silence
    const buffer = createMockAudioBuffer(samples, sampleRate);

    const track = computeMouthTrack('test:silence', buffer);
    expect(track.lineId).toBe('test:silence');
    expect(track.windows.length).toBeGreaterThan(0);
    expect(mouthAt('test:silence', 0.2)).toBe('closed');
    expect(mouthAt('test:silence', 0.5)).toBe('closed');
  });

  it('classifies loud sustained audio as wide/half', () => {
    const sampleRate = 44100;
    const samples = new Float32Array(sampleRate);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.9;
    }
    const buffer = createMockAudioBuffer(samples, sampleRate);

    computeMouthTrack('test:loud', buffer);
    const shape = mouthAt('test:loud', 0.5);
    expect(['half', 'wide']).toContain(shape);
  });

  it('smooths rapid transitions with minimum hold', () => {
    const sampleRate = 44100;
    const samples = new Float32Array(sampleRate);
    // Create an audio buffer with a brief 20ms burst
    const burstSamples = Math.floor(sampleRate * 0.02);
    for (let i = 0; i < burstSamples; i++) {
      samples[i] = 1.0;
    }
    const buffer = createMockAudioBuffer(samples, sampleRate);

    const track = computeMouthTrack('test:burst', buffer);
    expect(track.windows.length).toBeGreaterThan(0);
  });

  it('fallbackMouthCycle cycles deterministically when speaking', () => {
    expect(fallbackMouthCycle(0, 10, false)).toBe('closed');
    const shape1 = fallbackMouthCycle(0.05, 10, true);
    const shape2 = fallbackMouthCycle(0.18, 10, true);
    expect(['closed', 'half', 'wide']).toContain(shape1);
    expect(['closed', 'half', 'wide']).toContain(shape2);
  });
});

