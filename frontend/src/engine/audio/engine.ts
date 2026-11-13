import type { AudioManifest } from '@contracts';
import type { ResolvedTimeline } from '../types';
import { computeMouthTrack } from './lipsync';

export interface AudioEngineOptions {
  onProgress?: (loaded: number, total: number) => void;
  destinationNode?: MediaStreamAudioDestinationNode;
}

interface ActiveSource {
  node: AudioBufferSourceNode;
  gainNode: GainNode;
  type: 'speech' | 'sfx' | 'music';
  id: string;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private speechGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;

  private bufferCache = new Map<string, AudioBuffer>();
  private activeSources: ActiveSource[] = [];
  private isMuted = false;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor(opts?: { destinationNode?: MediaStreamAudioDestinationNode }) {
    if (opts?.destinationNode) {
      this.recordingDestination = opts.destinationNode;
    }
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.speechGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.speechGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
      if (this.recordingDestination) {
        this.masterGain.connect(this.recordingDestination);
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public setRecordingDestination(dest: MediaStreamAudioDestinationNode): void {
    this.recordingDestination = dest;
    if (this.masterGain) {
      try {
        this.masterGain.connect(dest);
      } catch {
        // ignore already connected
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  /**
   * Preloads and decodes all audio files from manifest with concurrency cap 4.
   */
  public async loadManifest(manifest: AudioManifest | null, onProgress?: (p: number) => void): Promise<void> {
    if (!manifest) {
      this.isLoaded = true;
      return;
    }

    const items: Array<{ id: string; url: string; isSpeech: boolean }> = [];

    if (manifest.lines) {
      for (const line of manifest.lines) {
        if (line.url) items.push({ id: line.line_id, url: line.url, isSpeech: true });
      }
    }
    if (manifest.music) {
      for (const m of manifest.music) {
        if (m.url) items.push({ id: m.music_id, url: m.url, isSpeech: false });
      }
    }
    if (manifest.sfx) {
      for (const s of manifest.sfx) {
        if (s.url) items.push({ id: s.sfx_id, url: s.url, isSpeech: false });
      }
    }

    const total = items.length;
    if (total === 0) {
      this.isLoaded = true;
      return;
    }

    const ctx = this.initContext();
    let completed = 0;
    const concurrency = 4;
    let index = 0;

    const worker = async () => {
      while (index < items.length) {
        const item = items[index++];
        if (this.bufferCache.has(item.url)) {
          completed++;
          onProgress?.(completed / total);
          continue;
        }

        try {
          const res = await fetch(item.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.bufferCache.set(item.url, audioBuffer);

          if (item.isSpeech) {
            computeMouthTrack(item.id, audioBuffer);
          }
        } catch (err) {
          console.warn(`[AudioEngine] Failed to decode audio: ${item.url}`, err);
        } finally {
          completed++;
          onProgress?.(completed / total);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);
    this.isLoaded = true;
  }

  /**
   * Reschedules audio playback from a given time t along the timeline.
   */
  public syncPlayback(timeline: ResolvedTimeline, t: number, isPlaying: boolean): void {
    this.stopAll();

    if (!isPlaying || !this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;

    // Check if speech is currently active for music ducking
    const isSpeechActiveAtT = timeline.beats.some(
      (b) => b.speech && t >= b.startTime && t < b.endTime
    );

    // 1. Music scheduling
    const musicEvents = timeline.audioEvents.filter((e) => e.type === 'music');
    for (const ev of musicEvents) {
      const buf = this.bufferCache.get(ev.url);
      if (!buf) continue;

      const musicStart = ev.startTime;
      const musicEnd = ev.duration ? musicStart + ev.duration : timeline.totalDuration;

      if (t >= musicStart && t < musicEnd) {
        const offset = (t - musicStart) % buf.duration;
        const source = this.ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;

        const gainNode = this.ctx.createGain();
        const baseVolume = ev.volume ?? 0.3;
        const duckedVolume = baseVolume * 0.25; // -12dB ducking
        gainNode.gain.setValueAtTime(isSpeechActiveAtT ? duckedVolume : baseVolume, now);

        source.connect(gainNode);
        if (this.musicGain) gainNode.connect(this.musicGain);

        source.start(now, offset);
        this.activeSources.push({ node: source, gainNode, type: 'music', id: ev.id });
      }
    }

    // 2. Speech scheduling (current active line)
    for (const beat of timeline.beats) {
      if (!beat.speech || !beat.lineId) continue;
      const audioEv = timeline.audioEvents.find((e) => e.id === beat.lineId);
      if (!audioEv) continue;

      const buf = this.bufferCache.get(audioEv.url);
      if (!buf) continue;

      if (t >= beat.startTime && t < beat.endTime) {
        const offset = t - beat.startTime;
        if (offset < buf.duration) {
          const source = this.ctx.createBufferSource();
          source.buffer = buf;

          const gainNode = this.ctx.createGain();
          gainNode.gain.setValueAtTime(1.0, now);

          source.connect(gainNode);
          if (this.speechGain) gainNode.connect(this.speechGain);

          source.start(now, offset);
          this.activeSources.push({ node: source, gainNode, type: 'speech', id: beat.lineId });
        }
      }
    }

    // 3. SFX (play if triggered within the last 100ms)
    const sfxEvents = timeline.audioEvents.filter((e) => e.type === 'sfx');
    for (const ev of sfxEvents) {
      if (t >= ev.startTime && t <= ev.startTime + 0.1) {
        const buf = this.bufferCache.get(ev.url);
        if (!buf) continue;

        const offset = t - ev.startTime;
        const source = this.ctx.createBufferSource();
        source.buffer = buf;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(ev.volume ?? 0.8, now);

        source.connect(gainNode);
        if (this.sfxGain) gainNode.connect(this.sfxGain);

        source.start(now, offset);
        this.activeSources.push({ node: source, gainNode, type: 'sfx', id: ev.id });
      }
    }
  }

  public stopAll(): void {
    for (const s of this.activeSources) {
      try {
        s.node.stop();
        s.node.disconnect();
        s.gainNode.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeSources = [];
  }

  public pause(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public dispose(): void {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

