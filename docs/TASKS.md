# VoxFable Tasks & Integration Checklist

Owner: Om (Lead)
Co-owners: Maegan (Engine / Live Player), Nigel (Art / UI / Audio assets)

## Automated Integration Runner
Run `python scripts/integration_check.py` against a running backend (`uvicorn backend.app.main:app --port 8000`).

The automated check verifies:
1. `GET /api/health` returns status ok.
2. `POST /api/generations` in Demo mode completes to status `succeeded`.
3. Validates the generated `EpisodePlan` against JSON Schema.
4. Checks that audio files in `AudioManifest` exist and return HTTP 200.
5. Tests `POST /api/live/match` with sample kid utterances ("door", "butterfly").
6. Tests batch generation with `count: 2`.
7. Uploads a sample WebM video to `POST /api/episodes/{id}/export` and polls until status is `done`.

---

## Manual Integration Checklist (Before Demo / Milestone Releases)

### 1. Quick Story Flow (`/quick`)
- [ ] Open `http://localhost:5173/quick`.
- [ ] Enter a standard prompt (e.g., "A brave little owl helps a lost rabbit find berries in the enchanted forest").
- [ ] Click **Create Story**. Verify the step-by-step pipeline loading status (Story -> Direction -> Safety & Audio).
- [ ] Verify the episode player renders scene 1 with characters positioned on the canvas.
- [ ] Verify dialogue audio auto-plays or triggers on step advance with speech bubbles.
- [ ] Confirm Pip / Barnaby / Luna animations trigger as dialogue speaks.

### 2. Live Interactive Mode (`/live`)
- [ ] Navigate to `/live`.
- [ ] Verify that interactive branching prompt appears at the choice beat.
- [ ] Test selection via UI click / tap.
- [ ] Test speech/mic input with voice matcher (e.g. speaking "take the sunny path").
- [ ] Confirm player transitions seamlessly to the chosen branch without re-loading the page.

### 3. Studio Mode & Batch Generation (`/studio`)
- [ ] Navigate to `/studio`.
- [ ] Select or create a Series ("Pip's Woodland Adventures").
- [ ] Trigger batch generation with $N = 3$.
- [ ] Confirm episodes appear one by one as they finish generating.
- [ ] Verify badge indicators (Safety Passed, Continuity Clean, Audio Ready).

### 4. Video Export & Sharing
- [ ] In the player/engine harness (`/dev/engine` or playback screen), trigger **Export Video** / **Record**.
- [ ] Confirm background MP4 encoding completes.
- [ ] Download the `.mp4` and open in Windows Media Player / browser.
- [ ] Verify synchronized audio and video at 720p.

### 5. Authentication & Offline Safety Net
- [ ] Refresh the page and confirm session persistence.
- [ ] Disconnect internet / toggle **Demo Mode**.
- [ ] Confirm pre-baked offline episodes load instantly from `/demo/episodes/index.json`.
- [ ] Confirm offline playback and video download function without any cloud backend connection.
