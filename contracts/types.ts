export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  outline: string;
};

export type VoiceConfig = {
  engine_voice: string;
  rate?: string;
  pitch?: string;
};

export type CastMember = {
  character_id: string;
  name: string;
  species: string;
  palette: Palette;
  accessories?: string[];
  voice: VoiceConfig;
};

export type ActionSpawnCharacter = {
  type: 'SPAWN_CHARACTER';
  character_id: string;
  position: [number, number];
  facing?: 'left' | 'right';
  expression?: string;
  animation?: string;
  entrance?: 'fade' | 'slide_left' | 'slide_right' | 'pop';
  delay?: number;
  duration?: number;
};

export type ActionRemoveCharacter = {
  type: 'REMOVE_CHARACTER';
  character_id: string;
  exit?: 'fade' | 'slide_left' | 'slide_right';
  delay?: number;
  duration?: number;
};

export type ActionMoveTo = {
  type: 'MOVE_TO';
  character_id: string;
  to: [number, number];
  duration: number;
  delay?: number;
};

export type ActionPlayAnimation = {
  type: 'PLAY_ANIMATION';
  character_id: string;
  animation: string;
  loop?: boolean;
  delay?: number;
  duration?: number;
};

export type ActionSetExpression = {
  type: 'SET_EXPRESSION';
  character_id: string;
  expression: string;
  delay?: number;
  duration?: number;
};

export type ActionSetCamera = {
  type: 'SET_CAMERA';
  shot: 'wide' | 'medium' | 'close';
  movement: 'static' | 'slow_push_in' | 'slow_pull_out' | 'pan_left' | 'pan_right';
  focus_character_id?: string;
  delay?: number;
  duration?: number;
};

export type ActionSetMood = {
  type: 'SET_MOOD';
  mood: 'day' | 'sunset' | 'night' | 'cozy' | 'magical';
  transition?: number;
  delay?: number;
  duration?: number;
};

export type ActionAttachProp = {
  type: 'ATTACH_PROP';
  prop_id: string;
  character_id?: string;
  position?: [number, number];
  slot?: 'hand' | 'head' | 'ground';
  remove?: boolean;
  delay?: number;
  duration?: number;
};

export type ActionInteract = {
  type: 'INTERACT';
  kind: 'wave_at' | 'high_five' | 'hand_off' | 'hug';
  character_id: string;
  target_id: string;
  prop_id?: string;
  delay?: number;
  duration?: number;
};

export type ActionPlaySfx = {
  type: 'PLAY_SFX';
  sfx_id: string;
  volume?: number;
  delay?: number;
  duration?: number;
};

export type ActionPlayMusic = {
  type: 'PLAY_MUSIC';
  music_id: string | null;
  volume?: number;
  fade?: number;
  delay?: number;
  duration?: number;
};

export type ActionWait = {
  type: 'WAIT';
  duration: number;
  delay?: number;
};

export type Action =
  | ActionSpawnCharacter
  | ActionRemoveCharacter
  | ActionMoveTo
  | ActionPlayAnimation
  | ActionSetExpression
  | ActionSetCamera
  | ActionSetMood
  | ActionAttachProp
  | ActionInteract
  | ActionPlaySfx
  | ActionPlayMusic
  | ActionWait;

export type ChoiceOption = {
  id: string;
  label: string;
  keywords?: string[];
  next_scene: string;
};

export type Choice = {
  options: ChoiceOption[];
  default: string;
};

export type Speech = {
  type: 'NARRATE' | 'SPEAK';
  text: string;
  character_id?: string;
  expression?: string;
};

export type Beat = {
  beat_id: string;
  speech?: Speech;
  actions?: Action[];
  choice?: Choice;
  min_duration?: number;
};

export type PlacedProp = {
  prop_id: string;
  position: [number, number];
};

export type PlacedCharacter = {
  character_id: string;
  position: [number, number];
  facing?: 'left' | 'right';
  expression?: string;
  animation?: string;
};

export type Scene = {
  scene_id: string;
  background_id: string;
  mood: string;
  next_scene?: string | null;
  props?: PlacedProp[];
  characters?: PlacedCharacter[];
  beats: Beat[];
};

export type SafetyVerdict = {
  age_fit: number;
  scary: number;
  verdict: 'pass' | 'needs_review' | 'fail';
  notes: string;
};

export type ContinuityReport = {
  violations: string[];
};

export type EpisodePlan = {
  schema_version: string;
  episode_id: string;
  series_id?: string | null;
  age_band: '3-5' | '4-6' | '6-8';
  language?: string;
  title: string;
  start_scene: string;
  interactive: boolean;
  cast: CastMember[];
  scenes: Scene[];
  safety?: SafetyVerdict;
  continuity?: ContinuityReport;
};

export type WordTiming = {
  text: string;
  start_ms: number;
  end_ms: number;
};

export type AudioLine = {
  line_id: string;
  scene_id: string;
  beat_id: string;
  speaker: string;
  url: string;
  duration_ms: number;
  words?: WordTiming[];
};

export type AudioAsset = {
  music_id?: string;
  sfx_id?: string;
  url: string;
};

export type AudioManifest = {
  episode_id: string;
  lines: AudioLine[];
  music?: { music_id: string; url: string }[];
  sfx?: { sfx_id: string; url: string }[];
};

export type ChoiceInfo = {
  choice: Choice;
  sceneId: string;
  beatId: string;
};

export interface EpisodePlayerProps {
  plan: EpisodePlan;
  audio: AudioManifest | null;
  mode: 'watch' | 'live';
  choicePath?: string[];
  captions?: boolean;
  muted?: boolean;
  onChoice?: (c: ChoiceInfo) => void;
  onEnd?: () => void;
  onError?: (e: Error) => void;
}

export interface EpisodePlayerHandle {
  play(): void;
  pause(): void;
  seek(t: number): void;
  resolveChoice(optionId: string): void;
  startRecording(opts?: { muteLocal?: boolean }): void;
  stopRecording(): Promise<Blob>;
  getTime(): number;
  getDuration(): number;
  getChosenPath(): string[];
}

export interface CharacterDrawState {
  characterId: string;
  species: string;
  x: number;
  y: number;
  scale: number;
  facing: 'right' | 'left';
  palette: Palette;
  accessories: string[];
  expression: string;
  mouth: 'closed' | 'half' | 'wide';
  pose: string;
  poseT: number;
  time: number;
}

export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface EpisodeRecord {
  id: string;
  title: string;
  plan?: EpisodePlan;
  safety?: SafetyVerdict;
  continuity?: ContinuityReport;
  audio_manifest?: AudioManifest;
  status: 'draft' | 'ready' | 'needs_review' | 'failed';
  video_url?: string | null;
  created_at?: string;
}

export interface Series {
  id: string;
  title: string;
  world: {
    setting: string;
    rules?: string[];
  };
  tone: string;
  age_band: '3-5' | '4-6' | '6-8';
  language?: string;
  character_ids: string[];
  created_at?: string;
}

export interface CharacterRecord {
  id: string;
  name: string;
  species: string;
  series_id?: string | null;
  slug?: string;
  bible: {
    id: string;
    name: string;
    species: string;
    personality: string[];
    catchphrases?: string[];
    voice: VoiceConfig;
    look: {
      palette: Palette;
      accessories: string[];
    };
    rules?: string[];
    animations?: string[];
    expressions?: string[];
  };
  created_at?: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  account_type: 'parent' | 'creator' | 'school';
  created_at?: string;
}

export interface DataRepo {
  listSeries(): Promise<Series[]>;
  getSeries(id: string): Promise<Series | null>;
  saveSeries(series: Partial<Series> & { title: string }): Promise<Series>;
  deleteSeries(id: string): Promise<void>;
  listCharacters(seriesId?: string): Promise<CharacterRecord[]>;
  saveCharacter(char: Partial<CharacterRecord> & { name: string; species: string }): Promise<CharacterRecord>;
  deleteCharacter(id: string): Promise<void>;
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
}
