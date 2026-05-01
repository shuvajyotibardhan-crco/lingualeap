# LinguaLeap — Project Context for Claude Code

## What This Project Is
A zero-cost, kid-focused Progressive Web App teaching children "Survival Spanish" for travel. 100 phrases across 12 levels, 4 gameplay modes, offline-capable, Firebase-backed.

## GitHub Repo
https://github.com/shuvajyotibardhan-crco/lingualeap

## Firebase
- Project ID: `lingualeap-divel`
- Auth: Email/password + Google OAuth
- Firestore: `users/{uid}` document per user (xp, levelStars, badges, unlockedLevels)
- Admin account: `app_admin@divel.me` — has `admin: true` custom claim; UID in GitHub Secret ADMIN_UID
- Hosting: https://lingualeap-divel.web.app
- Firestore security rules managed directly in Firebase Console (not via CI — service account lacks serviceusage permission)

## Tech Stack
- React 19 + Vite 8 + Tailwind CSS 3 (brand colours: yellow #FFD93D, orange #FF6B35, green #4CAF50)
- Firebase 11 (Auth + Firestore with `persistentLocalCache`)
- Web Speech API (TTS + ASR — browser-native, zero network)
- vite-plugin-pwa (Workbox) — offline-first service worker
- GitHub Actions CI/CD — push to `main` → build → Firebase Hosting deploy

## Architecture Decisions
- Phrase data served as static JSON from `public/data/es/level_N.json` → URL `/data/es/level_N.json`
- No backend / Cloud Functions — all logic is client-side + Firestore
- ProgressContext wraps all XP/stars/badge/unlock state; single atomic Firestore write per `completeLevel` call
- ProgressProvider mounted inside ProtectedRoute (auth-gated)

## Key Constants
- PASS_XP = 10, FIRST_ATTEMPT_BONUS = 5, PASS_THRESHOLD = 0.60
- Stars: 3 = 100% first-try, 2 = ≥60% first-try, 1 = otherwise
- Phase badges: phase1 (L4), phase3 (L8), phase4 (L12), linguaLegend (all 12)

## Deployment
- NEVER run `firebase deploy` manually — it does not work on this machine
- NEVER ask the user to run git commands manually — always run them yourself
- All deploys happen via GitHub Actions on push to `main`
- All `.env` variables are stored as GitHub Actions Secrets

## gh CLI
- Located at `/Users/shuvajyotibardhan/bin/gh`
- Authenticated as `shuvajyotibardhan-crco`

## Global Rules
See `/Users/shuvajyotibardhan/Projects/.claude_rules.md` for full rules. Summary:

### Token Savings
- Never rewrite entire files — diff only
- Check `progress.md` before starting any session
- No exploratory terminal commands; brief explanations

### Documentation
- For every feature/bug: update REQUIREMENTS, DESIGN, SPECS, TASKS in the same commit as code
- Seek approval before pushing each doc stage to git
- Stale docs are a bug — never commit code without updating affected docs

### Deployment Verification — MANDATORY
After every `git push`, watch the GitHub Actions run to completion (`gh run watch <id> --exit-status`). If it fails, diagnose, fix, push, and watch again. **Never start the next task until the run passes.**

### AC Language Rule — MANDATORY
**Every Acceptance Criterion must use "shall" (expected behaviour) or "must" (mandatory constraint) only.**
No other modal verbs ("should", "will", "can", "needs to") are permitted in any AC, in any feature, ever.
Scan every AC for non-compliant language and fix before committing.

### Progress Tracking
- `progress.md` at project root tracks current task, completed actions, logic context, and next step
- Update `progress.md` after every completed task — never let it lag
