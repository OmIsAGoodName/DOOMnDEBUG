# VoxFable Demo-Machine Pre-Flight & Presentation Runbook

Author: Om (Lead)  
Milestone: Pre-Flight Verification & Live Demo Readiness

---

## 1. Machine Environment Checklist (Before Presentation)
Run the automated check:
```bash
python scripts/preflight.py
```
Ensure all items return **[PASS] GREEN**.

### Physical & Hardware Setup
- [ ] **Power**: Laptop plugged into AC wall adapter (do NOT run on battery saver).
- [ ] **Display**: Connect HDMI / Projector. Verify display settings (`Extend` or `Duplicate` at 1080p).
- [ ] **Sleep Mode**: Set Screen Timeout and Sleep to "Never" when plugged in.
- [ ] **Notifications**: Enable Windows **Focus Assist** / "Do Not Disturb" to silence Slack, Discord, and OS notifications.
- [ ] **Audio**: System output volume at 75-80%. Test internal speakers or external venue sound system.
- [ ] **Microphone**: Verify default microphone input level. In Chrome / Edge, pre-grant microphone permissions on `http://localhost:5173`.
- [ ] **Internet & Fallback**:
  - Primary: Hackathon venue Wi-Fi.
  - Backup: Phone mobile hotspot already paired and tested.
  - Emergency (Zero-Wi-Fi): VoxFable Offline Demo Mode (baked episodes in `frontend/public/demo/episodes/`).

---

## 2. API Keys & Backend Services
- [ ] **Supabase**: Open the Supabase dashboard in advance so the project is awake (not paused).
- [ ] **Gemini API Key**: Verified active in `backend/.env`.
- [ ] **Groq API Key**: Optional fast fallback configured.

---

## 3. One-Click Launch Commands

### Windows (`scripts/run_demo.bat`)
Double-click `scripts\run_demo.bat` or run in terminal:
```cmd
scripts\run_demo.bat
```

### Linux / macOS (`scripts/run_demo.sh`)
```bash
bash scripts/run_demo.sh
```

This starts:
1. **Backend**: FastAPI on `http://localhost:8000` (serving `/api`, `/media`, and health checks).
2. **Frontend**: Vite dev server on `http://localhost:5173`.

---

## 4. Live Demo Flow & Team Speaker Script

| Timing | Segment | Speaker | Action / Visual |
|---|---|---|---|
| **00:00 - 00:45** | The Problem & Concept | **Om** | Introduce VoxFable: Real-time, child-safe interactive animation generation for kids & families. |
| **00:45 - 01:45** | Quick Story Demo | **Om / Nigel** | Enter prompt at `/quick`: "A brave owl helps a rabbit find glowing berries". Show live pipeline progression stages and instant animated playback. |
| **01:45 - 02:45** | Live Interactive Mode | **Maegan** | Switch to `/live`. Show child voice prompt & branch choice ("Take the sunny path!"). Player dynamically transitions. |
| **02:45 - 03:30** | Studio Series & Batch | **Om** | Navigate to `/studio`. Show character bibles, continuity enforcement, and batch generation of 3 episodes with badge indicators. |
| **03:30 - 04:00** | MP4 Export & Wrap-up | **All** | Click Export to download 720p MP4. Q&A. |
