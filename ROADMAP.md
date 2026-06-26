# Smoking Tracker — roadmap & non-goals

## Non-goals (v1 will NOT do)
- No enterprise/admin panel or multi-user teams.
- No advanced analytics or ML predictions.
- No paid/premium tier or in-app purchases.
- No social feed or public sharing beyond the optional share card.
- No medical advice or clinical claims — it is a personal tracker.

## What "done" means here
Useful, reliable, safe, supportable, adoptable (per the master guide). The app is
already useful/safe/adoptable; this roadmap closes reliability + supportability.

## Phase 1 — Core works (DONE)
- One-tap logging, honest streaks, insights, health timeline, offline PWA.
- Onboarding with goal, target, brand, and a "why I'm quitting" reason.

## Phase 2 — Reliability & safety hardening (IN PROGRESS)
- Supabase backend: auth (Google/Apple/phone/email) + Postgres sync with RLS.
- Account-based backup (no files to manage).
- Automated tests for core logic; client error logging.
- Clear, human retry/error messages.

## Phase 3 — Polish & launch
- Light/dark theme (DONE); Settings redesign (DONE).
- Re-add one-tap "Download my data" for portability.
- Enable providers in Supabase; add redirect URLs + GitHub build secrets.
- Manual smoke test on real devices; final end-to-end verification.

## Phase 4 — Later (post-launch)
- Optional reminders/notifications.
- Richer insights (trends, correlations).
- Remote monitoring/health metrics if usage grows.
