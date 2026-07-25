# LifeOS — Personal Productivity Dashboard

A free, all-in-one productivity dashboard that runs entirely in your browser. No sign-up, no servers, no ads — all your data stays on your device.

Built with **React + Vite + Tailwind CSS**, stored locally with **IndexedDB (Dexie.js)**, and installable as an offline app (PWA). Hosted for free on **GitHub Pages**.

---

## ✨ Features

- **Dashboard** — today's completion %, streaks, total stats, weekly productivity score, level progress, and an "Aurora Heatmap" of your activity
- **Daily Routines** — add, edit, reorder (drag & drop), categorize, prioritize, and track daily routines with a "Reset Today" option
- **Roadmap Tracker** — supports 400+ items, with search, filters, categories, tags, due dates, bulk actions, and sorting. Starts empty for every user — build your own roadmap for any goal (fully editable/removable)
- **Goals** — long-term and short-term goals with progress bars and deadlines
- **Habit Tracker** — daily, weekly, or monthly habits with streaks and completion percentages
- **Analytics** — daily/weekly/monthly/yearly trend charts, roadmap completion trend, and habit consistency charts
- **Notes & Journal** — markdown-based notes with a formatting toolbar and live preview, plus a daily journal
- **Calendar** — monthly view showing routine completion, roadmap progress, and journal entries per day
- **Pomodoro Timer** — customizable focus/break durations with session stats
- **Achievements** — badges and productivity levels that unlock as you progress
- **Settings** — light/dark/system theme, streak threshold, notifications, backup & restore, and data reset

---

## 🔒 Privacy & Data Storage

All data is stored **locally in your browser** using IndexedDB. Nothing is ever sent to a server. This means:

- Your PC and phone each have **separate** data by default
- To move data between devices, use **Settings → Export Backup** (downloads a `.json` file) and **Settings → Import Backup** on the other device
- Clearing your browser's site data will erase everything — export a backup first!

---

## 🚀 Getting Started (Local Development)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

```bash
npm run build      # Build for production (output in dist/)
npm run preview    # Preview the production build locally
```

---

## 🌐 Deploying to GitHub Pages (Free)

1. **Create a GitHub repository** (e.g. `lifeos`)

2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
   git push -u origin main
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```
   This builds the app and pushes it to a `gh-pages` branch.

4. **Enable GitHub Pages:**
   Go to your repo → **Settings → Pages** → set Branch to `gh-pages`, folder to `/ (root)` → Save

5. Your app will be live at:
   ```
   https://YOUR_USERNAME.github.io/lifeos/
   ```

6. **Install as an app:** open the link on desktop (Chrome/Edge) or mobile and use "Install"/"Add to Home Screen" for offline access.

---

## 🛠️ Tech Stack

| Purpose | Library |
|---|---|
| UI Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Local Database | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Icons | react-icons (Lucide set) |
| State | Zustand |
| Routing | React Router (HashRouter, for GitHub Pages compatibility) |
| Offline Support | vite-plugin-pwa |

---

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components, layout, heatmap, search
├── db/               # Dexie database schema, seed data, backup/restore
├── hooks/            # Live-query hooks for reactive data
├── pages/            # One file per app page (Dashboard, Routines, etc.)
├── store/            # Zustand stores (theme, UI state)
└── utils/            # Date, streak, score, achievement, analytics helpers
```

---

## 📝 Notes

- The pre-loaded roadmap is just starter data — edit, delete, or replace it freely from the Roadmap page.
- Keyboard shortcut: **Ctrl/Cmd + K** opens global search across routines, roadmap, goals, habits, and notes.
- Browser notifications (for Pomodoro) only work while LifeOS is open in a tab — true background push notifications would require a backend service.

---

Made with LifeOS 💜
