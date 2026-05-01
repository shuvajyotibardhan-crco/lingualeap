# DESIGN — LinguaLeap

> App name: **LinguaLeap** (formerly "Amigos de Aventura" — renamed to be language-agnostic as French, Italian, etc. will be added alongside Spanish)

## High-Level Overview

LinguaLeap is a progressive web app with a thin serverless backend. All gameplay logic runs in the browser: persistence goes directly to Firebase Firestore via the client SDK, and speech (TTS + ASR) uses the browser's built-in Web Speech API. Firebase Auth handles identity; Firebase Hosting serves the static build. For admin and account-management operations that require elevated trust — cross-user data access, password resets, and transactional email — a small set of Firebase Cloud Functions runs server-side via the Firebase Admin SDK. All other operations remain client-side, keeping cost near zero and the architecture simple.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Browser (Client)                             │
│                                                                         │
│  ┌─────────────┐   ┌──────────────────────────────────────────────┐    │
│  │  React App  │   │              Web Speech API                   │    │
│  │  (Vite PWA) │   │  SpeechSynthesis (TTS) │ SpeechRecognition   │    │
│  └──────┬──────┘   └──────────────────────────────────────────────┘    │
│         │                                                               │
│  ┌──────▼───────────────────────────────────────────────────────────┐  │
│  │                      React Component Tree                         │  │
│  │                                                                   │  │
│  │  AuthContext ──► LoginPage / RegisterPage / UserSettings          │  │
│  │  ProgressContext ──► LevelMap ──► LevelPage                       │  │
│  │                   │       │                                       │  │
│  │              ContactBtn  ⚙ Settings                               │  │
│  │                          │                                        │  │
│  │              ┌───────────┼───────────────┐                        │  │
│  │           Discovery  Shadow          Roleplay  QuickFire           │  │
│  │           Mode       Challenge       Mode      Mode                │  │
│  │                                                                   │  │
│  │  AdminRoute ──► AdminDashboard (Users | Messages | Settings tab)  │  │
│  │                                                                   │  │
│  │  VerifyEmailChangePage / VerifyUsernameChangePage (public)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                              │                                │
│  ┌──────▼──────┐             ┌─────────▼──────┐                        │
│  │ /data/es/   │             │  firebase.js   │                        │
│  │ level_N.json│             │  (client SDK)  │                        │
│  │ noun_bank   │             └─────────┬──────┘                        │
│  └─────────────┘                       │                               │
│                        ┌───────────────┼───────────────┐               │
│                        ▼               ▼               ▼               │
│                  Firebase Auth   Firestore      Cloud Functions         │
│                  (email/Google)  (user docs,   (Admin SDK calls,        │
│                                  contact msgs) email dispatch)          │
│                                                        │               │
│  Service Worker (Vite PWA) ── caches assets offline    │               │
└────────────────────────────────────────────────────────┼───────────────┘
                                                         │ SMTP
                                                    Brevo / SMTP
                                                  (transactional email)

                              ▲  deploy
                              │
                  GitHub Actions (deploy.yml)
                  triggered on push to main
                              │
                  ┌───────────┴────────────┐
            Firebase Hosting          Cloud Functions
                 (CDN)               (Node 20, us-central1)
```

---

## Module Design

### `src/lib/firebase.js`
Initialises the Firebase app with environment variables and exports `auth` (Firebase Auth instance) and `db` (Firestore instance). Single source of Firebase config — imported by all hooks that need Auth or Firestore.

### `src/lib/tts.js`
Wraps `window.speechSynthesis`. Exports `speak(text, lang)` — cancels any current utterance, selects the best matching voice for the given language code (`es-ES`, `es-MX` preference order), then calls `speechSynthesis.speak()`. Falls back to the default voice if no Spanish voice is available.

### `src/lib/asr.js`
Wraps `window.SpeechRecognition` (or `webkitSpeechRecognition`). Exports `startListening(lang, onResult, onError)` and `stopListening()`. Returns `null` and calls `onError('unsupported')` on browsers without the API — callers must render the tap-to-select fallback in that case.

### `src/lib/fuzzy.js`
Exports `similarity(a, b): number` — computes normalised Levenshtein similarity between two strings (both lowercased, diacritics stripped). Returns a value from 0.0 to 1.0. Used by Shadow Challenge to determine pass (≥0.6) or retry (<0.6).

### `src/context/AuthContext.jsx`
Provides `{ user, loading }` via React Context. Wraps `onAuthStateChanged` so the whole app reacts to login/logout. All protected routes check `user` from this context. `user.emailVerified` is used by ProtectedRoute to show a dismissable verification banner for unverified email/password accounts (access is not blocked — banner can be dismissed).

### `src/context/ProgressContext.jsx`
Provides `{ progress, loading, awardXP, completeLevel, isLevelUnlocked, calculateStars }` via React Context. Reads the user's Firestore document (`users/{uid}`) on mount and writes back on every XP/star/badge change via a single atomic `setDoc` merge. Uses Firestore's offline persistence to queue writes when offline.

### `src/hooks/useLevelData.js`
Fetches `/data/es/level_N.json` on mount (or when `level` changes). Returns `{ phrases, loading, error }`. Includes a cancellation guard so stale responses from a previous level are ignored.

### `src/hooks/useNounBank.js`
Fetches `/data/es/noun_bank.json` once on mount. Returns `{ entries, loading }`. Entries are 1,373 swappable words from the Traveller's Noun Bank across 12 categories (people, places, food, animals, body, clothing, nature, transport, home, school, colours, time).

### `src/hooks/useTTS.js`
Thin React hook wrapping `lib/tts.js`. Returns `{ speak, isSpeaking }`.

### `src/hooks/useASR.js`
Thin React hook wrapping `lib/asr.js`. Returns `{ startListening, stopListening, transcript, isListening, isSupported }`.

### `src/hooks/useProgress.js`
Re-exports context values from ProgressContext for ergonomic consumption in components.

### `public/data/es/level_N.json — served at /data/es/level_N.json`
One JSON file per level. Each file is an array of phrase objects:
```json
[
  {
    "id": "es-1-1",
    "spanish": "¡Hola!",
    "english": "Hello",
    "audioHint": "OH-lah",
    "category": "greeting"
  }
]
```
Adding a new language = adding `/public/data/{lang}/` with equivalent files. No engine changes needed.

### `src/pages/LevelMap.jsx`
Renders the 12-level grid. Reads unlock state from ProgressContext. Locked levels show a padlock icon and are not clickable. XP total shown in the header at all times.

### `src/pages/LevelPage.jsx`
Entry point for a level. Waits for ProgressContext to finish loading before checking `isLevelUnlocked` (guards against redirect race on direct URL navigation). Fetches the level's phrase JSON and noun bank data, then renders a mode-selector UI with a 📚 Word Bank button. Passes `nounBankEntries` to all mode components.

### `src/modes/Discovery.jsx`
Displays an illustrated scene. Each tappable object calls `speak(spanishWord)`. No scoring — purely exploratory.

### `src/modes/ShadowChallenge.jsx`
1. Plays TTS of the target phrase.
2. Shows mic button → calls `startListening`.
3. On transcript received: runs `similarity(transcript, spanish)`.
4. ≥0.60 → pass animation + XP award. <0.60 → "Try again!" (no XP penalty).
5. Falls back to tap-to-select when ASR unavailable.

### `src/modes/Roleplay.jsx`
Shows a "How to play" banner explaining the listen-then-respond mechanic. Presents an English situation prompt ("Someone says to you: …"). User responds by speaking (ASR) or tapping the correct Spanish phrase. Completes with a reward animation. XP awarded per phrase.

### `src/modes/QuickFire.jsx`
Audio-only challenge — Spanish word is NOT shown in the prompt, preventing trivial text-matching. Auto-plays phrase TTS on each round. Shows 4 Spanish word cards with a countdown timer. Correct tap → XP + next phrase. Wrong tap or timeout → "Try again!" + replay audio.

### `src/components/PhraseCard.jsx`
Reusable card showing Spanish text, English translation, and a TTS play button. Used across all modes.

### `src/components/RewardAnimation.jsx`
Plays a CSS/Lottie animation on level completion or badge award. Auto-dismisses after 2 seconds.

### `src/components/NounBank.jsx`
Slide-up panel showing 1,373 Traveller's Noun Bank words. Features a search input (filters by Spanish word or English translation) and 12 scrollable category tabs (All, People, Places, Food, Animals, Body, Clothing, Nature, Transport, Home, School, Colours, Time). Accessible from the mode-selector header and from within every mode via a 📚 button. Tapping a word plays its TTS.

### `src/components/ContactButton.jsx`
Floating action button fixed to the bottom-right corner of all logged-in screens (`position: fixed`, `z-50`, 56px circle, brand-orange). Opens `ContactModal`. Imports `useAuth` to pass pre-fill values. Rendered in `LevelMap`, `LevelPage`, and all four mode components.

### `src/components/ContactModal.jsx`
Slide-up form panel (same bottom-sheet pattern as NounBank). Props: `isOpen`, `onClose`, `prefillUsername?`, `prefillEmail?`. When pre-fill values are present the username and email fields are shown read-only; otherwise both are editable and required. Message textarea enforces a 2,000-character limit with a live counter. On submit calls `useCallable('submitContactMessage')`. Renders a success state after submission instead of closing immediately.

### `src/components/AdminRoute.jsx`
Route guard for `/admin`. On mount calls `user.getIdTokenResult(true)` (force-refresh) to read Firebase custom claims. If `claims.admin !== true`, redirects to `/`. Shows a loading spinner while the token is being fetched. Wraps `AdminDashboard` in the route tree.

### `src/components/ForcePasswordChange.jsx`
Full-screen fixed overlay (z-60, white background) that appears when `progress.requiresPasswordChange === true`. Cannot be dismissed — there is no close button. Contains a password + confirm-password form. On submit calls `updatePassword(auth.currentUser, newPassword)` from `firebase/auth`, then writes `{ requiresPasswordChange: false }` to `users/{uid}` (client write, permitted by existing rules). On success the overlay unmounts; the user remains signed in.

### `src/pages/AdminDashboard.jsx`
Main admin page at `/admin`. Sticky orange header with "Admin Dashboard" label and a link back to the Level Map. Three tab buttons (Users | Messages | Settings) switch between `UsersTab`, `MessagesTab`, and `SettingsTab` sub-components. Passes the `useCallable` hook instances down as props to avoid re-creating callable references in child tabs.

### `src/pages/UserSettings.jsx`
Settings page at `/settings`, protected by `ProtectedRoute`. Accessible via a gear icon in the LevelMap header. Displays three action sections: Reset Password, Change Username, Change Email. Each section has a button that triggers the appropriate Cloud Function via `useCallable`. Reset Password shows a confirmation dialog before proceeding and signs the user out on success. Change Username shows a "send verification email" button with a success banner after dispatch. Change Email shows an email input field; dispatching the change while a `pendingEmailChange` exists in Firestore shows an inline "a change is already pending" error.

### `src/pages/VerifyEmailChangePage.jsx`
Public page at `/verify-email-change`. Reads `token` and `uid` query parameters via `useSearchParams`. On mount calls `verifyEmailChange` Cloud Function. Shows a loading spinner, then either a success message (displaying the new email address) or an error message (expired / invalid token). Includes a "Go to Sign In" button.

### `src/pages/VerifyUsernameChangePage.jsx`
Public page at `/verify-username-change`. Reads `token` and `uid` query params. On mount calls `verifyUsernameChangeToken` Cloud Function to validate the token (without yet committing a name). On success renders a text input for the new username (1–40 characters) and a submit button that calls `applyUsernameChange`. On error shows the same expired/invalid states as `VerifyEmailChangePage`.

### `src/admin/UsersTab.jsx`
Queries `users` collection via `getDocs` on mount (Admin SDK via Cloud Functions is not used here — the admin user's elevated Firestore access comes from their client-side auth token being used against updated Firestore rules). Renders a search input that filters client-side by username. Each user row shows username, email, XP, and completed-level count. Expanding a row reveals a per-level star grid and badge list.

### `src/admin/MessagesTab.jsx`
Queries `contactMessages` collection ordered by `createdAt` descending. Groups documents into "Open" and "Resolved" sections. Each message card is expandable to show full text and the reply thread. An inline reply form (textarea + Send button) calls the `adminReplyToContact` Cloud Function via `useCallable`. Shows a loading indicator per card during send.

### `src/admin/SettingsTab.jsx`
Contains a user-search input (queries `users` by username prefix). On selecting a user, three action panels are revealed side by side (or stacked on mobile): Reset Password, Update Username, Update Login Email. Each panel calls its corresponding Cloud Function. Reset Password requires an "Are you sure?" confirmation step. All panels show loading, success, and error states independently.

### `src/hooks/useCallable.js`
Thin wrapper around Firebase `httpsCallable`. Returns `{ call, loading, error, data }`. `call(payload)` invokes the named Cloud Function, sets `loading: true` during execution, and populates `data` or `error` on completion. Allows components to avoid boilerplate try/catch and loading state management for every Cloud Function call.

### `functions/src/email.js`
Nodemailer transporter factory. Reads SMTP credentials from `process.env.SMTP_HOST/PORT/USER/PASS` — injected via `functions/.env` written by GitHub Actions at deploy time. Exports `sendEmail(to, subject, textBody)` — an async function that sends via the configured transporter. All emails are plain-text only to maximise deliverability and prevent credential hiding in HTML.

### `functions/src/adminHelpers.js`
Shared utilities for Cloud Functions. Exports:
- `assertAdmin(context)` — checks `context.auth?.uid === process.env.ADMIN_UID`; throws `HttpsError('permission-denied')` if not
- `generateTempPassword()` — `crypto.randomBytes(9).toString('base64url').slice(0, 12)` (~71 bits entropy)
- `generateToken()` — `crypto.randomBytes(32).toString('hex')` (64 hex chars, 256 bits)

### `functions/index.js` — Cloud Functions (9 total)

| Function | Type | Caller | Purpose |
|---|---|---|---|
| `submitContactMessage` | callable | any | Validates + writes contact message to Firestore via Admin SDK (handles auth'd and pre-login users) |
| `onContactCreated` | Firestore trigger | automatic | Emails admin at `app_admin@divel.me` on new contact message |
| `adminReplyToContact` | callable | admin only | Appends reply to Firestore, emails reply to user, marks message resolved |
| `resetPassword` | callable | self or admin | Generates random temp password, updates Auth, sets `requiresPasswordChange`, emails user. Admin can target any UID; non-admin can only target own UID |
| `adminUpdateUsername` | callable | admin only | Directly updates Auth displayName + Firestore `username`; emails notification to user |
| `initiateEmailChange` | callable | self or admin | Stores `pendingEmailChange` token in Firestore, emails verification link to current email. Admin can target any UID; non-admin only own UID |
| `verifyEmailChange` | callable | token-auth | Validates token, updates email in Auth, clears pending state, emails new address |
| `initiateUsernameChange` | callable | self only | Stores `pendingUsernameChange` token in Firestore, emails verification link to user |
| `verifyUsernameChange` | callable | token-auth | Validates token, accepts new username in payload, updates Auth displayName + Firestore |

### `.github/workflows/deploy.yml`
GitHub Actions workflow: triggers on push to `main`, installs deps (including `functions/` Node deps), builds the React app with env vars from GitHub Secrets, then deploys both Firebase Hosting and Cloud Functions via the Firebase CLI authenticated with the service account secret. Firestore security rules are managed directly in the Firebase Console (the service account lacks the Service Usage permissions required for `firebase-tools` rules deployment).

---

## Design Considerations

**Why React + Vite over Next.js?**
This is a pure client-side app — no SSR, no API routes, no server. Vite's HMR makes game UI iteration fast, and the Vite PWA plugin generates the service worker with zero config. Next.js would add complexity for no benefit.

**Why Firebase over Supabase or PlanetScale?**
Firebase Auth has built-in Google OAuth, email/password, and custom SMTP support in one SDK. Firestore's offline persistence handles the "works on a plane" requirement without extra code. Both fit the zero-cost constraint (Spark plan free tier). The global CLAUDE.md CI/CD pattern is already built around Firebase Hosting + GitHub Actions.

**Why Cloud Functions for admin operations?**
Three admin capabilities are impossible to implement securely from the browser: (1) generating and setting a random password for another user (requires Firebase Admin SDK, which only runs server-side); (2) reading all users' Firestore documents without opening the security rules to all authenticated users; (3) sending transactional email from a trusted server address. Cloud Functions provide a minimal server surface for exactly these cases while leaving all gameplay logic client-side. The Firebase Blaze plan's free tier (2M function invocations/month) means the cost remains effectively zero for admin-level traffic.

**Why Nodemailer + Brevo SMTP over Firebase Extensions?**
The Firebase "Trigger Email" extension writes email jobs to a Firestore collection, adding latency and coupling email delivery to Firestore write quotas. Nodemailer inside the Cloud Function sends email directly from the function's execution context, is easier to debug (standard SMTP logs), and gives full control over message format. Brevo's free tier (300 emails/day) is generous for admin notifications and user account emails.

**Why browser-native TTS/ASR?**
Cost is zero, audio never leaves the device (privacy), and no API key management. The trade-off is browser support variance — mitigated by the ASR tap-to-select fallback and TTS voice fallback.

**Why fuzzy matching at ≥60%?**
Children learning a language will mispronounce words. A strict exact-match would be frustrating. 60% is low enough to reward genuine attempts while filtering out silence or completely wrong words. The threshold is a constant in `fuzzy.js` — easy to adjust after user testing.

**Why JSON data files over Firestore for phrase content?**
Phrase data is static and read-only. JSON files are bundled into the service worker cache at build time, making them available offline with zero Firestore reads. Firestore is reserved for per-user mutable state only.

**Why language data in `/public/data/{lang}/`?**
Keeps the engine entirely language-agnostic. To add French, a developer creates `/public/data/fr/level_1.json` through `level_12.json` and passes `lang="fr"` to the TTS and ASR hooks. No component or hook changes needed.

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | React 19 + Vite | Fast DX, component model, HMR |
| Styling | Tailwind CSS | Utility-first, rapid kid-UI iteration |
| Routing | React Router v6 | SPA routing, protected route support |
| Auth | Firebase Auth | Google OAuth + email/password, free |
| Database | Firebase Firestore | Offline persistence, free tier, per-user docs |
| TTS | Web Speech API (`SpeechSynthesis`) | Browser-native, zero cost, no network |
| ASR | Web Speech API (`SpeechRecognition`) | Browser-native, private, zero cost |
| Fuzzy match | Custom Levenshtein (`fuzzy.js`) | No dependency, tiny, tuneable threshold |
| PWA / offline | Vite PWA plugin (Workbox) | Auto-generates service worker |
| Serverless backend | Firebase Cloud Functions (Node 20) | Admin SDK ops, transactional email — Blaze plan |
| Email delivery | Nodemailer + Brevo SMTP | 300 emails/day free, reliable deliverability |
| Icons | Lucide React | MIT, free, tree-shakeable |
| Illustrations | unDraw | CC0, free SVG scenes |
| CI/CD | GitHub Actions | Matches global CLAUDE.md deploy pattern |
| Hosting | Firebase Hosting | CDN, free tier, same Firebase project |

---

## Deployment

1. Developer pushes to `main` on GitHub.
2. `.github/workflows/deploy.yml` triggers.
3. Workflow installs React app deps (`npm ci`) and Cloud Functions deps (`cd functions && npm ci`).
4. React app is built with env vars from GitHub Actions Secrets (`VITE_FIREBASE_*`).
5. Firebase CLI (installed in workflow) deploys Hosting (`dist/`) and Cloud Functions together via `firebase deploy --only hosting,functions`, authenticated with the `FIREBASE_SERVICE_ACCOUNT` secret.
6. SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), `FROM_EMAIL`, and `ADMIN_UID` are stored as GitHub Actions Secrets and written to `functions/.env` at deploy time — never in source code.
7. Firestore security rules are managed manually via Firebase Console (service account lacks `serviceusage.googleapis.com` permission — per CLAUDE.md constraint).
8. Live URL: `https://lingualeap-divel.web.app`

No manual `firebase deploy` step is ever needed or used — Firebase CLI login is unreliable on this machine.

---

## Constraints & Known Limitations

| Constraint | Detail |
|---|---|
| ASR browser support | Chrome/Edge: full. Safari: partial (requires user gesture per session). Firefox: not supported → tap-to-select fallback shown. |
| TTS voice quality | Depends on OS-installed voices. Mobile devices typically have one Spanish voice; desktop varies. No control over voice quality. |
| Offline auth | Firebase Auth `onAuthStateChanged` works offline for already-signed-in users. New sign-in requires network. |
| Firestore offline | Queued writes flush on reconnect, but there is no UI indicator for "pending sync" in v1. |
| Cloud Function cold start | First invocation after idle may take 1–2 seconds. Acceptable for admin operations; gameplay is unaffected (no Cloud Functions in the game path). |
| Admin claim propagation | Firebase custom claims take up to 1 hour to propagate to an already-active session. `AdminRoute` forces a token refresh (`getIdTokenResult(true)`) to mitigate this for the first `/admin` navigation. |
| SMTP daily limit | Brevo free tier: 300 emails/day. Sufficient for admin + account-management traffic at this scale. Upgrade to paid tier if volume grows. |
| Illustration coverage | unDraw SVGs cover generic scenes well; level-specific themed scenes may require custom SVG work. |
| 60% ASR threshold | Chosen conservatively for encouragement; may need tuning after real-child user testing. |
