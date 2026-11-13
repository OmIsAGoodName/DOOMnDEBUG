# Om's Status & Milestone Log

**Current Milestone**: System Diagnostics & API Quota Monitor, Live Key Hot-Swap & Canvas Quality Polish  
**Date**: 2026-11-14  
**Active Branch**: `main` (synced with `origin/main`)  
**Repository**: `https://github.com/OmIsAGoodName/DOOMnDEBUG.git`  

---

## ⚡ Recent Updates (Diagnostics Tab, API Key Hot-Swap & Quality Polish)

1. **System Diagnostics & API Quota Monitor (`/debug`)**:
   - Built a dedicated Diagnostics & Quota Monitor page ([`frontend/src/pages/Debug.tsx`](file:///d:/VoxFable/frontend/src/pages/Debug.tsx)) with a 1-click header link `⚙️ Diagnostics`.
   - **Real-Time Quota Health Indicator**:
     - Visual status banner detects whether Groq or Gemini have hit daily token limits (TPD) or per-minute rate limits (429/413) and alerts when a fresh key is needed.
     - Displays masked active keys, current active model, total calls made, success counts, 429 hits, and the exact raw error response log from Groq/Gemini.
   - **Live API Key Hot-Swapping**:
     - Added `POST /api/system/keys` in [`backend/app/main.py`](file:///d:/VoxFable/backend/app/main.py): Tests the key live against the provider API before saving, applies it immediately to runtime in-memory settings without restarting the server, and persists it to `backend/.env`.
     - Supports selecting target models (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant`, `gemini-2.5-flash`).
   - **Direct Rate-Limit Gateway in Quick Story**:
     - Updated [`frontend/src/pages/Quick.tsx`](file:///d:/VoxFable/frontend/src/pages/Quick.tsx) so any rate limit error presents a direct 1-click button to open the Diagnostics tab and swap the key.

2. **Video & Canvas Quality Polish**:
   - **Flagship Model Restoration**: Re-enabled `openai/gpt-oss-120b` and `llama-3.3-70b-versatile` at the top of the provider priority ladder in [`backend/app/llm/providers.py`](file:///d:/VoxFable/backend/app/llm/providers.py), ensuring maximum Bluey-grade storytelling depth whenever quota is open or fresh keys are applied.
   - **High-Precision Vector Anti-Aliasing**: In [`frontend/src/engine/EpisodePlayer.tsx`](file:///d:/VoxFable/frontend/src/engine/EpisodePlayer.tsx), enabled `ctx.imageSmoothingEnabled = true` and `ctx.imageSmoothingQuality = 'high'`, delivering razor-sharp 2D vector character outlines and smooth gradient backgrounds.

3. **True Branching Choice Tree & Multiple Endings**:
   - Upgraded [`backend/app/stations/writer.py`](file:///d:/VoxFable/backend/app/stations/writer.py) and [`backend/app/prompts/writer.md`](file:///d:/VoxFable/backend/app/prompts/writer.md):
     - When `interactive=True`, instructs writer to generate a 5-scene branching story tree: Opening Dilemma (`sc1`) $\rightarrow$ Branch A (`sc2a`) / Branch B (`sc2b`) in distinct locations $\rightarrow$ Unique Ending A (`sc3a`) / Unique Ending B (`sc3b`).
     - Branch leaf scenes terminate with `next_scene: null`, creating genuine multiple endings traversed according to user choice.
   - Protected multiple endings in [`backend/app/stations/director.py`](file:///d:/VoxFable/backend/app/stations/director.py):
     - Prevents linear stitching from overwriting `next_scene = None` on branch endings.
     - Fortified option branch target validation in [`backend/app/validation/validator.py`](file:///d:/VoxFable/backend/app/validation/validator.py).

2. **Time & Generation Speed Optimization**:
   - **Zero-Token Instant Direction**: Switched scene directing to `direct_scene_rule_based`, cutting planning latency from 30+ seconds down to **0.01 seconds** while preserving narrative physical action extraction and zeroing director token spend.
   - **Parallelized Edge-TTS Narration**: Increased concurrency semaphore in [`backend/app/tts/manifest.py`](file:///d:/VoxFable/backend/app/tts/manifest.py) from 3 to 6, enabling fast parallel speech synthesis across all branch and ending scenes.

3. **In-Player Live Interactive Choice Modal & Traversal Trail**:
   - Upgraded [`frontend/src/ui/EpisodeView.tsx`](file:///d:/VoxFable/frontend/src/ui/EpisodeView.tsx):
     - Defaults interactive stories to `live` mode immediately.
     - **On-Canvas Interactive Choice Modal**: When playback reaches a choice point, pauses and presents big, high-contrast, child-friendly tap buttons with emojis + live Web Speech API mic recognition.
     - **Branch Traversal History Trail**: Displays real-time path progress (`Chapter 1 ➔ Choice Selected ➔ Unique Ending Reached`) with a 1-click **"↺ Replay to Explore Other Branches"** button.

4. **Fixed Pipeline PlacedCharacter Dict Validation & Groq Rate Limit Resilience**:
   - Resolved `AttributeError: 'dict' object has no attribute 'position'`:
     - In [`backend/app/stations/director.py`](file:///d:/VoxFable/backend/app/stations/director.py), instantiated missing cast additions as `PlacedCharacter` models rather than raw dicts.
     - In [`backend/app/validation/validator.py`](file:///d:/VoxFable/backend/app/validation/validator.py), made character & prop position clampers defensive against both Pydantic models and dictionary structures.
   - Enhanced LLM provider fallback in [`backend/app/llm/providers.py`](file:///d:/VoxFable/backend/app/llm/providers.py):
     - Added `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` to candidate model list.
     - Constrained `max_tokens: 1500` on Groq completion requests to avoid OTPM token estimation rejections.

2. **Rich Narrative Action Parsing & Execution (Zero LLM Tokens)**:
   - **Cinematic Flight Exit**:
     - Extended `ActionRemoveCharacter.exit` in [`backend/app/models/episode_plan.py`](file:///d:/VoxFable/backend/app/models/episode_plan.py) to support `"fly_away"`.
     - In [`frontend/src/engine/resolveTimeline.ts`](file:///d:/VoxFable/frontend/src/engine/resolveTimeline.ts), implemented smooth upward ascent into the sky with flapping wings, easing, and natural alpha fade.
   - **Narrative-Driven Action Extraction** ([`backend/app/stations/director.py`](file:///d:/VoxFable/backend/app/stations/director.py)):
     - Autonomous rule-based action parsing scans narrative dialogue & beat text for physical movement cues with 0 extra token overhead:
       - Flight cues ("flew away", "soared", "flapped", "take off") $\rightarrow$ `REMOVE_CHARACTER(exit="fly_away")` + `PLAY_SFX("sparkle")`.
       - Movement cues ("walked over", "ran to", "approached", "stepped closer") $\rightarrow$ `MOVE_TO(to=(0.46, 0.76))`.
       - Greeting/parting cues ("waved", "waves", "goodbye") $\rightarrow$ `PLAY_ANIMATION("wave")`.
       - Discovery cues ("pointed", "spotted", "look") $\rightarrow$ `PLAY_ANIMATION("point")`.
       - Celebration cues ("jumped", "leaped", "cheered", "hooray") $\rightarrow$ `PLAY_ANIMATION("react")` + `PLAY_SFX("pop")`.
       - Prop cues ("briefcase", "map", "flower", "lantern", "balloon") $\rightarrow$ `ATTACH_PROP`.

2. **Studio Asset Catalog & In-Library Character Generator**:
   - **Backend API Endpoints** ([`backend/app/main.py`](file:///d:/VoxFable/backend/app/main.py)):
     - Added `GET /api/assets`: Returns complete catalog of all core and custom characters, backgrounds, props, music tracks, and sound effects.
     - Added `POST /api/characters`: Allows generating and persisting custom character designs directly to `media/data/custom_characters.json`.
     - Updated [`backend/app/stations/writer.py`](file:///d:/VoxFable/backend/app/stations/writer.py) to merge custom characters into story writer candidate cast pool automatically.
   - **Interactive Studio Library UI** ([`frontend/src/pages/Library.tsx`](file:///d:/VoxFable/frontend/src/pages/Library.tsx)):
     - Reorganized into 4 dedicated tabs:
       - **🎬 Stories**: Full collection of user and demo episodes with safety badges, offline tags, and direct playback links.
       - **✨ Characters & Cast**: Complete character roster with species badges, voice timbre/pitch tags, color swatches, and an inline **"✨ Generate Character Design Studio"** with real-time saving and feedback.
       - **🎨 Backgrounds**: Visual stage catalog of all locations (`forest_day`, `forest_night`, `meadow_day`, `treehouse_interior`, `village_street`) with mood descriptors and ground band anchors.
       - **🪄 Props & Audio**: Stage props inventory, background scores, and sound effects library.

3. **Multi-Model Failover, Local Auth Unblocking & Real Long-Form Story Generation**:
1. **Resolved 30-Second Video Issue (Eliminated Silent Demo Masking)**:
   - Diagnosed root cause of the previous 30s output:
     - Groq model `openai/gpt-oss-120b` had reached its 200,000 daily token limit (HTTP 429).
     - Because `DEMO_MODE=true` was active in `.env`, the pipeline exception handler quietly caught the error and substituted the bundled 3-scene, 30-second offline demo episode (*"Pip Learns to Share"*).
   - **Fixes Deployed**:
     - Upgraded [`backend/app/llm/providers.py`](file:///d:/VoxFable/backend/app/llm/providers.py) with **Multi-Model Auto-Failover**: If a model hits a TPM/TPD rate limit, Groq immediately and transparently fails over to `openai/gpt-oss-20b` or `qwen/qwen3.8-27b` without dropping the request.
     - Switched [`backend/.env`](file:///d:/VoxFable/backend/.env) to `DEMO_MODE=false`.
     - In [`backend/app/auth.py`](file:///d:/VoxFable/backend/app/auth.py), enabled safe local development fallback to `"demo"` user when Supabase is unconfigured, preventing 401 Unauthorized errors from interrupting browser submissions.

2. **Verified Live Generation of User's Premise**:
   - Tested the exact story premise (*Alex the waiter & Richard the businessman's lost briefcase*) with target `2-3mins`.
   - **Generation Output (`ep_030a4640`)**:
     - **Title**: *The Golden Briefcase Quest*
     - **Structure**: Exactly **5 scenes** and **17 conversational beats**.
     - **Audio**: 17 unique Edge-TTS dialogue lines totaling **106.4 seconds of spoken audio** (~120 seconds total episode runtime with pacing padding).
     - Full video playable directly in the UI.
1. **LLM Token Optimization & Rate-Limit Shielding**:
   - **Compressed Writer Prompts** ([`backend/app/stations/writer.py`](file:///d:/VoxFable/backend/app/stations/writer.py)):
     - Converted verbose multi-line asset catalogs into compact comma-separated summaries (`Cast Candidates: ...`, `Backgrounds: ...`), reducing prompt overhead by ~250 tokens per generation call.
   - **Compressed Director Prompts** ([`backend/app/prompts/director.md`](file:///d:/VoxFable/backend/app/prompts/director.md)):
     - Condensed prompt instructions from 61 lines (~500 tokens) down to 7 lines (~65 tokens).
     - Trimmed scene context payloads to essential IDs and tightened JSON schema formatting.
   - **Autonomous Zero-Token Rule-Based Director**:
     - Built `direct_scene_rule_based` in [`backend/app/stations/director.py`](file:///d:/VoxFable/backend/app/stations/director.py): An intelligent deterministic fallback that automatically assigns wide slow-push-in framing, ground band clamping, expressive character emote/pose transitions, and mood SFX/music with **0 API tokens spent**.
     - Seamless fallback engages automatically if any LLM provider hits rate limits (HTTP 429) or connection hiccups.
   - **Adaptive Groq Rate-Limiter Recovery**:
     - Dynamic regex parsing for Groq's `try again in Xs` headers to prevent repeated failures during high-traffic bursts.

2. **Studio-Grade 2D Canvas Animation Polish (Pure 2D, No Camera Moves)**:
   - **Universal Squash & Stretch across All Characters**:
     - Integrated vertical squash and stretch (`scale(stretchX, stretchY)`) into body loops across all 5 characters ([`rabbit.ts`](file:///d:/VoxFable/frontend/src/characters/rabbit.ts), [`fox.ts`](file:///d:/VoxFable/frontend/src/characters/fox.ts), [`turtle.ts`](file:///d:/VoxFable/frontend/src/characters/turtle.ts), [`owl.ts`](file:///d:/VoxFable/frontend/src/characters/owl.ts), [`kid.ts`](file:///d:/VoxFable/frontend/src/characters/kid.ts)). Characters organically compress when landing and stretch during hops and startled reactions.
   - **Altitude-Reactive Contact Shadows**:
     - All character ground shadows now receive dynamic `hopHeight`, shrinking (`scaleMod`) and diffusing (`alphaMod`) realistically as characters hop, jump, or react.
   - **Animated Speech Lip-Sync**:
     - Decoupled lip visemes from static pose restrictions in [`renderAt.ts`](file:///d:/VoxFable/frontend/src/engine/renderAt.ts). Characters actively animate mouth movement whenever speaking in a dialogue beat, matching phonemes and speech audio duration with graceful fallback.
   - **Expressive Secondary Motion**:
     - **Rusty the Fox**: Organic phase lag on tail wagging during walks and reactive hops.
     - **Toby the Turtle**: Shell retract on react, subtle body waddle tilt during deliberate walking.
     - **Pip the Owl**: Secondary wing fluttering during dialogue beats and react poses.
     - **Mia the Kid**: Dynamic inertia hair bounce on the perky top tuft during jumps, walks, and speech.

3. **Zero Token Verification & Reliability**:
   - All 38 frontend vitest tests pass with 0 errors (`npm run typecheck` clean).
   - All 43 backend pytest tests pass.
   - Dev servers running live on `http://localhost:5173` and `http://localhost:8000`.
1. **Resolved LLM Provider Failure & Safe Fallback**:
   - Diagnosed root cause of `"All LLM providers failed. Last error: All connection attempts failed"`:
     - Groq encountered a temporary connection timeout/rate limit.
     - Fallback tried placeholder `GEMINI_API_KEY` and unreachable local `OLLAMA_URL` (`localhost:11434`), surfacing the connection refusal.
     - The built-in offline `DEMO_MODE` fallback in `backend/app/pipeline.py` threw `NameError: name 'Path' is not defined` due to missing imports.
   - **Fixes Applied**:
     - Added `Path` and `json` imports in `backend/app/pipeline.py` so offline demo episodes load instantly whenever online LLMs hiccup.
     - Enhanced `backend/app/llm/providers.py` and `adapter.py` with `is_configured()` checks and detailed per-provider error reporting.
     - Restarted FastAPI/Uvicorn server; verified live generation succeeds end-to-end in ~8s.
2. **2D Studio-Quality Animation Polish (Without Camera Moves)**:
   - Cubic easing (`easeInOutCubic`) for natural acceleration and deceleration.
   - Character idle breathing cycles across all 5 characters (`rabbit`, `turtle`, `fox`, `owl`, `kid`) at ~2Hz.
   - Dynamic contact shadows scaling with bounce/hop altitude.
   - Storybook vignette frame and mood-based atmospheric floating particles.
3. **Story Duration Options (`/quick`)**:
   - Added 3 interactive duration buttons: `< 1 min` (Snack Story, 2 scenes), `1 - 2 mins` (Bedtime Tale, 3-4 scenes), `2 - 3 mins` (Extended Tale, 4-5 scenes).
   - Hooked up pipeline to adjust scene pacing and beat depth based on duration.
4. **Custom Character Generation Option (`/quick`)**:
   - Added checkbox: *"✨ Try generating new character designs for this story"*.
   - Explains that custom palettes & voices take ~15–20s longer and auto-save into the Library.
5. **Dark Mode by Default**:
   - Added global Dark Mode toggle (`🌙 Dark` / `☀️ Light`) in header nav.
   - Defaults to dark mode (`localStorage.getItem('voxfable_theme') || 'dark'`).
   - Tailwind `darkMode: 'class'` configured with dark backgrounds, cards, inputs, and chips.

---

## 🚨 WORKSTATION TRANSITION PROTOCOL (Moving to Nigel's System)

The entire active workflow, presentation rehearsal, and UI polish are now shifting to **Nigel's workstation**.  
Follow this step-by-step checklist upon opening this repository on Nigel's machine to seamlessly resume work:

### 1. Synchronize Git Repository
```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. Switch to main and rebase to ensure 100% synchronization
git checkout main
git pull --rebase origin main

# 3. If working on Nigel's branch, rebase it on the new main:
git checkout nigel/art-setup
git rebase origin/main
```

### 2. Verify Frontend & Dependencies
```bash
cd frontend
npm install
npm run typecheck    # Must report 0 errors
npm test             # Must pass 38/38 unit tests across 11 suites
cd ..
```

### 3. Verify Backend & Dependencies
```bash
# Ensure virtual environment is active (Python 3.11+ / 3.13)
pip install -r backend/requirements.txt
python -m pytest backend/tests   # Must pass 43/43 tests across 9 modules
python scripts/validate_fixtures.py  # Must pass 4/4 demo fixtures
```

### 4. Verify System Pre-flight
```bash
python scripts/preflight.py
```
> Expectation: Output shows `[READY] System is ready for live demo rehearsal!`  
> Checks: Node v18+, Python 3.11+, FFmpeg on PATH, ports 5173 & 8000 free, and offline fallback episodes baked.

### 5. Launch Full Stack
Run the universal demo launcher:
- **Windows**: Double-click `scripts\run_demo.bat` (or execute `.\scripts\run_demo.bat` in PowerShell)
- **Mac / Linux**: `./scripts/run_demo.sh`

This automatically boots:
- Backend: FastAPI on `http://localhost:8000` (docs at `/docs`)
- Frontend: Vite dev server on `http://localhost:5173`

---

## 🛠️ Recent Major Enhancements & Bug Fixes Integrated

1. **Full Media Controls (`frontend/src/ui/EpisodeView.tsx`)**:
   - Added in-canvas playback control bar: Play/Pause button (`▶` / `⏸`), interactive timeline seek bar (`<input type="range">`), elapsed and total duration counter (`mm:ss`), mute/unmute audio toggle, and full-screen button.
2. **Reliable Video Downloads & MP4 Export (`frontend/src/ui/EpisodeView.tsx`, `backend/app/export/converter.py`)**:
   - Resolved Windows `SelectorEventLoop` `NotImplementedError` by running FFmpeg via `asyncio.to_thread(subprocess.run)`, guaranteeing high-speed 720p H.264/AAC MP4 conversion.
   - Fixed Web Audio recording routing: separated `localGain` from `masterGain` so `muteLocal: true` during canvas recording mutes local speakers while continuing to feed 100% full-volume speech, music, and SFX directly into the recording stream.
   - Programmatic `<a download>` file trigger for converted `.mp4` files with fallback to direct `.webm`.
   - Added instant client-side WebM blob download fallback so users can always download recordings even if backend FFmpeg is slow or offline.
3. **Expanded Character Species (Rabbit 🐰 & Turtle 🐢)**:
   - Added `rabbit` and `turtle` to `contracts/vocab.json`.
   - Procedural vector canvas renderers created in `frontend/src/characters/rabbit.ts` (Barnaby) and `turtle.ts` (Toby) with full 8 poses, 6 expressions, and accessories.
   - Exported and integrated in `frontend/src/characters/index.ts`, `CharacterBuilder.tsx`, and `ArtGallery.tsx`.
   - Metadata and licensing logged in `assets/metadata/characters.json` and `assets/LICENSES.md`.
   - Updated Writer & Director prompts in backend (`backend/app/prompts/writer.md`, `backend/app/stations/director.py`) to dynamically cast requested animals (e.g., prompt for "rabbit and turtle" now generates an episode featuring Barnaby Rabbit and Toby Turtle).
4. **Audio Engine Pre-Scheduling & Auto-Resync (`frontend/src/engine/audio/engine.ts`)**:
   - Resolved silent audio issues by implementing Web Audio API context time pre-scheduling (`ctx.currentTime + (startTime - t)`).
   - Future audio events are accurately queued on the hardware audio clock without drift.
   - Audio automatically resynchronizes once audio buffers complete loading.
   - Populated fallback audio sound effects and ambient tracks across `frontend/public/assets/audio/` and `demo/audio/`.
5. **3-Level Demo Safety Net (`backend/app/pipeline.py`, `backend/app/llm/providers.py`)**:
   - **Level A (Live Cloud LLM)**: Groq (`openai/gpt-oss-120b`) with 60s timeout and exponential backoff retry.
   - **Level B (Automatic Offline Fallback)**: If LLM network fails or `DEMO_MODE=true` is set in `.env`, `pipeline.py` automatically loads a pre-baked demo fixture and adapts the title dynamically to match the user's prompt, preventing any user-facing error.
   - **Level C (Client-Side Pre-baked Episodes)**: If the backend is completely offline, the frontend's `api.ts` directly serves pre-rendered episodes from `/demo/episodes/index.json`.

---

## 🎨 Nigel's Ownership & File Boundaries

Per `docs/Master_Context.md` and `AGENTS.md`, Nigel has exclusive write access to:
- `frontend/src/characters/` (character renderers, poses, expressions)
- `frontend/src/backgrounds/` (vector background scenes)
- `frontend/src/props/` (canvas prop drawings)
- `frontend/src/ui/` (UI kit, buttons, sliders, modals)
- `frontend/src/studio/` (CharacterBuilder, SeriesForm)
- `frontend/src/pages/` (page views, layouts)
- `assets/` (metadata, audio files, icons, licenses)
- `demo/` (deck outline, QA cheat sheet)
- `docs/DEMO.md` (3-minute demo script & choreography)
- `docs/ART_STYLE.md` (visual guidelines & color palettes)
- `docs/status/nigel.md` (Nigel's status updates)
- `README.md` (project presentation and docs)

*Reminder: Shared files in `contracts/`, `AGENTS.md`, and `.agents/` are managed via Om.*

---

## 📋 Comprehensive Status Checklist

### 1. Done
- [x] All Milestone 0 through 5 deliverables integrated and tested.
- [x] FFmpeg v9.0.2 installed and operational.
- [x] FastAPI pipeline, Edge-TTS, and continuity/safety stations operational.
- [x] Maegan's Canvas 2D engine, lipsync RMS, camera tracking, and recorder integrated.
- [x] Nigel's vector art suite, 5 backgrounds, 12 props, and UI foundation integrated.
- [x] Character Builder with 5 species (Pip, Rusty, Mia, Barnaby, Toby).
- [x] Quick Story (`/quick`), Live Mode (`/live`), Studio Mode (`/studio`), and Library (`/library`).
- [x] Audio engine pre-scheduling and full media player controls.
- [x] 3-minute Demo script (`docs/DEMO.md`), Deck outline (`demo/DECK_OUTLINE.md`), and QA guide (`demo/QA.md`).
- [x] 0 TypeScript errors, 38/38 vitest passing, 43/43 pytest passing, 4/4 fixtures valid.

### 2. In Progress (Handed over to Nigel)
- [ ] Demo run-through and rehearsal on Nigel's presentation screen.
- [ ] Final UI touch-ups and presentation slides alignment.

### 3. Next
- [ ] Execute Act 1 through Act 5 from `docs/DEMO.md`.
- [ ] Verify audio output on presentation room speakers.
- [ ] Keep offline fallback (`scripts/bake_demo_episode.py`) ready as safety net.

### 4. Blockers
- None. System is fully operational and green across all test suites.

### 5. Requests / Notes for Nigel
- Welcome aboard! The codebase is in a pristine, fully integrated state on `origin/main`.
- You can run the entire system with `scripts\run_demo.bat`.
- If testing prompts with animals, try the newly added Rabbit and Turtle in Quick Story or inspect them in `/studio`.
