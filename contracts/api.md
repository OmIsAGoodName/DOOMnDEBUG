# VoxFable Backend API Specification

Base URL: `/api` (or `http://localhost:8000/api`)
Auth: `Authorization: Bearer <Supabase access token>` (or skipped when `DEMO_MODE=true`).

---

## 1. Health
### `GET /api/health`
Response:
```json
{
  "ok": true,
  "mode": "online", // "online" | "demo"
  "supabase": true,
  "llm": "gemini/gemini-2.5-flash",
  "ffmpeg": true
}
```

---

## 2. Generations
### `POST /api/generations`
Request:
```json
{
  "kind": "quick", // "quick" | "batch"
  "prompt": "A curious owl explores the woods",
  "series": null,
  "characters": null,
  "count": 1,
  "age_band": "4-6",
  "language": "en",
  "interactive": false
}
```
Response:
```json
{
  "generation_id": "gen_uuid",
  "status": "queued"
}
```

### `GET /api/generations/{id}`
Response:
```json
{
  "id": "gen_uuid",
  "kind": "quick",
  "status": "queued", // "queued" | "running" | "succeeded" | "failed"
  "stage": "writing",
  "progress": 35, // integer or null
  "episode_ids": ["ep_uuid"],
  "error": null
}
```

---

## 3. Episodes
### `GET /api/episodes`
Response:
```json
[
  {
    "id": "ep_uuid",
    "title": "Pip and the Glowing Door",
    "status": "ready",
    "video_url": "/media/exports/ep_uuid.mp4",
    "created_at": "2026-11-13T12:00:00Z"
  }
]
```

### `GET /api/episodes/{id}`
Response:
```json
{
  "id": "ep_uuid",
  "title": "Pip and the Glowing Door",
  "plan": { /* EpisodePlan */ },
  "safety": { "verdict": "pass", "age_fit": 0.0, "scary": 0.0, "notes": "" },
  "continuity": { "violations": [] },
  "audio_manifest": { /* AudioManifest */ },
  "status": "ready",
  "video_url": "/media/exports/ep_uuid.mp4"
}
```

---

## 4. Live Mode Voice / Input Matching
### `POST /api/live/match`
Request:
```json
{
  "prompt": "Should I follow the firefly or open the door?",
  "options": [
    { "id": "a", "label": "Follow the firefly", "keywords": ["firefly", "follow"] },
    { "id": "b", "label": "Open the door", "keywords": ["door", "open"] }
  ],
  "transcript": "let's open the door please"
}
```
Response:
```json
{
  "option_id": "b",
  "confidence": 0.95,
  "method": "keyword" // "keyword" | "llm" | "default"
}
```

---

## 5. Video Export
### `POST /api/episodes/{id}/export`
Form-Data:
`file`: WebM video blob recorded by canvas
Response:
```json
{
  "export_id": "exp_uuid"
}
```

### `GET /api/exports/{export_id}`
Response:
```json
{
  "status": "done", // "queued" | "running" | "done" | "failed"
  "mp4_url": "/media/exports/exp_uuid.mp4",
  "error": null
}
```
