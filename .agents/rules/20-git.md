# 20-git: Git and Sync Protocol

Follow docs/Master_Context.md Section 14.

1. **Branching:** Work on your dedicated branch (`om/<topic>`, `maegan/<topic>`, `nigel/<topic>`).
2. **Rebase often:** Before publishing or pushing, always run `git fetch origin && git rebase origin/main`.
3. **Never force-push main:** Fast-forward main only (`git push origin HEAD:main`). Back up your feature branch with `git push --force-with-lease -u origin HEAD`.
4. **Disjoint folders:** Because directory ownership is separated, merge conflicts should be minimal. For files you don't own, `--ours` means main's version.
5. **No secrets or bloat:** Never commit `.env` files, API keys, `node_modules/`, `media/`, or files over 2 MB.
6. **Update status:** At each milestone, record your progress in `docs/status/<name>.md`.
7. **Fresh sessions:** Start a fresh agent task after pulling updates to keep context clear.

