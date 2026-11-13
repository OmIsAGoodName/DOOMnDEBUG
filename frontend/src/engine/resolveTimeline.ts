import type {
  Action,
  ActionMoveTo,
  AudioManifest,
  EpisodePlan,
  PlacedCharacter,
  Scene,
} from '@contracts';
import type {
  MoodName,
  ResolvedAction,
  ResolvedAudioEvent,
  ResolvedBeat,
  ResolvedChoicePoint,
  ResolvedScene,
  ResolvedTimeline,
} from './types';

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateSpeechDuration(text: string): number {
  const words = countWords(text);
  return words / 2.6 + 0.3;
}

export function resolveTimeline(
  plan: EpisodePlan,
  audio: AudioManifest | null,
  chosenOptionIds: string[] = []
): ResolvedTimeline {
  const scenesMap = new Map<string, Scene>();
  for (const s of plan.scenes) {
    scenesMap.set(s.scene_id, s);
  }

  const audioLinesMap = new Map<string, number>(); // line_id -> duration in seconds
  if (audio && audio.lines) {
    for (const line of audio.lines) {
      audioLinesMap.set(line.line_id, (line.duration_ms || 0) / 1000);
    }
  }

  const resolvedScenes: ResolvedScene[] = [];
  const allBeats: ResolvedBeat[] = [];
  const choicePoints: ResolvedChoicePoint[] = [];
  const audioEvents: ResolvedAudioEvent[] = [];
  const chosenPath: string[] = [...chosenOptionIds];

  let currentSceneId: string | null = plan.start_scene;
  let currentTime = 0;
  let choiceIndex = 0;

  const visitedScenes = new Set<string>();

  while (currentSceneId && !visitedScenes.has(currentSceneId)) {
    visitedScenes.add(currentSceneId);
    const scene = scenesMap.get(currentSceneId);
    if (!scene) {
      console.warn(`[resolveTimeline] Scene ${currentSceneId} not found in plan`);
      break;
    }

    const sceneStartTime = currentTime;
    const resolvedBeats: ResolvedBeat[] = [];

    let nextSceneId: string | null = scene.next_scene ?? null;

    for (const beat of scene.beats) {
      const beatStartTime = currentTime;
      const lineId = `${plan.episode_id}:${scene.scene_id}:${beat.beat_id}`;

      let speechDuration = 0;
      let isEstimated = false;

      if (beat.speech && beat.speech.text) {
        if (audioLinesMap.has(lineId)) {
          speechDuration = audioLinesMap.get(lineId)!;
        } else {
          speechDuration = estimateSpeechDuration(beat.speech.text);
          isEstimated = true;
        }

        // Register speech audio event
        if (audio && audio.lines) {
          const line = audio.lines.find((l) => l.line_id === lineId);
          if (line) {
            audioEvents.push({
              type: 'speech',
              id: lineId,
              url: line.url,
              startTime: beatStartTime,
              duration: speechDuration,
            });
          }
        }
      }

      // Resolve beat actions
      let latestActionEnd = 0;
      const resolvedActions: ResolvedAction[] = [];

      if (beat.actions) {
        for (let i = 0; i < beat.actions.length; i++) {
          const action = beat.actions[i];
          const delay = action.delay ?? 0;
          let duration = action.duration ?? 0;

          if (action.type === 'MOVE_TO') {
            duration = action.duration;
          } else if (action.type === 'WAIT') {
            duration = action.duration;
          } else if (action.type === 'PLAY_MUSIC' && !action.duration) {
            duration = 0;
          }

          const actionStart = beatStartTime + delay;
          const actionEnd = actionStart + duration;
          if (actionEnd - beatStartTime > latestActionEnd) {
            latestActionEnd = actionEnd - beatStartTime;
          }

          resolvedActions.push({
            id: `${beat.beat_id}_act_${i}`,
            action,
            startTime: actionStart,
            endTime: actionEnd,
            duration,
          });

          // Music/SFX audio events
          if (action.type === 'PLAY_MUSIC') {
            if (action.music_id && audio?.music) {
              const m = audio.music.find((item) => item.music_id === action.music_id);
              if (m) {
                audioEvents.push({
                  type: 'music',
                  id: action.music_id,
                  url: m.url,
                  startTime: actionStart,
                  volume: action.volume,
                  fade: action.fade,
                  loop: true,
                });
              }
            }
          } else if (action.type === 'PLAY_SFX') {
            if (action.sfx_id && audio?.sfx) {
              const s = audio.sfx.find((item) => item.sfx_id === action.sfx_id);
              if (s) {
                audioEvents.push({
                  type: 'sfx',
                  id: action.sfx_id,
                  url: s.url,
                  startTime: actionStart,
                  volume: action.volume,
                });
              }
            }
          }
        }
      }

      // Beat duration = max(speech + 0.3, latest action end, min_duration, 1.0)
      const speechWithPadding = speechDuration > 0 ? speechDuration + 0.3 : 0;
      const minDur = beat.min_duration ?? 0;
      const beatDuration = Math.max(speechWithPadding, latestActionEnd, minDur, 1.0);
      const beatEndTime = beatStartTime + beatDuration;

      let listeningStart: number | undefined;

      if (beat.choice) {
        // Listening begins after speech finishes or latest action finishes
        listeningStart = beatStartTime + Math.max(speechDuration, latestActionEnd);

        // Determine choice branch: from chosenOptionIds or choice.default
        let chosenId: string;
        if (choiceIndex < chosenPath.length) {
          chosenId = chosenPath[choiceIndex];
        } else {
          chosenId = beat.choice.default;
          chosenPath.push(chosenId);
        }
        choiceIndex++;

        const opt = beat.choice.options.find((o) => o.id === chosenId) || beat.choice.options[0];
        if (opt) {
          nextSceneId = opt.next_scene;
        }

        choicePoints.push({
          choiceBeatId: beat.beat_id,
          sceneId: scene.scene_id,
          listeningStartTime: listeningStart,
          options: beat.choice.options,
          defaultOptionId: beat.choice.default,
          prompt: beat.speech?.text || 'What should happen next?',
        });
      }

      const resBeat: ResolvedBeat = {
        beatId: beat.beat_id,
        sceneId: scene.scene_id,
        startTime: beatStartTime,
        endTime: beatEndTime,
        duration: beatDuration,
        speech: beat.speech,
        lineId: beat.speech ? lineId : undefined,
        speechDuration: speechDuration > 0 ? speechDuration : undefined,
        estimatedSpeech: isEstimated,
        actions: resolvedActions,
        choice: beat.choice,
        listeningStartTime: listeningStart,
      };

      resolvedBeats.push(resBeat);
      allBeats.push(resBeat);
      currentTime = beatEndTime;
    }

    const sceneEndTime = currentTime;
    resolvedScenes.push({
      sceneId: scene.scene_id,
      backgroundId: scene.background_id,
      mood: (scene.mood as MoodName) || 'day',
      startTime: sceneStartTime,
      endTime: sceneEndTime,
      duration: sceneEndTime - sceneStartTime,
      nextSceneId,
      beats: resolvedBeats,
      initialCharacters: scene.characters || [],
      initialProps: scene.props || [],
    });

    currentSceneId = nextSceneId;
  }

  return {
    episodeId: plan.episode_id,
    title: plan.title,
    totalDuration: currentTime,
    scenes: resolvedScenes,
    beats: allBeats,
    choicePoints,
    chosenPath,
    audioEvents,
    plan,
    audioManifest: audio,
  };
}

/**
 * Re-resolves the timeline from a choice point onward, preserving all past events.
 */
export function resolveFrom(
  timeline: ResolvedTimeline,
  choiceBeatId: string,
  optionId: string
): ResolvedTimeline {
  // Find choice beat index
  const choiceIdx = timeline.choicePoints.findIndex((cp) => cp.choiceBeatId === choiceBeatId);
  const newChosenPath = [...timeline.chosenPath];
  if (choiceIdx >= 0) {
    newChosenPath[choiceIdx] = optionId;
    newChosenPath.splice(choiceIdx + 1); // truncate subsequent choices
  } else {
    newChosenPath.push(optionId);
  }

  return resolveTimeline(timeline.plan, timeline.audioManifest, newChosenPath);
}

/**
 * Evaluates character state (position, animation, expression, facing, visibility) at time t.
 */
export function evaluateCharacterState(
  scene: ResolvedScene,
  charId: string,
  initialChar: PlacedCharacter,
  t: number
): {
  x: number;
  y: number;
  facing: 'left' | 'right';
  expression: string;
  animation: string;
  animStartTime: number;
  scale: number;
  visible: boolean;
  alpha: number;
} {
  let x = initialChar.position[0];
  let y = initialChar.position[1];
  let facing: 'left' | 'right' = initialChar.facing || 'right';
  let expression = initialChar.expression || 'neutral';
  let animation = initialChar.animation || 'idle';
  let animStartTime = scene.startTime;
  let visible = true;
  let alpha = 1.0;

  // Process all beats and actions in this scene up to t
  for (const beat of scene.beats) {
    if (t < beat.startTime) break;

    // Check beat speech (SPEAK sets talking animation and expression)
    if (beat.speech && beat.speech.type === 'SPEAK' && beat.speech.character_id === charId) {
      if (t >= beat.startTime && t < beat.endTime) {
        animation = 'talk';
        animStartTime = beat.startTime;
        if (beat.speech.expression) {
          expression = beat.speech.expression;
        }
      }
    }

    // Process actions
    for (const act of beat.actions) {
      const a = act.action;
      if (!('character_id' in a) || a.character_id !== charId) continue;

      if (a.type === 'SPAWN_CHARACTER') {
        if (t >= act.startTime) {
          x = a.position[0];
          y = a.position[1];
          if (a.facing) facing = a.facing;
          if (a.expression) expression = a.expression;
          if (a.animation) {
            animation = a.animation;
            animStartTime = act.startTime;
          }
          visible = true;

          // Entrance animation
          if (a.entrance === 'fade' && act.duration && t < act.endTime) {
            alpha = Math.min(1, Math.max(0, (t - act.startTime) / act.duration));
          } else if (a.entrance === 'pop' && act.duration && t < act.endTime) {
            alpha = 1;
          }
        } else {
          visible = false;
        }
      } else if (a.type === 'REMOVE_CHARACTER') {
        if (t >= act.endTime) {
          visible = false;
        } else if (t >= act.startTime && a.exit === 'fade' && act.duration) {
          alpha = Math.max(0, 1 - (t - act.startTime) / act.duration);
        }
      } else if (a.type === 'MOVE_TO') {
        const moveTo = a as ActionMoveTo;
        if (t >= act.startTime && t < act.endTime) {
          const progress = act.duration > 0 ? (t - act.startTime) / act.duration : 1;
          const startX = x;
          const startY = y;
          const targetX = moveTo.to[0];
          const targetY = moveTo.to[1];

          x = startX + (targetX - startX) * progress;
          y = startY + (targetY - startY) * progress;
          facing = targetX >= startX ? 'right' : 'left';
          animation = 'walk';
          animStartTime = act.startTime;
        } else if (t >= act.endTime) {
          x = moveTo.to[0];
          y = moveTo.to[1];
          if (animation === 'walk') {
            animation = 'idle';
            animStartTime = act.endTime;
          }
        }
      } else if (a.type === 'SET_EXPRESSION') {
        if (t >= act.startTime) {
          expression = a.expression;
        }
      } else if (a.type === 'PLAY_ANIMATION') {
        if (t >= act.startTime) {
          if (!act.duration || t < act.endTime) {
            animation = a.animation;
            animStartTime = act.startTime;
          } else {
            animation = 'idle';
            animStartTime = act.endTime;
          }
        }
      }
    }
  }

  // Calculate depth scale: scale = lerp(0.8, 1.15, clamp((y - 0.62) / 0.30))
  const depthFactor = Math.max(0, Math.min(1, (y - 0.62) / 0.3));
  const scale = 0.8 + depthFactor * (1.15 - 0.8);

  return {
    x,
    y,
    facing,
    expression,
    animation,
    animStartTime,
    scale,
    visible,
    alpha,
  };
}

