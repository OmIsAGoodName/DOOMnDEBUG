# 30-contracts: Architecture & Contracts

1. **Contracts are frozen:** Follow definitions in `contracts/` exactly. Do not invent unapproved fields.
2. **Pure function of time:** The Canvas 2D renderer is a pure function of time (`renderAt(t)`). Seek and export must be deterministic. No `Math.random` or `Date.now` inside draw routines; use passed time `t`.
3. **Art contract:** Characters ALWAYS draw facing right (engine handles horizontal mirroring). Missing asset IDs must draw a placeholder and warn, never throw.
4. **No dynamic asset generation:** Never generate character art or audio assets during a user request; use pre-authored assets and metadata. Recolor, accessory, and name changes are parameter changes.
5. **Never execute LLM-written code:** The LLM produces validated JSON adhering to JSON schemas only.

