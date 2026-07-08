# Release Checklist — Smoking Tracker

Live: https://aneeshk-ds.github.io/smoking-tracker/ · Status: **functionally complete, cloud-synced, deployed**

## ✅ Done & verified
- Core tracking, goals (Aware/Reduce/Quit) with a **settable + visible daily target**
- Honest calendar shading (on/over target, darker = more cigarettes)
- Streaks, achievements, insights, health milestones
- New-user tutorial: ⓘ tooltips on every metric + first-run guided tour (replayable)
- PWA install + offline (base-aware service worker, manifest, maskable icons)
- **Auto-update**: build version stamp + `version.json`; app refreshes into new deploys (no hard-refresh)
- Light/dark/system theme
- Share (native share + PNG download), JSON import, brand add/edit, demo-data seeder
- Auth: **Google + email** (magic-link / OTP) working
- **Cloud sync verified end-to-end**: push (guest→account migration), realtime pull, realtime delete, per-user isolation via RLS (`auth.uid() = user_id`)
- Security: removed the exposed `SECURITY DEFINER` function; Supabase security advisors clean (except N/A password lint)
- **71 unit tests passing**, production build clean
- GitHub `main`, local E: copy, and live site all in sync (commit `5a0ac87`)

## ⚠️ Do before you call it "launched" (your calls)
1. **Clear the demo data.** Your account currently holds 247 sample entries + goal=Reduce/target=8. Settings → Clear all data (you're signed in, so it clears the cloud copy too).
2. **Production email.** Sign-in email runs on your personal Gmail SMTP — low daily send limits, can be rate-limited/flagged with real users. For a public launch, point Supabase SMTP at Resend/Postmark/SendGrid with a verified sending domain.
3. **Run the E2E suite once on your machine.** `npx playwright install` then `npm run test:e2e`. They're written & committed but were never executed (no browser in the build environment) — confirm they pass or adjust selectors.
4. *(Optional)* Enable "Leaked password protection" in Supabase Auth — harmless, irrelevant to OTP/OAuth.

## 🔜 Deferred features (not blockers)
- **Phone sign-in** — connect Twilio SMS in Supabase Auth
- **Apple sign-in** — needs Apple Developer Program ($99/yr)

## 🧊 Nice-to-haves (low priority)
- Code-split the ~1 MB JS bundle (kept single for offline-first reliability; ~290 KB gzipped)
- Remote error monitoring (currently on-device logger only)
- Custom domain instead of github.io
