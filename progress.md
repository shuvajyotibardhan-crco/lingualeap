# Project State
- **Last Updated:** 2026-04-28
- **Current Branch:** main
- **Current Task:** T0 complete — first commit + GitHub repo push in progress

## Completed Actions
1. [x] docs/REQUIREMENTS.md — written & APPROVED
2. [x] docs/DESIGN.md — written & APPROVED
3. [x] docs/SPECS.md — written & APPROVED
4. [x] docs/TASKS.md — written & APPROVED
5. [x] App name: LinguaLeap | Full-completion badge: Lingua Legend
6. [x] All 100 phrases saved: public/data/es/level_1.json → level_12.json
7. [x] T0.1 — git init (main branch), .gitignore
8. [x] T0.2 — Vite scaffold, package.json (React 19, Firebase 11, Tailwind 3, react-router-dom 7, lucide-react, vite-plugin-pwa), npm install
9. [x] T0.3 — src/lib/firebase.js (Firebase 11 persistentLocalCache), .env.example, Tailwind + Nunito font
10. [x] T0.4 — .github/workflows/deploy.yml, firebase.json, firestore.rules
11. [x] Code review fixes: phrase data moved to public/data/es/, Workbox pattern fixed, firebase.js updated to modern API, cache headers corrected, deploy.yml hardened
12. [x] Build verified: npm run build passes ✓

## Current Logic Context
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 Auth + Firestore + Hosting / Web Speech API / vite-plugin-pwa
- Phrase data: public/data/es/level_N.json → fetched at runtime as /data/es/level_N.json
- Firebase persistence: initializeFirestore + persistentLocalCache (Firebase 11 modern API)
- Hosting: Firebase Hosting + GitHub Actions CI/CD on push to main
- gh CLI: /Users/shuvajyotibardhan/bin/gh (authenticated as shuvajyotibardhan-crco)

## T0 Task Status
- [x] T0.1 — git init, .gitignore, main branch
- [x] T0.2 — Vite scaffold + deps installed
- [x] T0.3 — firebase.js, .env.example, vite.config.js, tailwind.config.js
- [x] T0.4 — deploy.yml, firebase.json, firestore.rules
- [ ] T0 final — create GitHub repo + push → confirm CI green

## Next Immediate Step
- Create GitHub repo `lingualeap` and push first commit
- Add GitHub Actions secrets (VITE_FIREBASE_* + FIREBASE_SERVICE_ACCOUNT) — needs user to provide Firebase config values
- T1: Auth screens, ProgressContext, curriculum engine, TTS, ASR, gameplay modes
