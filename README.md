# ExamSim (JEE Advanced CBT Simulator)

Practise past JEE Advanced papers the way the real exam feels: a computer-based test (CBT) with the actual question paper on one side, an answer panel and question palette on the other, a timer, and instant scoring with the official marking scheme.

**Try it:** https://yatharth1011.github.io/jee-adv-paper/

## Features

- **Real papers**: JEE Advanced 2021–2025, Paper 1 and Paper 2 (PDFs in [`public/papers`](public/papers))
- **CBT interface**: question palette with answered / marked / not-visited states, and answer entry for single-correct, multiple-correct and numerical questions
- **Year-accurate marking**, including partial marking for multiple-correct and negative marking per section
- **Evaluate with FIITJEE key** after submitting
- **Timer with a time-scale factor**: the [FasterTimer](https://github.com/yatharth1011/FasterTimer) idea, e.g. sit a 3-hour paper in less real time
- **Past tests** history, plus an optional study timetable
- **Accounts** with a local server, or fully offline on GitHub Pages (below)

## Run locally (full mode)

```bash
npm install
npm run dev:full
```

- Frontend: `http://localhost:5173`
- Local auth/data server: `http://localhost:8787`

The local server listens on `localhost` only and stores accounts in `server-data/` (git-ignored). Passwords are hashed with salted scrypt. Set `HOST=0.0.0.0` only if you really want other devices on your network to reach it.

## Deploy on GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

### One-time GitHub settings
1. Push this branch to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.

After that, every push to `main`/`master`/`work` triggers deployment.

## About auth on GitHub Pages

GitHub Pages is static hosting, so your local Node server (`server.mjs`) does not run there.

- If `/api` is available (local/full mode), the app uses server-backed multi-user storage.
- If `/api` is unavailable (GitHub Pages), the app automatically falls back to offline local mode in browser storage, so it still works.

## Build/test

```bash
npm run build
npm test
```

## Tech

React + TypeScript, Vite, Tailwind CSS with shadcn/ui, and `react-pdf` for the paper viewer.
