# Project State
- **Last Updated:** 2026-04-28
- **Current Branch:** main
- **Current Task:** T1.2 — ProgressContext + Firestore read/write

## Completed Actions
1. [x] All docs written & APPROVED (REQUIREMENTS, DESIGN, SPECS, TASKS)
2. [x] All 100 phrases: public/data/es/level_1.json → level_12.json
3. [x] T0 COMPLETE — repo: https://github.com/shuvajyotibardhan-crco/lingualeap
4. [x] Firebase project: lingualeap-divel | Auth: Email+Google | Firestore: production mode
5. [x] All 7 GitHub Actions secrets set
6. [x] T1.1 COMPLETE — AuthContext, ProtectedRoute, LoginPage, RegisterPage, App.jsx routes

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 / Web Speech API / vite-plugin-pwa
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- Auth flow: /login (email+Google) → / (ProtectedRoute → LevelMap) | /register → /
- Error messages: kid-friendly, inline per-field validation on RegisterPage
- Google OAuth: popup, ignores popup-closed-by-user silently
- LevelMap is a placeholder — full implementation in T1.8
- gh CLI: /Users/shuvajyotibardhan/bin/gh

## T1 Task Status
- [x] T1.1 — AuthContext, ProtectedRoute, LoginPage, RegisterPage, App.jsx
- [ ] T1.2 — ProgressContext + Firestore read/write + offline persistence
- [ ] T1.3 — useLevelData hook (fetches /data/es/level_N.json)
- [ ] T1.4 — TTS: src/lib/tts.js + useTTS hook
- [ ] T1.5 — ASR: src/lib/asr.js + src/lib/fuzzy.js + useASR hook
- [ ] T1.6 — XP/stars/badge logic
- [ ] T1.7 — UI components: PhraseCard, LevelCard, NounBank, RewardAnimation
- [ ] T1.8 — LevelMap page (full)
- [ ] T1.9 — LevelPage + mode selector
- [ ] T1.10–T1.13 — Discovery, ShadowChallenge, Roleplay, QuickFire modes
- [ ] T1.14 — PWA offline verification
- [ ] T1.15 — Iteration 1 QA

## Next Immediate Step
- T1.2: ProgressContext — reads/creates users/{uid} Firestore doc on auth; exposes awardXP, saveStars, saveBadge, isLevelUnlocked
