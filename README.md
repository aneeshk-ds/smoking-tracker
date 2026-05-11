# Smoking Tracker

A private, offline-first PWA for tracking a smoking habit. No accounts. No cloud. All data stays on the device.

---

## Stack

- React 18 + Vite 5
- Tailwind CSS v3 (custom dark theme)
- Dexie.js (IndexedDB — all storage is local)
- Recharts (data visualisation)
- date-fns

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Build

```bash
npm run build
npm run preview
```

---

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder to the `main` branch.
2. In the repo settings, go to **Pages → Source** and select **GitHub Actions**.
3. Push any commit to `main`. The workflow in `.github/workflows/deploy.yml` runs automatically and deploys to:

```
https://<your-username>.github.io/<repo-name>/
```

The workflow sets `VITE_BASE` to `/<repo-name>/` at build time so all asset paths resolve correctly.

---

## Add to Home Screen

**iOS (Safari):** Open the app, tap the Share button, then tap "Add to Home Screen".

**Android (Chrome):** Open the app, tap the menu button, then tap "Add to Home Screen" or "Install App".

---

## Privacy

- Zero data leaves the device. Ever.
- No analytics, no tracking, no ads.
- All entries are stored in the browser's IndexedDB.
- Use Settings → Export JSON to back up your data locally.

---

## Features

- Log cigarettes with one tap (long-press for details: brand, location, trigger, craving level)
- Honest streaks — no reset to zero on a slip
- Insights: heatmap, trend chart, weekday/weekend split, trigger breakdown, cost projection
- Health milestones: WHO/CDC recovery timeline with live elapsed timer
- Monthly report (browser print → Save as PDF)
- Share card (1080x1350 PNG for Instagram)
- JSON/CSV export and import
- PWA — installable, works offline after first load
