# Project State
- **Last Updated:** 2026-04-30
- **Current Branch:** main
- **Current Task:** Phase 2 planning COMPLETE — awaiting Phase 1 UAT sign-off before implementation

## Completed Actions
1. [x] All docs written & APPROVED (REQUIREMENTS, DESIGN, SPECS, TASKS) — Iteration 1
2. [x] All 100 phrases: public/data/es/level_1.json → level_12.json
3. [x] T0 COMPLETE — repo: https://github.com/shuvajyotibardhan-crco/lingualeap
4. [x] Firebase project: lingualeap-divel | Auth: Email+Google | Firestore: production
5. [x] All 7 GitHub Actions secrets set
6. [x] CI FIX — removed "Deploy Firestore rules" step from deploy.yml (service account lacked serviceusage.googleapis.com permission; rules managed in Firebase Console)
7. [x] T1.1–T1.15 — Full app built and deployed (Auth, Progress, TTS, ASR, all 4 modes, PWA)
8. [x] UAT fixes: email verification banner, QuickFire audio-only mode, Roleplay instructions, Noun Bank panel
9. [x] Noun Bank expanded — public/data/es/noun_bank.json (1,373 entries, 12 categories)
10. [x] Global claude rules updated — Feature Delivery Workflow added to .claude_rules.md
11. [x] REQUIREMENTS.md — Features 12 (Contact Admin), 13 (Admin Dashboard), 14 (User Self-Service Settings) written & APPROVED
12. [x] DESIGN.md — Cloud Functions architecture, 15 new module descriptions, updated tech stack & deployment
13. [x] SPECS.md — contactMessages schema, pendingEmailChange/pendingUsernameChange fields, CF-0 through CF-8 API reference, updated file inventory & security notes
14. [x] TASKS.md — T5.1–T5.41 written (Iteration 5 full task list)
15. [x] PLAN.md — Iteration 5 section added; phase renaming documented; Immediate Next Actions updated

## Phase Renaming (approved 2026-04-30)
- Admin Dashboard + Contact Admin + User Self-Service = **Phase 2** (Iteration 5)
- Old "Phase 2" content (Levels 5–8) = **Phase 3** (Iteration 2 in TASKS.md)
- Old "Phase 3" content (Levels 9–12) = **Phase 4** (Iteration 3 in TASKS.md)

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 / Web Speech API / vite-plugin-pwa
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- Noun bank: public/data/es/noun_bank.json (1,373 entries)
- ProgressContext exposes: progress, awardXP(wasFirstAttempt), completeLevel(level, firstAttemptPasses, totalPhrases), isLevelUnlocked(level), calculateStars(total, firstAttempt)
- PASS_XP=10, FIRST_ATTEMPT_BONUS=5, PASS_THRESHOLD=0.60

## Next Immediate Step
- **Awaiting Phase 1 UAT sign-off** — user to validate app on live URL (https://lingualeap-divel.web.app)
- Once UAT signed off: begin Iteration 5 implementation at T5.1 (upgrade to Firebase Blaze)
- T5.1 is manual (Firebase Console); T5.2 is first code task (bootstrap functions/ directory)
