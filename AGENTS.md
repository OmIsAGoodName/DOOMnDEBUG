# VoxFable agent rules
Read docs/Master_Context.md before any task. It is the source of truth.
1. Identify who you work for (see .agents/rules/99-identity.md or the task preamble): Om, Maegan or Nigel.
2. Edit ONLY that person's folders (docs/Master_Context.md section 1). Shared files (contracts/, AGENTS.md, .agents/) change only through Om; others write a request in docs/status/<name>.md.
3. Keep main runnable. git pull --rebase origin main before every push. Never force-push main.
4. Contracts first: follow contracts/ exactly. Do not invent fields.
5. Never execute LLM-written code. Never commit secrets. Never generate assets during a user request.
6. Child-safe by default. Original art only. Record every asset licence in assets/LICENSES.md.
7. Be honest: say what is unproven or broken. Prefer the simplest thing that works.
8. Update docs/status/<name>.md at each milestone (Done/In progress/Next/Blockers/Requests/Contract proposals).

