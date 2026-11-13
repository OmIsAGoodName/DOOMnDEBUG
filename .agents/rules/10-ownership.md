# 10-ownership: Ownership and Responsibilities

Every agent MUST edit ONLY their assigned person's directories.

| Person | Owns (Edits only these) |
|---|---|
| **Om** (Lead) | `contracts/`, `fixtures/`, `backend/`, `supabase/`, `scripts/`, root configs (`package.json`, Vite/Tailwind, `.env.example`, `AGENTS.md`, `.agents/`), `frontend/src/lib/`, `frontend/src/auth/`, `frontend/src/config/`, `frontend/public/demo/`, `docs/` (except Nigel's files) |
| **Maegan** (Engine) | `frontend/src/engine/`, `frontend/src/live/`, `docs/status/maegan.md` |
| **Nigel** (Art & UI) | `frontend/src/characters/`, `backgrounds/`, `props/`, `ui/`, `studio/`, `pages/` (incl. `pages/auth/`), `assets/`, `demo/`, `README.md`, `docs/DEMO.md`, `docs/ART_STYLE.md`, `docs/status/nigel.md` |

### Rules
- **Stubs rule:** Om creates placeholder files in Push #1 so imports/routes work. From that moment, the assigned folder owner takes over and Om does not edit them.
- **Shared files:** Any changes to `contracts/` or shared configs must be requested via `docs/status/<name>.md` under "Contract proposals" or "Requests".
- **Dependencies rule:** Add npm/pip dependencies in small, separate commits. Run `git pull --rebase origin main` first.

