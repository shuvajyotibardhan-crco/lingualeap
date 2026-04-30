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

---

## ITERATION 5 — Admin Dashboard, Contact Admin & User Self-Service Settings

> **Stop gate:** Do not begin implementation until Phase 1 UAT is signed off.
> Each task maps to one atomic commit. Manual steps are marked **[MANUAL]** and must be completed before the dependent code task is tested.

### Infrastructure & Shared Utilities

#### T5.1 — Upgrade Firebase project to Blaze plan **[MANUAL]**
- Go to Firebase Console → Usage and billing → Modify plan → Blaze
- Required before any Cloud Functions can be deployed
- No code change; no commit needed

#### T5.2 — Bootstrap Cloud Functions project
- Create `functions/package.json` (firebase-functions v6, firebase-admin v13, nodemailer; engines: node 20)
- Create `functions/index.js` (re-exports all CFs; empty stubs initially)
- Update `firebase.json` — add `"functions": { "source": "functions" }`
- Commit: `chore: bootstrap Cloud Functions project`

#### T5.3 — `functions/src/email.js` — Nodemailer transporter + sendEmail helper
- `defineSecret` for SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Export `sendEmail(to, subject, text)` — creates transporter per call using secrets
- Commit: `feat: add email.js Nodemailer helper`

#### T5.4 — `functions/src/adminHelpers.js`
- `assertAdmin(context)` — throws `permission-denied` if `context.auth.uid !== process.env.ADMIN_UID`
- `generateTempPassword()` — `crypto.randomBytes(9).toString('base64url').slice(0,12)`
- `generateToken()` — `crypto.randomBytes(32).toString('hex')`
- Commit: `feat: add adminHelpers (assertAdmin, generateTempPassword, generateToken)`

#### T5.5 — `src/hooks/useCallable.js`
- Thin wrapper: `httpsCallable(functions, name)` → returns `{ call, loading, error, data }`
- Commit: `feat: add useCallable hook`

#### T5.6 — Schema gap fix — write `email` field to Firestore
- `src/pages/RegisterPage.jsx` → add `email: user.email` to the `setDoc` payload
- `src/context/ProgressContext.jsx` → `loadOrCreate` path: add `email: user.email` to the initial doc write
- Commit: `fix: write email field to users/{uid} at registration and Google OAuth login`

#### T5.7 — Update Firestore rules **[MANUAL]**
- Add `contactMessages/{messageId}` rule (see SPECS.md Firestore Schema section)
- Deploy via Firebase Console → Firestore → Rules (tab) → Edit and publish
- No code commit needed; note in progress.md that rules are live

---

### Contact Admin (Features 12)

#### T5.8 — CF-0: `submitContactMessage` (callable, open)
- `functions/src/submitContactMessage.js`
- Input validation: username (1–80 chars), email (valid format), message (1–2000 chars)
- Writes to `contactMessages` via Admin SDK; sets `uid: context.auth?.uid ?? null`
- Returns `{ success: true }`
- Export from `functions/index.js`
- Commit: `feat: CF-0 submitContactMessage callable`

#### T5.9 — CF-1: `onContactCreated` (Firestore trigger)
- `functions/src/onContactCreated.js`
- Trigger: `onDocumentCreated('contactMessages/{messageId}')`
- Emails `app_admin@divel.me` with sender name, email, message body, link to `/admin`
- Errors logged only (no rethrow — avoids infinite retry)
- Export from `functions/index.js`
- Commit: `feat: CF-1 onContactCreated — email admin on new message`

#### T5.10 — `ContactModal.jsx`
- `src/components/ContactModal.jsx`
- Props: `isOpen`, `onClose`, `prefillUsername?`, `prefillEmail?`
- Form fields: username, email (both disabled/pre-filled when logged in), message (2000-char limit + counter)
- Calls CF-0 via `useCallable`; shows success state on resolve; shows inline error on reject
- Slide-up panel (`fixed inset-x-0 bottom-0 z-50`)
- Commit: `feat: ContactModal component`

#### T5.11 — `ContactButton.jsx` FAB
- `src/components/ContactButton.jsx`
- Fixed bottom-right, `z-50`, 56px circle, brand-yellow background, envelope icon
- Manages `isOpen` state; passes prefill from `useProgress()` + `useAuth()`
- Commit: `feat: ContactButton FAB`

#### T5.12 — Add ContactButton to all logged-in screens
- `src/pages/LevelMap.jsx` — append `<ContactButton />` before closing div
- `src/pages/LevelPage.jsx` — same
- `src/modes/Discovery.jsx` — same
- `src/modes/ShadowChallenge.jsx` — same
- `src/modes/Roleplay.jsx` — same
- `src/modes/QuickFire.jsx` — same
- Commit: `feat: add ContactButton FAB to all logged-in screens`

#### T5.13 — Add "Contact Admin" link to LoginPage
- `src/pages/LoginPage.jsx` — add link below login form; opens `ContactModal` with no prefill
- Commit: `feat: add Contact Admin link to LoginPage`

---

### Admin Dashboard (Feature 13 — read + reply + admin-initiated user management)

#### T5.14 — CF-2: `adminReplyToContact` (callable, admin only)
- `functions/src/adminReplyToContact.js`
- Input: `{ messageId, replyText }` (replyText max 2000 chars)
- `assertAdmin(context)`; reads message → appends reply to `replies` array; sets `status: 'resolved'`; emails user
- Returns `{ success: true }`
- Commit: `feat: CF-2 adminReplyToContact`

#### T5.15 — `AdminRoute.jsx`
- `src/components/AdminRoute.jsx`
- `getIdTokenResult(true)` on mount; redirects to `/` if `claims.admin !== true`
- Shows loading spinner during token refresh
- Commit: `feat: AdminRoute custom claims guard`

#### T5.16 — `AdminDashboard.jsx` shell
- `src/pages/AdminDashboard.jsx`
- Sticky header "Admin Dashboard"; 3 tabs: Users | Messages | Settings
- Tab state managed locally; renders `<UsersTab />`, `<MessagesTab />`, `<SettingsTab />` conditionally
- Commit: `feat: AdminDashboard tab shell`

#### T5.17 — `UsersTab.jsx`
- `src/admin/UsersTab.jsx`
- `getDocs(collection(db, 'users'))` on mount; filter input by username (client-side)
- Each row: username, email, XP; expandable to show levelStars, badges, unlockedLevels
- Commit: `feat: UsersTab — list and filter all users`

#### T5.18 — `MessagesTab.jsx`
- `src/admin/MessagesTab.jsx`
- `getDocs(collection(db, 'contactMessages'))` on mount; grouped Open / Resolved sections
- Each card: sender name, email, message, timestamp; reply textarea + submit → CF-2
- On reply success: card moves to Resolved; shows confirmation
- Commit: `feat: MessagesTab — view and reply to contact messages`

#### T5.19 — Add `/admin` route to `App.jsx`
- `src/App.jsx` → `<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />`
- Commit: `feat: add /admin route`

---

### Password Reset (admin-initiated + user self-service)

#### T5.20 — CF-3: `adminResetPassword` (callable, admin or self)
- `functions/src/adminResetPassword.js`
- Input: `{ targetUid }`
- If caller is not admin: `targetUid` must equal `context.auth.uid` (self-service guard)
- Generates temp password; `admin.auth().updateUser`; sets `requiresPasswordChange: true` in Firestore; emails user; discards password
- Returns `{ success: true }` (temp password never returned)
- Commit: `feat: CF-3 adminResetPassword (admin + self-service)`

#### T5.21 — `ForcePasswordChange.jsx`
- `src/components/ForcePasswordChange.jsx`
- Full-screen overlay, undismissable; password + confirm fields (8-char min)
- On submit: `updatePassword(auth.currentUser, newPassword)`; Firestore `requiresPasswordChange: FieldValue.delete()`; overlay dismisses
- Commit: `feat: ForcePasswordChange overlay`

#### T5.22 — Wire `ForcePasswordChange` into `ProtectedRoute`
- `src/components/ProtectedRoute.jsx` — render `<ForcePasswordChange />` when `progress.requiresPasswordChange === true`
- Commit: `feat: intercept requiresPasswordChange flag in ProtectedRoute`

#### T5.23 — Admin SettingsTab — Reset Password panel
- `src/admin/SettingsTab.jsx` (create file)
- User search input → lists matching users → select → "Reset Password" button → CF-3 → success/error feedback
- Commit: `feat: SettingsTab — admin Reset Password panel`

---

### Username Update (admin-initiated + user self-service)

#### T5.24 — CF-4: `adminUpdateUsername` (callable, admin only)
- `functions/src/adminUpdateUsername.js`
- Input: `{ targetUid, newUsername }` (1–40 chars)
- `assertAdmin(context)`; `admin.auth().updateUser` displayName; Firestore `username` field; email notification
- Returns `{ success: true }`
- Commit: `feat: CF-4 adminUpdateUsername`

#### T5.25 — CF-7: `initiateUsernameChange` (callable, self only)
- `functions/src/initiateUsernameChange.js`
- Input: none (uses `context.auth.uid`)
- Generates token; stores `pendingUsernameChange: { token, requestedAt }` in `users/{uid}`
- Emails user's current email with link to `/verify-username-change?token={token}&uid={uid}` (24h expiry)
- Returns `{ success: true }`
- Commit: `feat: CF-7 initiateUsernameChange — send verification email`

#### T5.26 — CF-8: `verifyUsernameChange` (callable, open — token authenticates)
- `functions/src/verifyUsernameChange.js`
- Input: `{ uid, token, newUsername }` (newUsername 1–40 chars)
- `timingSafeEqual` token check; 24h expiry check; `admin.auth().updateUser` displayName; Firestore `username`; clear `pendingUsernameChange`
- Returns `{ success: true }`
- Commit: `feat: CF-8 verifyUsernameChange — apply new username after token check`

#### T5.27 — `VerifyUsernameChangePage.jsx`
- `src/pages/VerifyUsernameChangePage.jsx`
- Reads `?token=&uid=` from URL; shows new-username input; calls CF-8; shows success/error
- Commit: `feat: VerifyUsernameChangePage`

#### T5.28 — Admin SettingsTab — Update Username panel
- `src/admin/SettingsTab.jsx` — add second panel: user search → new username input → CF-4 → feedback
- Commit: `feat: SettingsTab — admin Update Username panel`

---

### Email Change (admin-initiated + user self-service)

#### T5.29 — CF-5: `initiateEmailChange` (callable, admin or self)
- `functions/src/initiateEmailChange.js`
- Input: `{ targetUid, newEmail }`
- If caller is not admin: `targetUid` must equal `context.auth.uid`
- Rejects if `newEmail === currentEmail` or `pendingEmailChange` already set
- Generates 64-char hex token; stores `pendingEmailChange: { newEmail, token, requestedAt }` in Firestore
- Emails user's **current** email with link to `/verify-email-change?token={token}&uid={targetUid}` (24h expiry)
- Returns `{ success: true }`
- Commit: `feat: CF-5 initiateEmailChange (admin + self-service)`

#### T5.30 — CF-6: `verifyEmailChange` (callable, open — token authenticates)
- `functions/src/verifyEmailChange.js`
- Input: `{ uid, token }`
- `timingSafeEqual` token check; 24h expiry; `admin.auth().updateUser(uid, { email: newEmail })`
- Clears `pendingEmailChange`; sends confirmation to new email
- Returns `{ success: true, newEmail }`
- Commit: `feat: CF-6 verifyEmailChange — apply new email after token check`

#### T5.31 — `VerifyEmailChangePage.jsx`
- `src/pages/VerifyEmailChangePage.jsx`
- Reads `?token=&uid=` from URL; calls CF-6 on mount; shows success ("Your login email has been updated") or error (expired / invalid)
- Commit: `feat: VerifyEmailChangePage`

#### T5.32 — Admin SettingsTab — Update Login Email panel
- `src/admin/SettingsTab.jsx` — add third panel: user search → new email input → CF-5 → feedback
- Commit: `feat: SettingsTab — admin Update Login Email panel`

---

### User Self-Service Settings Page (Feature 14)

#### T5.33 — `UserSettings.jsx` page
- `src/pages/UserSettings.jsx`
- Three panels stacked vertically:
  1. **Reset Password** — confirm dialog → calls CF-3 (self) → `signOut()` → shows "Check your email for a temporary password"
  2. **Change Username** — "Send verification email" button → calls CF-7 → shows "Check your email to continue"
  3. **Change Email** — new email input → calls CF-5 (self) → shows "Check your current email to confirm"
- Blocks panel 3 if `pendingEmailChange` already set (shows "A change is already pending")
- Commit: `feat: UserSettings page with 3 self-service panels`

#### T5.34 — Add `/settings` route + gear icon to LevelMap
- `src/App.jsx` → `<Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />`
- `src/pages/LevelMap.jsx` → gear icon button in header (top-right); navigates to `/settings`
- Commit: `feat: add /settings route and gear icon in LevelMap header`

#### T5.35 — Add verification routes to `App.jsx`
- `/verify-email-change` → `<VerifyEmailChangePage />` (public — no ProtectedRoute)
- `/verify-username-change` → `<VerifyUsernameChangePage />` (public)
- Commit: `feat: add /verify-email-change and /verify-username-change routes`

---

### Deployment & Manual Configuration

#### T5.36 — Update `deploy.yml` for Cloud Functions
- `.github/workflows/deploy.yml` — replace `FirebaseExtended/action-hosting-deploy` step with:
  1. `npm ci` in `functions/` directory
  2. Write service account JSON to `/tmp/sa.json`
  3. `GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json firebase deploy --only hosting,functions --project $PROJECT_ID`
- Commit: `ci: add Cloud Functions deploy step to GitHub Actions`

#### T5.37 — Set SMTP secrets **[MANUAL]**
- Run: `firebase functions:secrets:set SMTP_HOST`, then `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Enter Brevo SMTP values at each prompt
- No code commit; note in progress.md

#### T5.38 — Set admin UID environment config **[MANUAL]**
- Run: `firebase functions:config:set admin.uid=<uid_of_app_admin_account>`
- Note: `process.env.ADMIN_UID` is read inside functions via `functions.config().admin.uid`
- No code commit; note in progress.md

#### T5.39 — Set admin custom claim **[MANUAL, one-time]**
- Create `scripts/setAdminClaim.js`:
  ```js
  const admin = require('firebase-admin')
  admin.initializeApp()
  admin.auth().setCustomUserClaims('<admin_uid>', { admin: true })
    .then(() => { console.log('Done'); process.exit(0) })
  ```
- Run: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json node scripts/setAdminClaim.js`
- Verify: `getIdTokenResult(true)` in browser shows `claims.admin === true`
- Commit script (without credentials): `chore: add setAdminClaim script`

---

### Finalisation

#### T5.40 — Update PLAN.md and progress.md
- `docs/PLAN.md` → mark Iteration 5 as "In Progress"; update Immediate Next Actions
- `progress.md` → current task, completed actions, next step
- Commit: `docs: update PLAN and progress for Iteration 5`

#### T5.41 — End-to-end QA
- Run every row of the Verification Plan table in PLAN.md (34 test cases)
- Fix any blockers; push to `main`; confirm deploy succeeds
- Commit any fixes with accompanying doc updates

**T5 done when:** all 34 verification plan test cases pass on live URL; admin dashboard fully functional; contact form works pre- and post-login; user self-service settings work; ForcePasswordChange overlay works.
