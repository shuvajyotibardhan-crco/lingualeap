# TASKS — LinguaLeap

Phased task breakdown. Each iteration must be tested and signed off before the next begins.

---

## ITERATION 0 — Project Setup & CI/CD

### T0.1 — Repo & Firebase
- [ ] `git init` in project root; create `.gitignore` (node_modules, dist, .env, .DS_Store)
- [ ] Create GitHub repo `lingualeap` and push initial commit
- [ ] Create Firebase project `lingualeap` (Spark plan)
- [ ] Enable Firebase Auth → Email/Password + Google providers
- [ ] Enable Firestore (production mode); write security rules (see SPECS.md)
- [ ] Copy Firebase config values into `.env`; create `.env.example` with placeholders

### T0.2 — Scaffold React/Vite App
- [ ] `npm create vite@latest . -- --template react`
- [ ] Install deps: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`, `firebase`, `lucide-react`, `vite-plugin-pwa`
- [ ] Configure Tailwind (`tailwind.config.js`, `postcss.config.js`)
- [ ] Configure Vite PWA plugin in `vite.config.js` (name, icons, theme colour, offline strategy)
- [ ] Create `public/manifest.json` and PWA icons (192×192, 512×512)
- [ ] Verify `npm run dev` launches without errors

### T0.3 — Firebase Integration
- [ ] Create `src/lib/firebase.js` — init app, export `auth` and `db`
- [ ] Confirm `onAuthStateChanged` fires in browser console

### T0.4 — GitHub Actions CI/CD
- [ ] Create `.github/workflows/deploy.yml`
  - Trigger: push to `main`
  - Steps: `npm ci` → `npm run build` (inject `VITE_FIREBASE_*` secrets) → Firebase Hosting deploy → Firestore rules deploy
- [ ] Add all `VITE_FIREBASE_*` secrets + `FIREBASE_SERVICE_ACCOUNT` to GitHub repo secrets via `gh` CLI
- [ ] Create `firebase.json` (public: dist) and `firestore.rules`
- [ ] Push to `main` → confirm GitHub Actions run passes → confirm live URL loads

**T0 done when:** live Firebase Hosting URL shows the Vite default page.

---

## ITERATION 1 — Full App + Phase 1 Content (Levels 1–4)

### T1.1 — Auth
- [ ] Create `src/context/AuthContext.jsx` (wraps `onAuthStateChanged`; provides `{ user, loading }`)
- [ ] Create `src/components/ProtectedRoute.jsx` (redirects to `/login` if no user)
- [ ] Create `src/pages/RegisterPage.jsx` — username + email + password form
  - Inline validation: email format, password ≥8 chars, duplicate email error
  - On success: `createUserWithEmailAndPassword` + `updateProfile(displayName)`
- [ ] Create `src/pages/LoginPage.jsx` — email sign-in + Google OAuth button
  - Google: `signInWithPopup(auth, googleProvider)`
  - Forgot password: `sendPasswordResetEmail`
- [ ] Wire routes in `src/App.jsx`: `/login`, `/register`, `/` (protected)
- [ ] Test all auth acceptance criteria (REQUIREMENTS Feature 1)

### T1.2 — Progress Context & Firestore
- [ ] Create `src/context/ProgressContext.jsx`
  - On auth: read `users/{uid}` from Firestore (create doc if new user, seed `unlockedLevels: [1]`, `xp: 0`)
  - Expose: `progress`, `awardXP(wasFirstAttempt)`, `saveStars(level, stars)`, `saveBadge(badge)`, `isLevelUnlocked(level)`
- [ ] Create `src/hooks/useProgress.js` (re-exports context)
- [ ] Enable Firestore offline persistence (`enableIndexedDbPersistence`)
- [ ] Verify Firestore doc created on first login; verify offline write queuing

### T1.3 — Curriculum Engine
- [ ] Create `src/hooks/useLevelData.js` — fetches `/src/data/{lang}/level_{n}.json`, returns `{ phrases, loading }`
- [ ] Confirm `level_1.json` through `level_4.json` load correctly (already created)
- [ ] Implement level lock guard in router: direct URL to locked level → redirect to Level Map

### T1.4 — TTS
- [ ] Create `src/lib/tts.js` — `speak(text, lang)`, `selectVoice(lang)` (see SPECS.md algorithm)
- [ ] Create `src/hooks/useTTS.js` — returns `{ speak, isSpeaking }`
- [ ] Test: Spanish voice selected when available; default fallback when not; no network call; cancels previous utterance

### T1.5 — ASR
- [ ] Create `src/lib/asr.js` — `startListening(lang, onResult, onError)`, `stopListening()`; returns null when unsupported
- [ ] Create `src/lib/fuzzy.js` — `normalise(str)`, `levenshtein(a, b)`, `similarity(a, b)`; `PASS_THRESHOLD = 0.60`
- [ ] Create `src/hooks/useASR.js` — returns `{ startListening, stopListening, transcript, isListening, isSupported }`
- [ ] Test: wave animation on listening; pass/retry logic; zero outbound network requests; Firefox fallback

### T1.6 — XP & Rewards Logic
- [ ] Create `src/lib/xp.js` — constants `PASS_XP = 10`, `FIRST_ATTEMPT_BONUS_XP = 5`
- [ ] Implement `calculateStars(phrases, firstAttemptPasses)` in ProgressContext
- [ ] Implement badge award logic (phase1 on level 4, phase2 on level 8, phase3 on level 12, linguaLegend on all 12)
- [ ] Create `src/components/RewardAnimation.jsx` — plays on level complete; auto-dismisses after 2s

### T1.7 — UI Components
- [ ] Create `src/components/PhraseCard.jsx` — Spanish text, English translation, TTS button (44px min)
- [ ] Create `src/components/LevelCard.jsx` — locked/unlocked/completed states, star display
- [ ] Create `src/components/NounBank.jsx` — slide-up panel, category tiles, TTS on tap
- [ ] Apply Tailwind: bright palette, WCAG AA contrast, 44px touch targets throughout

### T1.8 — Level Map
- [ ] Create `src/pages/LevelMap.jsx`
  - 12-level grid (Levels 5–12 always visible but locked until Phase 2/3 data is added — show as "Coming Soon")
  - XP total in header at all times
  - Reads unlock state from ProgressContext

### T1.9 — Level Page & Mode Selector
- [ ] Create `src/pages/LevelPage.jsx` — loads level JSON, renders mode selector (4 modes)
- [ ] Wire route `/level/:id` in App.jsx

### T1.10 — Discovery Mode
- [ ] Create `src/modes/Discovery.jsx`
  - Illustrated scene (unDraw SVG); tappable objects call `speak(spanishWord)`
  - No scoring; purely exploratory
- [ ] One scene per level 1–4; use placeholder SVG if custom scene not ready

### T1.11 — Shadow Challenge Mode
- [ ] Create `src/modes/ShadowChallenge.jsx`
  - Play TTS → show mic button → `startListening` → fuzzy score → pass/retry
  - Listening wave animation (CSS)
  - Pass: XP award + green animation; Retry: "Try again!" only (no negative language)
  - ASR unavailable: tap-to-select fallback (show 2 options: correct + one distractor)

### T1.12 — Roleplay Mode
- [ ] Create `src/modes/Roleplay.jsx`
  - One scenario per level 1–4 (e.g. "Greet someone", "Order at the café")
  - Goal text shown; tap correct phrase from options to advance
  - XP per step; RewardAnimation on completion

### T1.13 — Quick-Fire Mode
- [ ] Create `src/modes/QuickFire.jsx`
  - Auto-play TTS on load; 4 image options; countdown timer (10s)
  - Correct: XP + next phrase; Wrong/timeout: "Try again!" + replay audio
  - Images: unDraw illustrations or emoji fallback for MVP

### T1.14 — PWA & Offline
- [ ] Verify service worker registers and caches assets on first load
- [ ] Test airplane mode: app loads, TTS works, XP queues and syncs on reconnect
- [ ] Test "Add to Home Screen" on Chrome mobile

### T1.15 — Iteration 1 QA
- [ ] Run through every acceptance criterion in REQUIREMENTS Features 1–9
- [ ] Lighthouse audit: Performance ≥80, Accessibility ≥90, PWA ✓
- [ ] Test on: Chrome desktop, Chrome mobile (375px), Safari iOS, Firefox
- [ ] Fix all blockers; push to `main`; confirm deploy succeeds

**T1 done when:** full app works end-to-end on live URL with Phase 1 content; all Feature 1–9 test plans pass.

---

## ITERATION 2 — Phase 2 Content (Levels 5–8)

> No engine changes needed. Data is already saved in `src/data/es/level_5.json` through `level_8.json`.

### T2.1 — Unlock Phase 2 Levels
- [ ] Remove "Coming Soon" state from Level Map for levels 5–8
- [ ] Verify levels 5–8 unlock correctly after Level 4 completion

### T2.2 — Phase 2 Scenes & Roleplay Scenarios
- [ ] Add Discovery scenes for levels 5–8 (family, playground, clothing, school)
- [ ] Add Roleplay scenarios for levels 5–8 (e.g. "Introduce your family", "Ask to play")

### T2.3 — Phase 2 QA
- [ ] Run through REQUIREMENTS Feature 10 test plan
- [ ] Regression: confirm Levels 1–4 star ratings and badges unaffected
- [ ] Push to `main`; confirm deploy

**T2 done when:** Levels 5–8 work fully; Phase 2 badge awards on Level 8 completion.

---

## ITERATION 3 — Phase 3 Content (Levels 9–12)

> No engine changes needed. Data is already saved in `src/data/es/level_9.json` through `level_12.json`.

### T3.1 — Unlock Phase 3 Levels
- [ ] Remove "Coming Soon" state from Level Map for levels 9–12
- [ ] Verify levels 9–12 unlock correctly after Level 8 completion

### T3.2 — Phase 3 Scenes & Roleplay Scenarios
- [ ] Add Discovery scenes for levels 9–12 (market, transport, clock/calendar, help scene)
- [ ] Add Roleplay scenarios for levels 9–12 (e.g. "Buy a bus ticket", "Ask for help")

### T3.3 — Lingua Legend Celebration
- [ ] Verify "Lingua Legend" full-completion celebration triggers after Level 12
- [ ] Confirm `linguaLegend` badge saved to Firestore

### T3.4 — Phase 3 QA
- [ ] Run through REQUIREMENTS Feature 11 test plan
- [ ] Regression: confirm all Phase 1 & 2 content unaffected
- [ ] Full end-to-end smoke test (PLAN.md Verification table)
- [ ] Push to `main`; confirm deploy

**T3 done when:** all 12 levels work; Lingua Legend badge awards; full integration smoke test passes.

---

## ITERATION 4 — Docs & Final Deployment

### T4.1 — Project Documentation
- [ ] Confirm `docs/REQUIREMENTS.md`, `docs/DESIGN.md`, `docs/SPECS.md`, `docs/TASKS.md` are all current
- [ ] Create `CLAUDE.md` at project root (tech stack, Firebase config refs, GitHub repo URL, key decisions)
- [ ] Create `README.md` (what it is, how to run locally, how CI/CD works)
- [ ] Commit docs + code together; push to `main`

### T4.2 — Post-Launch
- [ ] Verify live URL is stable after T3 push
- [ ] Check Firebase Console: Auth users, Firestore reads/writes within free tier
- [ ] Save project memory to `~/.claude/projects/` memory files

**T4 done when:** all docs committed and live; app stable on Firebase Hosting.
