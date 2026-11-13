import type {
  Action,
  AudioLine,
  AudioManifest,
  Choice,
  ChoiceOption,
  EpisodePlan,
  Palette,
  PlacedCharacter,
  PlacedProp,
  Scene,
  Speech,
  WordTiming,
} from '@contracts';

export type MoodName = 'day' | 'sunset' | 'night' | 'cozy' | 'magical';
export type CameraShot = 'wide' | 'medium' | 'close';
export type CameraMovement = 'static' | 'slow_push_in' | 'slow_pull_out' | 'pan_left' | 'pan_right';

export interface AttachedPropState {
  propId: string;
  slot: 'hand' | 'head' | 'ground';
  characterId?: string;
  position?: [number, number];
}

export interface CharacterActionState {
  x: number;
  y: number;
  facing: 'left' | 'right';
  expression: string;
  animation: string;
  animStartTime: number;
  scale: number;
  visible: boolean;
  alpha: number;
  attachedProps: AttachedPropState[];
}

export interface ResolvedAction {
  id: string;
  action: Action;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ResolvedBeat {
  beatId: string;
  sceneId: string;
  startTime: number;
  endTime: number;
  duration: number;
  speech?: Speech;
  lineId?: string;
  words?: WordTiming[];
  speechDuration?: number;
  estimatedSpeech: boolean;
  actions: ResolvedAction[];
  choice?: Choice;
  listeningStartTime?: number;
}

export interface ResolvedScene {
  sceneId: string;
  backgroundId: string;
  mood: MoodName;
  startTime: number;
  endTime: number;
  duration: number;
  nextSceneId: string | null;
  beats: ResolvedBeat[];
  initialCharacters: PlacedCharacter[];
  initialProps: PlacedProp[];
}

export interface ResolvedChoicePoint {
  choiceBeatId: string;
  sceneId: string;
  listeningStartTime: number;
  options: ChoiceOption[];
  defaultOptionId: string;
  prompt: string;
}

export interface ResolvedAudioEvent {
  type: 'speech' | 'sfx' | 'music';
  id: string;
  url: string;
  startTime: number;
  duration?: number;
  volume?: number;
  fade?: number;
  loop?: boolean;
}

export interface ResolvedTimeline {
  episodeId: string;
  title: string;
  totalDuration: number;
  scenes: ResolvedScene[];
  beats: ResolvedBeat[];
  choicePoints: ResolvedChoicePoint[];
  chosenPath: string[];
  audioEvents: ResolvedAudioEvent[];
  plan: EpisodePlan;
  audioManifest: AudioManifest | null;
}

export interface CameraState {
  zoom: number;
  targetZoom: number;
  panX: number;
  panY: number;
  movement: CameraMovement;
  shot: CameraShot;
  focusCharacterId?: string;
}

export interface RenderOptions {
  showCaptions?: boolean;
  debugOverlay?: boolean;
  mouthOverride?: 'closed' | 'half' | 'wide';
}
