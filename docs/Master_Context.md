# VoxFable: MASTER CONTEXT

> **For the AI reading this:** This is the single source of truth for VoxFable. You have no memory of earlier chats, so treat everything below as established and do not ask the team to re-explain it.
> - This file **supersedes** `context (4).md`, `CONTEXT.md` and `CWC_Idea_Final.md`. The old "3D storytelling studio" document is background only.
> - If a person's message conflicts with this file, **the message wins**. Ask them to confirm, then output a short **Context update** block (format in section 14.4) so it can be pasted back here.
> - Never silently treat a "Proposed" item as built or tested. Never change a frozen contract without a request (section 14.3).
> - Time is the scarcest resource. Prefer the simplest thing that works, keep `main` runnable, and say honestly when something is broken or unproven.

---

## 0. Quick Facts

| Item | Value |
|---|---|
| App name | **VoxFable** |
| Event | 24-hour hackathon, **PS 16: AI Children's Animation Studio** |
| Time left when this file was written | **about 21h30m** (2026-11-13). All "H+n" below count from that moment. Deadline = **H+21:30**. |
| Team | **Om** (main dev, lead), **Maegan** (engine), **Nigel** (art + UI + pitch) |
| Sync | GitHub monorepo, each person uses their **own Antigravity agent** |
| Demo machine | **Om's laptop** (confirm it is a laptop and its specs by H+2) |
| Dev laptop reference | ASUS TUF, RTX 4050 6 GB, 16 GB RAM (the 2D engine is light; do not rely on large local models) |
| Judging criteria / organizer | **UNKNOWN. Fill in when known:** `________` |
| Working style | Quality over quantity; brief options then detail; honest about flaws; concise; update this file after every decision |

---

## 1. Team, Roles and Ownership

| Person | Role | Owns (edits only these) | Main deliverables |
|---|---|---|---|
| **Om** | Lead, main dev, **demo operator** | `contracts/`, `fixtures/`, `backend/`, `supabase/`, `scripts/`, `docs/` (except files owned by others), `frontend/src/lib/`, `frontend/src/auth/`, `frontend/src/config/`, root config (`package.json`, vite/tailwind config, router, `.env.example`, `AGENTS.md`, `.agents/rules/`), `demo/preflight` | Repo + contracts, Supabase schema, FastAPI, LLM adapter, Story Writer + Director, validator + resolver, TTS, continuity + safety, batch generation, FFmpeg export, bundled demo episodes, integration, pre-flight |
| **Maegan** | Engine | `frontend/src/engine/`, `frontend/src/live/`, `docs/status/maegan.md` | Canvas 2D renderer, beat timeline, animation state machine, audio sync, lip-sync, captions, Live Mode (listening, mic, tap, matching), recording/export client |
| **Nigel** | Art, UI, pitch | `frontend/src/characters/`, `backgrounds/`, `props/`, `ui/`, `studio/`, `pages/` (incl. `pages/auth/`), `assets/` (art, metadata, audio), `demo/` (deck, script), `README.md`, `docs/DEMO.md`, `docs/ART_STYLE.md`, `docs/status/nigel.md` | Characters, backgrounds, props, asset metadata, music/SFX, login/signup pages, Quick Story page, Studio UI, pitch deck, demo script, README |

**Stubs rule:** In Push #1 Om creates placeholder files inside Maegan's and Nigel's folders (so routes and imports work on day one). From that moment the folder owner owns them and Om does not touch them again.

**Dependencies rule:** Anyone may add an npm/pip dependency in a small, separate commit. Run `git pull --rebase origin main` first, push right away, and note it in your status file. On a lockfile conflict take `main`'s lockfile and re-run `npm install`.

**Load balancing (Om is the bottleneck):** If Om is behind at H+7, spill over in this order:
1. Maegan takes the **FFmpeg export endpoint** (`POST /api/episodes/{id}/export`) because she owns the recording client.
2. Nigel takes writing **README, DEMO.md, preflight docs** (already his) and the **bake-script checklist**.
3. Nigel or Maegan takes the **Supabase two-account RLS test**.
Om must announce the hand-off in `docs/status/om.md`.

---

## 2. The Hackathon (PS 16)

**Problem:** Animated kids' videos need expensive teams, time and creative skills. **Customers:** parents, YouTube creators, studios, publishers, schools, edu-content companies. **Revenue ideas:** subscriptions, video credits, licensing, marketplace commissions, enterprise plans. **MVP asked for:** short animated stories with recurring characters, voiceovers and downloadable videos. **Warning in the brief:** competition and content rights need care.

---

## 3. The Idea: VoxFable

**Pitch:** An AI cartoon studio for children. Type one story idea and get a finished, narrated, consistent animated episode in minutes. Then the child talks to the cartoon and changes the story live, or a creator generates a whole season in one click.

| Mode | What happens |
|---|---|
| **Quick Story** | One prompt, Generate, progress stages, play, download MP4. The user never sees JSON. |
| **Live Mode** (The Cartoon That Listens) | At 2-3 choice points a character asks, the child answers by voice (tap buttons are always visible), the story branches. |
| **Studio Mode** (Showrunner) | Define a series (character bible, world rules), click "generate N episodes" (season outline, then episodes), continuity and safety badges on each. |

**Why it wins:** any-judge-prompt demo; talk-to-the-cartoon demo; one-click season; characters never drift (programmatic art); safety gate and original assets answer the rights warning; low marginal cost.
**Parked/stretch:** 3D Three.js renderer (only after MVP and only if a spike works), multilingual voices, character marketplace, Supabase Storage for media, deterministic frame-by-frame export.

---

## 4. Design Principles (non-negotiable)

1. **No asset generation during a live request.** Assets are prepared beforehand. Recolor, accessory and name changes are parameter changes and are fine.
2. **Never execute LLM-written code.** The LLM only produces JSON in the validated instruction language.
3. **Character identity is fixed** across scenes and episodes.
4. **The renderer is a pure function of time** (`renderAt(t)`), so seek and recording are deterministic.
5. **Cache everything** (LLM outputs, audio, mouth tracks). **Benchmark before promising speed.**
6. **Child-safe by default.**
7. **Contract-first.** Shared JSON contracts live in `contracts/`. Each agent edits only its own folders.
8. **Always keep a working fallback** (section 5.3). A failed live generation must never be the end of the demo.

---

## 5. Architecture

### 5.1 Stack (decided unless marked)

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind, vitest for unit tests |
| Renderer | **Canvas 2D** (so `canvas.captureStream()` recording works). Art is TypeScript drawing functions (canvas shapes and `Path2D`). |
| Backend | Python + FastAPI. Jobs, LLM, TTS, validation, FFmpeg. Media served from local disk `media/` on the demo laptop. |
| DB + Auth | **Supabase** (Postgres + Auth). Email/password via supabase-js. RLS on every table. See section 6. |
| LLM (proposed) | Provider adapter. **Gemini Flash free tier** default, **Groq** alternative, **Ollama** small model optional offline. Strict JSON, Pydantic validation, retries, cache, rate-limit queue. Same model for Writer and Director with different prompts. Model names come from env vars, never hardcoded. |
| Voice | **Edge-TTS** MP3 per line (cached) with word or sentence timings (estimate if unavailable). Do **not** use `window.speechSynthesis` for main voices. |
| Lip-sync | Client computes a mouth track from decoded audio (section 10.6). |
| Live input | Web Speech API (Chrome/Edge) + tap buttons always visible; keyword match first, then `POST /api/live/match`. |
| Export | Browser records canvas + audio (WebM), uploads to FastAPI, FFmpeg converts to MP4. Episodes are JSON, so playback is instant. Video is rendered lazily. |

### 5.2 Pipeline

`Story Writer -> Animation Director -> Validator + Asset Resolver -> Continuity Supervisor -> Safety Gate -> TTS -> Player -> Export`

### 5.3 Demo safety ladder (build and rehearse all levels)

| Level | Situation | What still works |
|---|---|---|
| **A** | Everything online | Full flow: login, generate, Live, Studio, export |
| **B** | No internet or Supabase/LLM down | Login via **"Continue in demo mode"**. Bundled episodes (plan + cached audio) play. Tap/keyword choices work. Export works through local FFmpeg. Studio UI shows saved/bundled episodes. *Optional:* generation via Ollama if a small local model proves reliable (**unproven**). |
| **C** | Backend dead | Bundled episodes play statically from `frontend/public/demo/`, and each has a **pre-baked MP4** so "Download" still works. |

---

## 6. Supabase Plan

**Keys:** Frontend uses the **publishable** key; backend uses the **secret** key (older docs call them `anon` / `service_role`). Never commit keys. `.env` files are git-ignored; `.env.example` is committed.

```text
frontend/.env   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE
backend/.env    SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_MODE, GEMINI_API_KEY, GEMINI_MODEL,
                GROQ_API_KEY, GROQ_MODEL, OLLAMA_URL, OLLAMA_MODEL, LLM_PROVIDER_ORDER, MEDIA_DIR
```

**Tables** (all have `owner_id uuid not null references auth.users(id)` unless noted):

| Table | Columns |
|---|---|
| `profiles` | `id uuid pk references auth.users on delete cascade`, `display_name text`, `account_type text check in ('parent','creator','school') default 'parent'`, `created_at` |
| `series` | `id uuid pk default gen_random_uuid()`, `owner_id`, `title`, `world jsonb`, `tone text`, `age_band text`, `language text default 'en'`, `created_at`, `updated_at` |
| `characters` | `id uuid pk`, `owner_id`, `series_id uuid null references series on delete set null`, `slug text` (stable id such as `pip_owl`), `name text`, `bible jsonb`, `created_at` |
| `episodes` | `id uuid pk`, `owner_id`, `series_id uuid null`, `generation_id uuid null`, `episode_no int null`, `title text`, `plan jsonb`, `safety jsonb`, `continuity jsonb`, `audio_manifest jsonb`, `status text check in ('draft','ready','needs_review','failed')`, `video_path text null`, `created_at` |
| `generations` | `id uuid pk`, `owner_id`, `kind text check in ('quick','batch')`, `prompt text null`, `series_id uuid null`, `count int null`, `status text check in ('queued','running','succeeded','failed')`, `stage text`, `progress int null`, `episode_ids uuid[] default '{}'`, `error text null`, `created_at`, `updated_at` |

**RLS:** enabled on every table. Policies `for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())`. `profiles`: `id = auth.uid()`. A trigger on `auth.users` inserts a `profiles` row (reading `display_name` and `account_type` from `raw_user_meta_data`). The backend uses the secret key (bypasses RLS) and **always sets `owner_id` from the verified token**.
**Backend auth:** reads `Authorization: Bearer <access token>` and verifies it through Supabase Auth (`auth.get_user(token)`). `DEMO_MODE=true` skips verification and uses a local-file repository with owner `demo`.
**Dashboard steps (manual, Om):** create the project **early** (free projects can pause), turn **email confirmation off** for the demo (menu names shift: Authentication, Sign In / Providers, Email), copy URL + keys, open the project once before the demo.
**Media:** audio and video stay on the demo laptop's disk (`media/`) and are referenced by relative path. Supabase Storage is a stretch.
**Data-layer split (decided):**
- **Series, characters, profile:** read and written by the **frontend** through the `DataRepo` interface (`SupabaseRepo` when logged in, `LocalRepo` in demo mode, backed by localStorage).
- **Episodes and generations:** written by the **backend**; the frontend reads them **only through the API** (`GET /api/episodes...`), in both modes. Batch generation requests carry the **series and characters inline**, so the backend never needs to read the user's series.
**Auth UX:** Login, Signup (display name + account type), route guard, "Continue in demo mode", logout. `useAuth()` from `frontend/src/auth/`.
**Risks:** internet dependence (demo mode), RLS mistakes (test with **two accounts**), free-project pausing, key leakage.

---

## 7. Shared Vocabulary (`contracts/vocab.json`, frozen by Om)

| Group | Values |
|---|---|
| Commands | `SPAWN_CHARACTER, REMOVE_CHARACTER, MOVE_TO, PLAY_ANIMATION, SET_EXPRESSION, SET_CAMERA, SET_MOOD, ATTACH_PROP, INTERACT, PLAY_SFX, PLAY_MUSIC, WAIT` |
| Speech types | `NARRATE`, `SPEAK` |
| Animations (poses) | `idle, walk, talk, wave, laugh, listen, react, point` |
| Expressions | `neutral, happy, sad, surprised, worried, excited` |
| Mouth shapes | `closed, half, wide` |
| Facing | `left, right` |
| Camera shots | `wide (zoom 1.0), medium (1.35), close (1.8)` |
| Camera movements | `static, slow_push_in, slow_pull_out, pan_left, pan_right` |
| Moods (tint) | `day, sunset, night, cozy, magical` |
| Interact kinds | `wave_at, high_five, hand_off, hug` |
| Accessories | `scarf, glasses, hat, bow, backpack, cape` |
| Species (v1) | `owl, fox, kid` |
| Palette keys | `primary, secondary, accent, outline` (hex strings) |
| Age bands | `3-5, 4-6, 6-8` |
| Backgrounds (v1, proposed) | `forest_day, forest_night, meadow_day, treehouse_interior, village_street` |
| Default roster (v1, proposed names) | `pip_owl` (shy owl), `rusty_fox` (cheeky fox), `mia_kid` (curious kid) |
| Props (v1, proposed) | `lantern, key, treasure_chest, book, apple, basket, umbrella, balloon, flower, glowing_door, firefly_jar, kite` |
| SFX (v1, proposed) | `sfx_pop, sfx_whoosh, sfx_sparkle, sfx_door, sfx_giggle, sfx_footsteps, sfx_ding, sfx_wind, sfx_birds, sfx_splash` |
| Music (v1, proposed) | `music_cheerful, music_calm, music_mystery_soft, music_adventure` |
| Generation stages | `understanding, writing, planning, preparing, checking, narration, ready` (export: `recording, converting, done`) |
| Stage labels | Understanding your story / Writing the script / Planning the scenes / Preparing characters and locations / Checking continuity and safety / Generating narration / Your episode is ready; export: Rendering video / Finalising |

Names marked "proposed" may be renamed by Nigel (owner of `assets/metadata/`) as long as the metadata stays the single list the validator reads. **The validator reads `assets/metadata/*.json`, not hardcoded lists.**

---

## 8. Scene Plan (episode plan) Schema

**Why beats, not timestamps:** audio length is unknown when the plan is written. A beat has optional `speech`, `actions[]` (each with `delay` and `duration`), optional `choice`, and `min_duration`.
**Beat length** = `max(speech audio length + 0.3 s, latest action end, min_duration)`. If a line has no audio yet, estimate `words / 2.6 + 0.3 s`. Beats play in order; scenes follow `next_scene`.

```json
{
  "schema_version": "1.0",
  "episode_id": "ep_demo_live", "series_id": null, "age_band": "4-6", "language": "en",
  "title": "Pip and the Glowing Door", "start_scene": "sc1", "interactive": true,
  "cast": [
    { "character_id": "pip_owl", "name": "Pip", "species": "owl",
      "palette": { "primary": "#8b5e3c", "secondary": "#d9b38c", "accent": "#f2a65a", "outline": "#3b2a1e" },
      "accessories": ["scarf"],
      "voice": { "engine_voice": "en-US-AnaNeural", "rate": "+0%", "pitch": "+0Hz" } }
  ],
  "scenes": [{
    "scene_id": "sc1", "background_id": "forest_day", "mood": "day", "next_scene": null,
    "props": [ { "prop_id": "glowing_door", "position": [0.72, 0.78] } ],
    "characters": [ { "character_id": "pip_owl", "position": [0.25, 0.72], "facing": "right", "expression": "neutral", "animation": "idle" } ],
    "beats": [
      { "beat_id": "b1", "speech": { "type": "NARRATE", "text": "In the sleepy forest, Pip the owl found something strange." },
        "actions": [ { "type": "SET_CAMERA", "shot": "wide", "movement": "slow_push_in", "delay": 0, "duration": 4 },
                     { "type": "PLAY_MUSIC", "music_id": "music_calm", "volume": 0.25, "fade": 1.5, "delay": 0 } ],
        "min_duration": 2 },
      { "beat_id": "b2", "speech": { "type": "SPEAK", "character_id": "pip_owl", "text": "A glowing door!", "expression": "surprised" },
        "actions": [ { "type": "MOVE_TO", "character_id": "pip_owl", "to": [0.55, 0.74], "duration": 1.5, "delay": 0 },
                     { "type": "PLAY_SFX", "sfx_id": "sfx_sparkle", "delay": 0.2 } ] },
      { "beat_id": "b3", "speech": { "type": "SPEAK", "character_id": "pip_owl", "text": "Should I follow the firefly, or open the door?" },
        "choice": { "options": [
          { "id": "a", "label": "Follow the firefly", "keywords": ["firefly", "follow"], "next_scene": "sc2a" },
          { "id": "b", "label": "Open the door", "keywords": ["door", "open"], "next_scene": "sc2b" } ], "default": "a" } }
    ]
  }],
  "safety": { "age_fit": 0.0, "scary": 0.0, "verdict": "pass", "notes": "" },
  "continuity": { "violations": [] }
}
```

**Action shapes** (every action has `type`, optional `delay` (s, default 0) and optional `duration` (s)):

| Type | Fields |
|---|---|
| `SPAWN_CHARACTER` | `character_id, position, facing, expression, animation, entrance?: fade\|slide_left\|slide_right\|pop` |
| `REMOVE_CHARACTER` | `character_id, exit?: fade\|slide_left\|slide_right` |
| `MOVE_TO` | `character_id, to:[x,y], duration` (engine plays `walk`, turns to face travel direction, returns to `idle`) |
| `PLAY_ANIMATION` | `character_id, animation, loop?` |
| `SET_EXPRESSION` | `character_id, expression` |
| `SET_CAMERA` | `shot, movement, focus_character_id?` |
| `SET_MOOD` | `mood, transition?` (seconds) |
| `ATTACH_PROP` | `prop_id, character_id?, position?, slot?: hand\|head\|ground, remove?: boolean` |
| `INTERACT` | `kind, character_id, target_id, prop_id?` |
| `PLAY_SFX` | `sfx_id, volume?` |
| `PLAY_MUSIC` | `music_id (null = stop), volume, fade` |
| `WAIT` | `duration` |

**Plan rules (validator enforces and repairs):**
- Coordinates are **normalized** `[x, y]` in `0..1`. `y` is the character's **feet** position and is clamped to the ground band `0.62..0.92`; `x` to `0.05..0.95`.
- A `choice` beat is the **last beat of its scene**. Every `next_scene` must exist. Every scene must be reachable. Interactive episodes have **2-3 choice points**; branches may reconverge on a shared ending scene.
- Limits (defaults): up to 6 scenes on the main path, up to 8 beats per scene, speech up to 25 words for age band `4-6`, episode 40-90 s for Quick Story.
- Every `character_id` must be in `cast` and in the asset metadata. Every `*_id` must exist in `assets/metadata/`. The validator **never** lets an invented ID crash a job (fallback ladder: exact match, similar asset, adapt, rewrite scene).
- `episode_id` equals the database episode id in production; fixtures use readable ids.

**Character bible** (stored in `characters.bible`): `{ id, name, species, personality[], catchphrases[], voice{engine_voice, rate, pitch}, look{palette, accessories[]}, rules[], animations[], expressions[] }`.
**Series:** `{ id, title, world{setting, rules[]}, tone, age_band, language, character_ids[] }`.
**Audio manifest:**
```json
{ "episode_id": "ep_demo_live",
  "lines": [ { "line_id": "ep_demo_live:sc1:b1", "scene_id": "sc1", "beat_id": "b1", "speaker": "narrator",
               "url": "/media/audio/ab12cd.mp3", "duration_ms": 3400,
               "words": [ { "text": "In", "start_ms": 0, "end_ms": 180 } ] } ],
  "music": [ { "music_id": "music_calm", "url": "/assets/audio/music/calm.mp3" } ],
  "sfx":   [ { "sfx_id": "sfx_sparkle", "url": "/assets/audio/sfx/sparkle.mp3" } ] }
```
`line_id` = `{episode_id}:{scene_id}:{beat_id}`. `speaker` is `"narrator"` or a `character_id`. `words` may be empty (engine then estimates). Audio URLs are either `/media/...` (backend) or `/demo/...` (bundled) or `/assets/...`; the engine uses them as given.

---

## 9. Backend API (Om) and Pipeline Rules

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | `{ok, mode: online\|demo, supabase: bool, llm: provider/name, ffmpeg: bool}` |
| `POST /api/generations` | `{kind: quick\|batch, prompt?, series?, characters?, count?, age_band?, language?, interactive?}` returns `{generation_id, status}` |
| `GET /api/generations/{id}` | `{id, kind, status, stage, progress (null unless measurable), episode_ids[], error}` |
| `GET /api/episodes`, `GET /api/episodes/{id}` | Episode record: `{id, title, plan, safety, continuity, audio_manifest, status, video_url}` |
| `POST /api/live/match` | `{prompt, options:[{id,label,keywords}], transcript}` returns `{option_id, confidence, method: keyword\|llm\|default}` |
| `POST /api/episodes/{id}/export` | multipart `file` (WebM) returns `{export_id}` |
| `GET /api/exports/{export_id}` | `{status: queued\|running\|done\|failed, mp4_url, error}` |
| Static | `/media/*` (audio, exports), served from `MEDIA_DIR` |

Auth header `Authorization: Bearer <Supabase access token>`. Typed client in `frontend/src/lib/api.ts`. Errors are JSON `{error: {code, message}}`. Exact schemas are frozen in `contracts/` by Om.

**Pipeline stations:**
1. **Story Writer** (LLM): hook, setup, conflict, escalation, payoff; picks characters from the roster or series; locations from the library; narration and dialogue; scene list; for interactive episodes 2-3 choice points. Child-appropriate and age band applied.
2. **Animation Director** (LLM): turns each scene into plan JSON using only existing asset IDs. Scenes are directed **in parallel**, then stitched.
3. **Validator + Resolver** (code, not AI): schema, ID checks, ranges, repair, fallback ladder.
4. **Continuity Supervisor:** checks scenes against the character bible (personality, catchphrases, rules); one rewrite pass on violations.
5. **Safety Gate:** keyword blocklist + reading-level check + LLM judge scores (`age_fit`, `scary`); fail means regenerate that scene once; still failing means `needs_review` (red badge).
6. **TTS:** Edge-TTS per line, cache by `sha256(text+voice+rate+pitch)`, word timings, duration, manifest.
7. **Export:** receives WebM, FFmpeg to MP4 (H.264/AAC, 1280x720, `yuv420p`, `+faststart`).
**LLM rules:** strict JSON, schema validation, retries with the validation error fed back, cache by hash, concurrency limit, provider order from env. Targets (unverified, benchmark first): plan ready in about 1-2 minutes.

---

## 10. Engine Spec (Maegan) and Component Interfaces

### 10.1 Interface (frozen in `contracts/`)
```ts
<EpisodePlayer
  plan={EpisodePlan} audio={AudioManifest | null} mode="watch" | "live"
  choicePath?={string[]}  captions?={boolean}  muted?={boolean}
  onChoice?={(c: ChoiceInfo) => void}  onEnd?={() => void}  onError?={(e: Error) => void}
  ref={EpisodePlayerHandle} />

interface EpisodePlayerHandle {
  play(): void; pause(): void; seek(t: number): void;
  resolveChoice(optionId: string): void;
  startRecording(opts?: { muteLocal?: boolean }): void;
  stopRecording(): Promise<Blob>;
  getTime(): number; getDuration(): number; getChosenPath(): string[];
}
```
The **engine** has no Supabase code and no backend API calls. It may only load the media URLs it is handed (audio files) with `fetch` for decoding. The **`live/`** module may use `frontend/src/lib/api.ts`.

### 10.2 Canvas and coordinates
Logical canvas **1280x720** (16:9), scaled by CSS and devicePixelRatio. Normalized plan coordinates map to this size. Depth scale (tunable): `scale = lerp(0.8, 1.15, clamp((y - 0.62) / 0.30))`. At scale 1 a character is about 300 px tall with the origin at the **feet center**.

### 10.3 Timeline
The engine resolves plan + audio durations into a timeline of scenes and beats with absolute times. At a choice, the clock goes into **LISTENING** and calls `onChoice`. When `resolveChoice` arrives, the timeline is **re-resolved from that point** along the chosen branch. `renderAt(ctx, resolved, t)` is a pure function of the resolved timeline and `t`. In `watch` mode choices auto-resolve (to `choicePath` or the default).

### 10.4 Render order
Background, props, characters (sorted by `y`), mood tint overlay (engine-owned), captions, scene cross-fade (0.5 s). Camera is a zoom and pan transform on the world layer.

### 10.5 State machine
`idle, walking, talking, listening, reacting, interacting`. No contradictory states (cannot walk and wave at once; talk overlays idle). The `listening` state is Live Mode's home. After a choice resolves, the character plays `react`.

### 10.6 Lip-sync
Decode each speech MP3 with Web Audio. Compute RMS every 50 ms. Normalize by the line's 95th percentile. Thresholds: `closed < 0.15 <= half < 0.45 <= wide`. Smooth with a minimum hold of 80 ms. Cache per `line_id`. With no audio, cycle mouths by text length.

### 10.7 Audio and recording
One `AudioContext` for everything (speech, SFX, music with ducking under speech). It must be resumed by a user gesture. Recording uses `canvas.captureStream(30)` + `createMediaStreamDestination()` into `MediaRecorder` (prefer `video/webm;codecs=vp9,opus`, fall back to vp8). The upload to the backend is **injected** (`exportFlow` takes an `uploader` function) so the engine stays free of API code.

### 10.8 Art contract (Nigel, frozen in `contracts/`)
```ts
drawCharacter(ctx, state: { characterId, species, x, y, scale, facing: 'right',
  palette, accessories, expression, mouth, pose, poseT, time }): void
drawBackground(ctx, id, t, w, h): void      // no mood tint; the engine tints
drawProp(ctx, id, x, y, scale, t): void
```
**Art always draws facing right.** The engine mirrors for left. Missing ids draw a visible placeholder and warn; they never throw. Every function is deterministic for a given input.

---

## 11. Asset Library and Metadata (Nigel owns `assets/metadata/`)

Files: `characters.json, backgrounds.json, props.json, animations.json, sfx.json, music.json`, plus `assets/LICENSES.md` (source URL and licence for every audio file and any third-party art). Metadata describes **only real capabilities**.
```json
{ "id": "pip_owl", "type": "character", "style": "cartoon2d", "species": "owl",
  "tags": ["child-friendly", "forest", "shy"],
  "animations": ["idle","walk","talk","wave","laugh","listen","react","point"],
  "expressions": ["neutral","happy","sad","surprised","worried","excited"],
  "default_palette": { "primary": "#8b5e3c", "secondary": "#d9b38c", "accent": "#f2a65a", "outline": "#3b2a1e" },
  "default_voice": { "engine_voice": "en-US-AnaNeural", "rate": "+0%", "pitch": "+0Hz" },
  "licence": "original" }
```
Backgrounds list `tags`, `mood_hint`, `ground_band`. Props list `tags`, `default_slot`. Audio files list `duration_s`, `loop`, `licence`, `source_url`. **Only original art and CC0 / free-licence audio.** Verify each licence on the source page.

---

## 12. Frontend Map (routes)

| Route | Owner | Content |
|---|---|---|
| `/login`, `/signup` | Nigel (UI) + Om (`useAuth`) | Auth pages, "Continue in demo mode" |
| `/` Home | Nigel | Choose Quick Story / Studio / Library |
| `/quick` | Nigel | Prompt, examples, Generate, stages, player, Live, Download |
| `/studio` | Nigel | Series setup, character builder, generate N, season grid with badges |
| `/library`, `/episode/:id` | Nigel | Episode list and player page |
| `/dev/engine` | Maegan | Engine harness (fixtures, seek, record) |
| `/dev/live` | Maegan | Live Mode harness |
| `/dev/art` | Nigel | Art gallery (species x pose x expression x mouth) |

Route guard sends signed-out users to `/login` unless demo mode is on.

---

## 13. Repo Structure and Ownership

```text
voxfable/
  AGENTS.md  .agents/rules/*.md  .env.example  .gitignore  README.md(Nigel)
  docs/ Master_Context.md ARCHITECTURE.md TASKS.md SUPABASE.md PREFLIGHT.md DEMO.md(Nigel) ART_STYLE.md(Nigel)
        status/{om,maegan,nigel}.md   prompts/Prompts_{om,Maegan,Nigel}.md
  contracts/ (Om)   fixtures/ (Om)   supabase/migrations/ (Om)   scripts/ (Om)   backend/ (Om)
  frontend/public/demo/ (Om: bundled episodes + audio + baked MP4)
  frontend/src/lib, auth, config (Om)    frontend/src/engine, live (Maegan)
  frontend/src/characters, backgrounds, props, ui, studio, pages (Nigel)
  assets/metadata, audio, LICENSES.md (Nigel)    demo/ (Nigel: deck, script; Om: preflight)
  media/ (git-ignored runtime audio and exports)
```
Vite aliases: `@/` = `frontend/src`, `@contracts` = `contracts`, `@fixtures` = `fixtures`, `@assets` = `assets` (with `server.fs.allow` for the repo root).

---

## 14. Git and Sync Protocol

1. **Monorepo; `main` is always runnable.** Branches `om/<topic>`, `maegan/<topic>`, `nigel/<topic>`.
2. **Merge to `main` every 1-2 hours.** Before every push: `git pull --rebase origin main`. **Never force-push `main`.**
3. **Edit only your own folders.** Shared files (`contracts/`, `AGENTS.md`, `.agents/rules/`, this file) change only through Om. Others write a **request** in their status file under "Contract proposals" or "Requests".
4. **Status files:** each agent updates its own `docs/status/<name>.md` at every milestone with sections: *Done / In progress / Next / Blockers / Requests / Contract proposals*.
5. **Start a fresh Antigravity task after each pull** so rules and context reload.
6. No secrets or large binaries in git. Audio files stay small (MP3, under about 300 KB each where possible).
7. **Antigravity rule files must stay under about 12,000 characters each** (reported limit). `AGENTS.md` stays short; details live in `docs/`.
8. **Context update block** (paste to Om to merge here):
```text
CONTEXT UPDATE (by <name>, <time>)
Changed: <what>   Reason: <why>   Affects: <people/folders>   Needs contract change: yes/no
```

---

## 15. Timeline (H+0 = start; deadline H+21:30). All hours are targets, not promises.

| When | Om | Maegan | Nigel |
|---|---|---|---|
| **H0-1:00 Push #1** | Repo, docs, `AGENTS.md` + rules, contracts v0, fixtures, asset-metadata stubs, frontend scaffold + stubs in everyone's folders | Environment setup, read context, plan engine (local only) | Environment setup, read context, art style guide, plan |
| **H1-2:00 Push #2** | Supabase project + schema + RLS, backend skeleton, `lib/api.ts`, `auth/`, DataRepo | Pull. Timeline resolver + `renderAt` against fixtures with stub art | Pull. Owl v1, `forest_day`, `/dev/art`, metadata v1 |
| **H2-7 Parallel build** | LLM adapter, Writer + Director, validator + resolver, TTS, job API | Player clock, audio engine, lip-sync, camera, mood, captions | Fox + kid, backgrounds, props, login/signup, Quick Story page shell |
| **H7 INTEGRATION 1** | Quick Story end to end with the real backend | Engine plays real episodes | Real art for 2 species + 2 backgrounds on the Quick Story page |
| **H7-14 Features** | Continuity + safety, batch generation, export endpoint, auth verify | Live Mode, mic + tap + match, recording/export client | Studio UI, audio assets, remaining art, deck draft |
| **H14 INTEGRATION 2; H15 FEATURE FREEZE** | Everything wired | Everything wired | Everything wired |
| **H15-19 Polish** | Bundled demo episodes (bake), bug bash | Perf, edge cases, bug bash | Deck, README, DEMO.md, rehearsals |
| **H19:30 Pre-flight on Om's laptop** | Run `scripts/preflight` | Be on call | Be on call |
| **H19:30-21:30** | Bug fixes only, final rehearsal, submission buffer | same | same |

**Naps (suggestion, adjust):** stagger short naps in H8-14: Nigel first, then Maegan, then Om, so someone is always awake and merges stay safe.
**Integration 1 done means:** a judge-style prompt typed on `/quick` produces a playable narrated episode with real art, using the real backend, on Om's machine.
**Integration 2 done means:** Quick, Live, Studio batch, MP4 export and login all work, and a bundled fallback episode plays in demo mode.
**Cut order:** 3D, fast export, multilingual voices, extra species, editor polish. **Never cut:** Quick Story, Live Mode, batch generation, export, fallback episode, login.

---

## 16. Demo Plan (3 min), Business, Safety and Rights

**Demo (operator: Om):** 0:00 problem; 0:25 a judge suggests a story, stages show, it plays; 1:15 the judge talks to the cartoon; 2:00 Studio batch with badges; 2:30 MP4 export and business model. Bundled fallback episodes ready.
**Business:** parent subscription (Live Mode); creator and studio credits; school and enterprise plans with safety reports; licensing; marketplace later. Wording: "no paid per-generation model/API charges in the local/free-tier setup; hosting, storage and bandwidth if deployed". Do **not** invent market statistics; mark any figure `[VERIFY]` until sourced.
**Safety and rights:** original characters and art; free-licence music with sources recorded; Edge-TTS is unofficial (fine for a hackathon, flag for commercial use); safety gate on every episode; mic only in Live Mode with clear UI; no secrets in git; no personal data beyond the Supabase account.

---

## 17. Known Weaknesses (be honest in the pitch and Q&A)

"Is it GenAI?" (visuals are programmatic: position as deliberate for consistency, speed and cost; GenAI does story, direction, continuity, safety). Basic-looking art risk. Speech recognition limits with kids' voices. Free-tier rate limits and internet dependence (Gemini, Edge-TTS, Supabase). Export is real-time WebM then MP4. Three parallel owners (contract drift). Timings unproven, so no speed promises.

---

## 18. Decisions and Status

- **Locked:** VoxFable; Quick + Live + Studio; React/Vite/TS + FastAPI; Canvas 2D; beat-based plan; contracts-first; Supabase auth and data; GitHub monorepo; demo on Om's machine; episodes read via API, series/characters via DataRepo; bundled episodes + baked MP4 as the fallback.
- **Proposed, validate:** LLM adapter order; Edge-TTS timings; FFmpeg flow; exact schemas; roster, background, prop, SFX and music names; lip-sync thresholds; optional Ollama offline generation.
- **Open:** judging criteria; confirm Om's machine specs; Supabase project creation (Om); final character names and art style.
- **Change log:** 2026-11-13 created from `context (4).md` + `CWC_Idea_Final.md`; added `cast` to the plan, `scene_id` to audio lines, explicit data-layer split, demo safety ladder, export status endpoint, engine spec details, load-balancing rule.

*Last updated:* 2026-11-13 (about 21h30m left when written)
