# Project State
- **Last Updated:** 2026-04-28
- **Current Branch:** main
- **Current Task:** T1.7 — UI components (PhraseCard, LevelCard, NounBank, RewardAnimation)

## Completed Actions
1. [x] All docs written & APPROVED (REQUIREMENTS, DESIGN, SPECS, TASKS)
2. [x] All 100 phrases: public/data/es/level_1.json → level_12.json
3. [x] T0 COMPLETE — repo: https://github.com/shuvajyotibardhan-crco/lingualeap
4. [x] Firebase project: lingualeap-divel | Auth: Email+Google | Firestore: production
5. [x] All 7 GitHub Actions secrets set
6. [x] T1.1 — AuthContext, ProtectedRoute, LoginPage, RegisterPage, App.jsx
7. [x] T1.2 — ProgressContext, useProgress hook, ProtectedRoute updated

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 / Web Speech API / vite-plugin-pwa
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- ProgressContext exposes: progress, awardXP(wasFirstAttempt), completeLevel(level, firstAttemptPasses, totalPhrases), isLevelUnlocked(level), calculateStars(total, firstAttempt)
- completeLevel: single atomic Firestore write — sets stars, unlocks next level, awards phase/legend badges
- PASS_XP=10, FIRST_ATTEMPT_BONUS=5, PASS_THRESHOLD=0.60 (in ProgressContext)
- ProgressProvider mounts inside ProtectedRoute (only when user is authenticated)

## T1 Task Status
- [x] T1.1 — AuthContext, ProtectedRoute, LoginPage, RegisterPage
- [x] T1.2 — ProgressContext, useProgress hook
- [x] T1.3 — useLevelData hook
- [x] T1.4 — TTS: src/lib/tts.js + useTTS hook
- [x] T1.5 — ASR: src/lib/asr.js + src/lib/fuzzy.js + useASR hook
- [ ] T1.6 — XP/stars/badge logic (done — inside ProgressContext.completeLevel)
- [ ] T1.7 — UI components: PhraseCard, LevelCard, NounBank, RewardAnimation
- [ ] T1.8 — LevelMap page (full)
- [ ] T1.9 — LevelPage + mode selector
- [ ] T1.10–T1.13 — Discovery, ShadowChallenge, Roleplay, QuickFire modes
- [ ] T1.14 — PWA offline verification
- [ ] T1.15 — Iteration 1 QA

## Next Immediate Step
- T1.7: UI components — PhraseCard, LevelCard, NounBank, RewardAnimation
- T1.8: Full LevelMap page (12-level grid, XP in header)
- T1.9: LevelPage + mode selector
