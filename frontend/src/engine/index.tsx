import EpisodePlayer from './EpisodePlayer';

export { EpisodePlayer };
export type { EpisodePlayerHandle } from '@contracts';
export { resolveTimeline, resolveFrom, estimateSpeechDuration } from './resolveTimeline';
export { renderAt } from './renderAt';
export { AudioEngine } from './audio/engine';
export { computeMouthTrack, mouthAt, fallbackMouthCycle } from './audio/lipsync';
export { EpisodeRecorder } from './recorder';
export { exportEpisode } from './exportFlow';
export type { ExportProgress, ExportEpisodeOptions } from './exportFlow';
export type { ResolvedTimeline, ResolvedScene, ResolvedBeat, ResolvedChoicePoint } from './types';

export default EpisodePlayer;
