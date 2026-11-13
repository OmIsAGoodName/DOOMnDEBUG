import EpisodePlayer from './EpisodePlayer';

export { EpisodePlayer };
export type { EpisodePlayerHandle } from '@contracts';
export { resolveTimeline, resolveFrom, estimateSpeechDuration } from './resolveTimeline';
export { renderAt } from './renderAt';
export { AudioEngine } from './audio/engine';
export { computeMouthTrack, mouthAt, fallbackMouthCycle } from './audio/lipsync';
export type { ResolvedTimeline, ResolvedScene, ResolvedBeat, ResolvedChoicePoint } from './types';

export default EpisodePlayer;
