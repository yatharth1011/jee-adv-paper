# ExamSim (JEE Advanced CBT Simulator)

## Run locally (full mode)

```bash
npm install
npm run dev:full
```

- Frontend: `http://localhost:5173`
- Local auth/data server: `http://localhost:8787`

## Deploy on GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

### One-time GitHub settings
1. Push this branch to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.

After that, every push to `main`/`master`/`work` triggers deployment.

## About auth on GitHub Pages

GitHub Pages is static hosting, so your local Node server (`server.mjs`) does not run there.

- If `/api` is available (local/full mode), app uses server-backed multi-user storage.
- If `/api` is unavailable (GitHub Pages), app automatically falls back to offline local mode in browser storage so the app still works.

## Build/test

```bash
npm run build
npm test
```
