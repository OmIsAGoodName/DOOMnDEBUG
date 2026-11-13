# VoxFable Handoff Document: Nigel (Art, UI, Pitch)

**Filename**: `acccount_switch.md`  
**Generated At**: 2026-11-13  
**Working Directory**: `c:\Users\ANSLEY\OneDrive\Desktop\VoxFable\DOOMnDEBUG`  
**Git Branch**: `nigel/art-setup`  
**Teammate Roles**:
- **Nigel** (Current Agent): Art (`characters/`, `backgrounds/`, `props/`), UI (`ui/`, `studio/`, `pages/`), Assets (`assets/metadata/`, `assets/audio/`, `LICENSES.md`), Pitch/Deck (`demo/`, `README.md`, `docs/DEMO.md`, `docs/ART_STYLE.md`).
- **Om**: Backend (FastAPI, LLM pipeline, TTS, Supabase auth/data, preflight, integration).
- **Maegan**: Engine (Canvas 2D renderer, timeline, lip-sync, recording, live harness).

---

## 1. What Has Been Done So Far

1. **Context & Rules Onboarding**:
   - Read and confirmed strict compliance with [AGENTS.md](file:///c:/Users/ANSLEY/OneDrive/Desktop/VoxFable/DOOMnDEBUG/AGENTS.md) and [docs/Master_Context.md](file:///c:/Users/ANSLEY/OneDrive/Desktop/VoxFable/DOOMnDEBUG/docs/Master_Context.md) (specifically Sections 4, 7, 10.8, 11, and 12).
   - Validated identity rule file [.agents/rules/99-identity.md](file:///c:/Users/ANSLEY/OneDrive/Desktop/VoxFable/DOOMnDEBUG/.agents/rules/99-identity.md).
   - Enforced strict folder boundaries: Nigel touches **only** his owned folders; shared contracts (`contracts/`, `fixtures/`, etc.) and backend/engine folders are never edited directly.

2. **Frozen Art Contract & Architecture Verification**:
   - Inspected `contracts/types.ts` (`CharacterDrawState`, `Palette`, `VoiceConfig`, etc.).
   - Verified core contract constraints:
     - Characters **always** face right (the engine mirrors left facing via `ctx.scale(-1, 1)`).
     - Character origin is feet-center `(0, 0)`; reference height is ~300 px at `scale = 1.0`.
     - All canvas render functions (`drawCharacter`, `drawBackground`, `drawProp`) must be pure and deterministic functions of time (`time`, `poseT`, `t`). No `Math.random()` or `Date.now()`.
     - Missing properties or unrecognised IDs must render safe visual placeholders with a single warning; they must **never** throw.
     - All art must be 100% original (child-safe, warm 2D cartoon style).
     - Any third-party audio or media requires clear license verification logged in `assets/LICENSES.md`.

3. **Codebase & Toolchain Health Check**:
   - Frontend tests executed: `vitest run` passed (`src/App.test.tsx`).
   - TypeScript build executed: `npm run typecheck` (`tsc --noEmit`) passed with 0 errors.
   - Discovered that Om has already completed backend Push #1, Push #2, Part 2, and Part 3 (FastAPI pipeline, TTS, preflight scripts, and offline baked demo episodes under `frontend/public/demo/episodes/`).

4. **Status Tracking**:
   - Initialized and updated [docs/status/nigel.md](file:///c:/Users/ANSLEY/OneDrive/Desktop/VoxFable/DOOMnDEBUG/docs/status/nigel.md) reflecting Part 0 readiness.

---

## 2. Current Workspace & Git State

- **Branch**: `nigel/art-setup`
- **Cleanliness**:
  - Modified: `docs/status/nigel.md`
  - Created: `acccount_switch.md` (this file)
- **Repo Root**: `c:\Users\ANSLEY\OneDrive\Desktop\VoxFable\DOOMnDEBUG`

---

## 3. Next Steps (Step-by-Step for Next Session)

All instructions and sequenced prompts are detailed in [docs/prompts/Prompts_Nigel.md](file:///c:/Users/ANSLEY/OneDrive/Desktop/VoxFable/DOOMnDEBUG/docs/prompts/Prompts_Nigel.md).

### Immediate Next Tasks:

1. **Prompt N0.4 — Art Style Guide (`docs/ART_STYLE.md`)**:
   - Fill out `docs/ART_STYLE.md` (< 150 lines).
   - Define palette (8-10 hex colors + per-species defaults), outline rules (e.g. 4px rounded), proportions (300px tall, feet-center origin), eye/brow/mouth construction, 8 poses, 6 expressions, 3 mouth shapes, 6 accessories, ground shadows, background layering, and animation math.

2. **Prompt N1.2 — Shared Drawing Kit (`frontend/src/characters/kit/`)**:
   - Implement pure helper functions:
     - `outline(ctx, width, color)`
     - `blob/roundedBody(ctx, ...)`
     - `ellipse(...)`
     - `eye(ctx, { x, y, size, expression, blink })` (deterministic blink function of `time`)
     - `brows(ctx, expression)`
     - `mouth(ctx, shape, expression)`
     - `limb(ctx, from, angle1, angle2, len1, len2)`
     - `shadow(ctx, x, y, w)`
     - Math utilities: `ease`, `lerpColor`, `shade(color, amount)`
   - Add vitest tests for pure math functions.

3. **Prompt N1.3 — Species 1: Pip Owl (`pip_owl`) & Art Gallery**:
   - Implement `frontend/src/characters/owl.ts` and dispatch in `frontend/src/characters/index.ts`.
   - Support 8 poses (`idle`, `walk`, `talk`, `wave`, `laugh`, `listen`, `react`, `point`), 6 expressions, 3 mouth shapes (`closed`, `half`, `wide`), and 6 accessories (`scarf`, `glasses`, `hat`, `bow`, `backpack`, `cape`).
   - Implement `/dev/art` gallery in `frontend/src/pages/dev/ArtGallery.tsx`.

4. **Prompt N1.4 — First Background (`forest_day`) & Metadata v1**:
   - Implement `forest_day` in `frontend/src/backgrounds/`.
   - Update `assets/metadata/characters.json` and `assets/metadata/backgrounds.json`.

---

## 4. Standard Preamble for Subsequent Prompts

When starting the next session, paste the standard preamble into the agent prompt:

```text
You are the coding agent for NIGEL on VoxFable (24-hour hackathon, PS 16). Read AGENTS.md and docs/Master_Context.md first (sections 4, 7, 10.8, 11, 12). Nigel owns ONLY frontend/src/characters, backgrounds, props, ui, studio, pages (incl. pages/auth), assets/, demo/, README.md, docs/DEMO.md, docs/ART_STYLE.md and docs/status/nigel.md. Do not edit contracts/, fixtures/, backend/, lib/, auth/, config/, engine/ or live/. Follow the frozen art contract exactly: characters ALWAYS draw facing right (the engine mirrors), every draw function is deterministic for its inputs (no Math.random or Date.now; use `time` / `t`), missing data must never throw, art is original (no copyrighted characters or styles), and every audio or third-party asset gets a licence line in assets/LICENSES.md. Be concise, say honestly what is unproven, and update docs/status/nigel.md when you finish.
```
