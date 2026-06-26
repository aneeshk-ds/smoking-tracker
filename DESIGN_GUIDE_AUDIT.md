# Design-guide audit — Smoking Tracker

Status of the app against `Design_Guide_NonTech.md` (the master build guide).
Overall: **~68%** — a strong, safe v1; open gaps are engineering rigor, not product.

## Done-gates

| Gate | Status | Notes |
|---|---|---|
| Product value | Strong | Clear problem; core log → streak → insights works; onboarding present. |
| Security & privacy | Strong | Per-user Row-Level Security (`auth.uid() = user_id`); no secrets in client; `.env` gitignored. |
| Human UX | Good | Plain-language copy; value within first session; support resource on Health page. |
| Reliability | Partial | Offline-first (IndexedDB) is excellent; user-facing retry/timeout handling is thin. |
| Code quality | Gap | Builds clean, but (now) basic tests added; no static types (plain JS). |
| Operations | Gap | Lightweight error logging added; still no remote monitoring/health endpoint. |

## What aligns well
- Trust model decided early: local-first, opt-in cloud (guest stays fully on-device).
- Secrets out of client: only the public Supabase anon key ships; data protected by RLS.
- Data scoped per user: RLS on `cigarettes` and `settings`.
- Maintainable structure: `routes/`, `components/`, `lib/` separation.
- Human error language; clear first-session value.

## Gaps being closed (this roadmap)
1. Automated tests for core logic (streaks) — added with vitest.
2. Lightweight client error logger — added (`src/lib/logger.js`).
3. App-specific non-goals + phased roadmap — see `ROADMAP.md`.
4. Data portability — re-add a one-tap "Download my data".

## Still open for production
- GitHub repo secrets for the live build (`VITE_SUPABASE_*`).
- Supabase redirect URLs + provider enablement (Google/email, then phone/Apple).
- Manual smoke test on a real device; final end-to-end verification.
