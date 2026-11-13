# Status: Maegan

## Done
- **M1.1 Scaffold Verification**: Confirmed `@contracts`, `@fixtures`, and art stubs in `@/characters`, `@/backgrounds`, and `@/props` match the frozen contracts.
- **M1.2 Timeline Resolver (`frontend/src/engine/resolveTimeline.ts`)**: Pure timeline computation, beat duration algorithm (`max(speech + 0.3s, action_end, min_duration, 1.0s)`), speech estimation (`words / 2.6 + 0.3s`), and `resolveFrom` dynamic choice re-resolution. 6 unit tests passing.
- **M1.3 Pure Renderer (`frontend/src/engine/renderAt.ts`)**: Deterministic 1280x720 canvas renderer, camera zoom/pan, depth sorting by character Y, horizontal mirroring for `facing: left`, mood tint overlay from `vocab.json`, captions, and non-throwing placeholder fallback for unknown IDs. 3 unit tests passing.
- **M1.4 Master Clock & `<EpisodePlayer>` (`frontend/src/engine/EpisodePlayer.tsx`)**: React component implementing `EpisodePlayerHandle` (`play`, `pause`, `seek`, `resolveChoice`, `startRecording`, `stopRecording`, `getTime`, `getDuration`, `getChosenPath`), clamped delta clock, and "Tap to start" AudioContext unlock. 1 unit test passing.
- **M1.5 Audio Engine (`frontend/src/engine/audio/engine.ts`)**: Web Audio pipeline with manifest decoding (concurrency 4), speech scheduling, music ducking (-12dB under speech), SFX triggers, and recording destination node.
- **M1.6 Lip-sync (`frontend/src/engine/audio/lipsync.ts`)**: 50ms window RMS calculation, 95th percentile normalization, hysteresis hold (80ms), and deterministic fallback cycling. 4 unit tests passing.
- **M1.7 Dev Harness (`frontend/src/engine/dev/Harness.tsx`)**: Interactive test environment at `/dev/engine` with quick/live fixture picker, scrubbing with scene tick marks, debug overlay (FPS, frame time ms, timeline state), interactive choice resolution, and WebM recording/downloading.
- All 15 engine unit tests pass; TypeScript typecheck passes with 0 errors.

## In progress
- Complete on PART 1. Paused per instruction ("dont run any other prompt till i say").

## Next
- PART 2: Features and polish (M2.1 remaining commands: INTERACT sequences, props attachment; M2.2 advanced karaoke captions).
- PART 3: Live Mode (`frontend/src/live/`).

## Blockers
- None.

## Requests
- None.

## Contract proposals
- None.
