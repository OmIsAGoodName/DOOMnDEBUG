# VoxFable Architecture

Owner: Om

---

## 1. System Overview

VoxFable is a monorepo consisting of:
- **Frontend**: React + Vite + TypeScript + Tailwind (Port 5173).
- **Backend**: FastAPI + Pydantic v2 (Port 8000).
- **Database & Auth**: Supabase (PostgreSQL with Row-Level Security).
- **Audio & Media**: Local `media/` directory served statically at `/media`.

---

## 2. Running the Backend

### Prerequisites
- Python 3.11+
- FFmpeg on system PATH
- Install dependencies:
  ```bash
  pip install -r backend/requirements.txt
  ```

### Development Server
Run FastAPI with auto-reload:
```bash
uvicorn backend.app.main:app --reload --port 8000
```

Verify backend health:
```bash
curl http://localhost:8000/api/health
```

### Running Backend Tests
```bash
python -m pytest backend/tests
```
