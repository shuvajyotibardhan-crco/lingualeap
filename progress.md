# Project State
- **Last Updated:** 2026-04-28
- **Current Branch:** main
- **Current Task:** T1 — Auth, ProgressContext, curriculum engine, TTS/ASR, gameplay modes

## Completed Actions
1. [x] All docs written & APPROVED (REQUIREMENTS, DESIGN, SPECS, TASKS)
2. [x] App name: LinguaLeap | Full-completion badge: Lingua Legend
3. [x] All 100 phrases: public/data/es/level_1.json → level_12.json
4. [x] T0 COMPLETE — repo: https://github.com/shuvajyotibardhan-crco/lingualeap
5. [x] Firebase project created: lingualeap-divel
6. [x] Firebase Auth enabled: Email/Password + Google (support email: shuvajyotibardhan@gmail.com)
7. [x] Firestore created (production mode)
8. [x] .env created locally with all Firebase config values
9. [x] All 7 GitHub Actions secrets set (VITE_FIREBASE_* × 6 + FIREBASE_SERVICE_ACCOUNT)
10. [x] Service account JSON moved to ~/Downloads (never in repo)
11. [x] .gitignore updated: *-adminsdk-*.json excluded

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 Auth + Firestore / Web Speech API / vite-plugin-pwa
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- Firebase persistence: initializeFirestore + persistentLocalCache
- GitHub repo: https://github.com/shuvajyotibardhan-crco/lingualeap
- gh CLI: /Users/shuvajyotibardhan/bin/gh (authenticated as shuvajyotibardhan-crco)
- CI/CD: push to main → GitHub Actions builds + deploys to Firebase Hosting

## T1 Task Status (next)
- [ ] T1.1 — AuthContext, ProtectedRoute, LoginPage, RegisterPage
- [ ] T1.2 — ProgressContext + Firestore read/write + offline persistence
- [ ] T1.3 — useLevelData hook (fetches /data/es/level_N.json)
- [ ] T1.4 — TTS: src/lib/tts.js + useTTS hook
- [ ] T1.5 — ASR: src/lib/asr.js + src/lib/fuzzy.js + useASR hook
- [ ] T1.6 — XP/stars/badge logic
- [ ] T1.7 — UI components: PhraseCard, LevelCard, NounBank, RewardAnimation
- [ ] T1.8 — LevelMap page
- [ ] T1.9 — LevelPage + mode selector
- [ ] T1.10–T1.13 — Discovery, ShadowChallenge, Roleplay, QuickFire modes
- [ ] T1.14 — PWA offline verification
- [ ] T1.15 — Iteration 1 QA

## Next Immediate Step
- Begin T1.1: AuthContext + ProtectedRoute + LoginPage + RegisterPage
