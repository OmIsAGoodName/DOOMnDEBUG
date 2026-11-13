export type MouthShape = 'closed' | 'half' | 'wide';

export interface MouthWindow {
  t: number; // seconds
  shape: MouthShape;
}

export interface MouthTrack {
  lineId: string;
  duration: number; // seconds
  windows: MouthWindow[];
}

const mouthTrackCache = new Map<string, MouthTrack>();

/**
 * Computes a MouthTrack from an AudioBuffer.
 * - RMS in 50ms windows
 * - Normalized by 95th percentile of the line
 * - Thresholds: closed < 0.15 <= half < 0.45 <= wide
 * - Minimum hold of 80ms (hysteresis) to prevent jitter
 */
export function computeMouthTrack(lineId: string, audioBuffer: AudioBuffer): MouthTrack {
  if (mouthTrackCache.has(lineId)) {
    return mouthTrackCache.get(lineId)!;
  }

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // primary channel
  const totalSamples = channelData.length;
  const windowDuration = 0.05; // 50ms
  const windowSamples = Math.floor(sampleRate * windowDuration);

  const numWindows = Math.ceil(totalSamples / windowSamples);
  const rmsValues: number[] = new Array(numWindows);

  for (let w = 0; w < numWindows; w++) {
    const start = w * windowSamples;
    const end = Math.min(start + windowSamples, totalSamples);
    let sumSq = 0;
    const count = end - start;

    for (let i = start; i < end; i++) {
      sumSq += channelData[i] * channelData[i];
    }
    rmsValues[w] = count > 0 ? Math.sqrt(sumSq / count) : 0;
  }

  // Calculate 95th percentile for normalization
  const sorted = [...rmsValues].sort((a, b) => a - b);
  const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
  const p95 = sorted[p95Index] > 0.0001 ? sorted[p95Index] : 1.0;

  // Classify raw shapes: closed < 0.15 <= half < 0.45 <= wide
  const rawShapes: MouthShape[] = rmsValues.map((rms) => {
    const norm = rms / p95;
    if (norm < 0.15) return 'closed';
    if (norm < 0.45) return 'half';
    return 'wide';
  });

  // Smooth with minimum hold of 80ms (minimum 2 windows of 50ms = 100ms >= 80ms)
  const minHoldWindows = Math.ceil(0.08 / windowDuration); // 2 windows
  const smoothedShapes: MouthShape[] = new Array(numWindows);

  let currentShape: MouthShape = 'closed';
  let holdRemaining = 0;

  for (let w = 0; w < numWindows; w++) {
    const candidate = rawShapes[w];
    if (holdRemaining <= 0) {
      if (candidate !== currentShape) {
        currentShape = candidate;
        holdRemaining = minHoldWindows;
      }
    } else {
      holdRemaining--;
    }
    smoothedShapes[w] = currentShape;
  }

  const windows: MouthWindow[] = smoothedShapes.map((shape, i) => ({
    t: i * windowDuration,
    shape,
  }));

  const track: MouthTrack = {
    lineId,
    duration: audioBuffer.duration,
    windows,
  };

  mouthTrackCache.set(lineId, track);
  return track;
}

export function cacheMouthTrack(track: MouthTrack): void {
  mouthTrackCache.set(track.lineId, track);
}

export function clearMouthTrackCache(): void {
  mouthTrackCache.clear();
}

/**
 * Returns the mouth shape at a given offset inside a line.
 */
export function mouthAt(lineId: string, tInLine: number): MouthShape {
  const track = mouthTrackCache.get(lineId);
  if (!track || track.windows.length === 0) {
    return 'closed';
  }

  if (tInLine < 0 || tInLine > track.duration) {
    return 'closed';
  }

  const index = Math.floor(tInLine / 0.05);
  if (index >= track.windows.length) {
    return track.windows[track.windows.length - 1].shape;
  }
  return track.windows[Math.max(0, index)].shape;
}

/**
 * Deterministic fallback mouth cycling when no audio is present.
 * Cycles closed/half/wide while the character is speaking based on text length and t.
 */
export function fallbackMouthCycle(t: number, textLength: number, isSpeaking: boolean): MouthShape {
  if (!isSpeaking || textLength === 0) {
    return 'closed';
  }
  // Standard speech cadence ~ 3-4 syllables per second (~ 250ms per syllable)
  // Cycle pattern: closed (40ms) -> half (80ms) -> wide (100ms) -> half (60ms) -> closed
  const cycleTime = 0.28;
  const phase = (t % cycleTime) / cycleTime;

  if (phase < 0.2) return 'closed';
  if (phase < 0.5) return 'half';
  if (phase < 0.8) return 'wide';
  return 'half';
}

