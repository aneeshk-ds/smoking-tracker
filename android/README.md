# Smoking Tracker — Android (Play Store) build

This branch (`android-build`) packages the **existing live app** as an Android app
using a **Trusted Web Activity (TWA)** — a thin native shell around the PWA that
produces a real, signed `.aab` you upload to the Play Store. `main` is untouched.

> Why not React Native? A TWA ships the app you already have (all features, one
> codebase) and is officially Play-supported. React Native would be a multi-week
> rewrite for zero user-facing gain right now.

---

## Does a TWA scale to a huge user base? Yes.

The wrapper adds **no** server component and **no** scaling cost — it just renders
your web app. Scale is a function of the architecture, which is favourable:

- **Static hosting (CDN):** the app is static files. Serving them to millions is a
  CDN's easiest job. (If GitHub Pages bandwidth ever bites, move static hosting to
  Cloudflare Pages / Netlify — minutes, not a rewrite.)
- **Local-first compute:** logging, storage and analytics run **on each device**
  (IndexedDB). A million users = a million phones doing their own work = ~zero
  server load for free/local users. This is the real superpower.
- **Backend only for the minority who sync:** Supabase (Postgres) scales with
  bigger compute / read replicas / pooling to millions of rows — and by then
  revenue dwarfs the bill.

**Native would only be needed for specific device features** (home-screen widgets,
rock-solid background scheduling, wearables) — not for scale — and can be funded
later. Background reminders, if needed, are solved from a TWA via Firebase Cloud
Messaging.

---

## Two ways to build the `.aab`

### Option A — PWABuilder.com (easiest, no toolchain) ✅ recommended to start
1. Go to **https://www.pwabuilder.com** and enter `https://aneeshk-ds.github.io/smoking-tracker/`.
2. Click **Package for stores → Android**. Keep "Signing key: create new" (or upload your own).
3. Download the zip. It contains **`app-release-signed.aab`**, your **signing key**,
   and **`assetlinks.json`**. **Back up the signing key + password somewhere safe —
   losing it means you can't update the app.**

### Option B — Bubblewrap / CI (automated, reproducible)
Local:
```bash
npm i -g @bubblewrap/cli
cd android
bubblewrap update      # generates the Android project from twa-manifest.json
bubblewrap build       # produces app-release-bundle.aab (signed)
```
CI: run the **“Build Android AAB (TWA)”** GitHub Action (Actions tab → Run workflow).
Add these repo secrets first: `UPLOAD_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
`KEY_PASSWORD`. Download the `.aab` from the run's **Artifacts**.

Generate an upload keystore once:
```bash
keytool -genkeypair -v -keystore upload-keystore.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 9125
base64 -w0 upload-keystore.jks   # value for UPLOAD_KEYSTORE_BASE64
```

---

## Prerequisites you must handle (external accounts / keys)

1. **Google Play Console** — one-time **$25** developer registration.
2. **Digital Asset Links (domain verification)** — a TWA verifies it owns the site
   via `https://<origin>/.well-known/assetlinks.json` at the **domain root**.
   - Our app lives at `aneeshk-ds.github.io/smoking-tracker/` (a *project* page), so
     the file must be served at `https://aneeshk-ds.github.io/.well-known/assetlinks.json`
     (the **domain root**, which the project repo can't serve).
   - **Recommended fix: put the app on a custom domain** (e.g. `app.yourbrand.com`),
     where you control the root and can serve `/.well-known/assetlinks.json`. This is
     good for branding/pricing anyway. Alternatively, create an `aneeshk-ds.github.io`
     user-pages repo to serve the file at the root.
   - Fill `assetlinks.template.json` with your **app-signing SHA-256 fingerprint**
     (Play Console → App integrity → App signing, or from your keystore via
     `keytool -list -v -keystore upload-keystore.jks`), rename to `assetlinks.json`,
     and serve it at the origin root. Without this the app runs but shows a browser
     URL bar instead of full-screen.
3. **Signing key** — enroll in **Play App Signing** (Google holds the app key; you
   keep only an *upload* key). Keep your upload key + passwords backed up.

---

## Upload checklist
- [ ] Play Console account created ($25)
- [ ] App on a custom domain (or assetlinks served at github.io root)
- [ ] `.aab` built (PWABuilder or Bubblewrap/CI)
- [ ] `assetlinks.json` live at the domain root with the correct SHA-256
- [ ] Play listing: name, description, screenshots (use `docs/screenshots/`), privacy policy (PRIVACY.md), content rating, data-safety form
- [ ] Upload `.aab` → internal testing → production
