# DESIGN — LinguaLeap

> App name: **LinguaLeap** (formerly "Amigos de Aventura" — renamed to be language-agnostic as French, Italian, etc. will be added alongside Spanish)

## High-Level Overview

LinguaLeap is a client-side-only progressive web app. There is no backend server or Cloud Functions — all game logic runs in the browser, all persistence goes directly to Firebase Firestore via the client SDK, and all speech (TTS + ASR) uses the browser's built-in Web Speech API. Firebase Auth handles identity; Firebase Hosting serves the static build. This keeps the running cost at zero and the architecture simple: React renders the UI, custom hooks manage state and side-effects, and JSON files under `public/data/es/` supply all phrase content.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                            │
│                                                                      │
│  ┌─────────────┐   ┌─────────────────────────────────────────────┐  │
│  │  React App  │   │              Web Speech API                  │  │
│  │  (Vite PWA) │   │  SpeechSynthesis (TTS) │ SpeechRecognition  │  │
│  └──────┬──────┘   └─────────────────────────────────────────────┘  │
│         │                                                            │
│  ┌──────▼──────────────────────────────────────────────────────┐    │
│  │                     React Component Tree                     │    │
│  │                                                              │    │
│  │  AuthContext ──► LoginPage / RegisterPage                    │    │
│  │  ProgressContext ──► LevelMap ──► LevelPage                  │    │
│  │                          │                                   │    │
│  │              ┌───────────┼───────────────┐                   │    │
│  │           Discovery  Shadow          Roleplay  QuickFire      │    │
│  │           Mode       Challenge       Mode      Mode           │    │
│  │              └───────────┴───────────────┘                   │    │
│  │                          │                                   │    │
│  │              PhraseCard ─┤ TTS button (useTTS)               │    │
│  │                          └ Mic button  (useASR)              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│         │                         │                                  │
│  ┌──────▼──────┐         ┌────────▼───────┐                         │
│  │ /data/es/      │         │  firebase.js   │                         │
│  │ es/         │         │  (client SDK)  │                         │
│  │ level_1.json│         └────────┬───────┘                         │
│  │ level_2.json│                  │                                  │
│  │   ...       │     ┌────────────┴────────────┐                    │
│  └─────────────┘     │                         │                    │
│                       ▼                         ▼                    │
│               Firebase Auth            Firebase Firestore            │
│               (email/Google)           (user progress docs)          │
│                                                                      │
│  Service Worker (Vite PWA plugin) ─ caches all assets offline        │
└──────────────────────────────────────────────────────────────────────┘

                              ▲  deploy
                              │
                  GitHub Actions (deploy.yml)
                  triggered on push to main
                              │
                  Firebase Hosting (CDN)
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
Provides `{ user, loading }` via React Context. Wraps `onAuthStateChanged` so the whole app reacts to login/logout. All protected routes check `user` from this context.

### `src/context/ProgressContext.jsx`
Provides `{ progress, awardXP, saveStars, saveBadge, isLevelUnlocked }` via React Context. Reads the user's Firestore document (`users/{uid}`) on mount and writes back on every XP/star/badge change. Uses Firestore's offline persistence to queue writes when offline.

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
Entry point for a level. Loads the level's JSON file, then renders a mode-selector UI (Discovery / Shadow Challenge / Roleplay / Quick-Fire). Routes to the appropriate mode component.

### `src/modes/Discovery.jsx`
Displays an illustrated scene. Each tappable object calls `speak(spanishWord)`. No scoring — purely exploratory.

### `src/modes/ShadowChallenge.jsx`
1. Plays TTS of the target phrase.
2. Shows mic button → calls `startListening`.
3. On transcript received: runs `similarity(transcript, spanish)`.
4. ≥0.60 → pass animation + XP award. <0.60 → "Try again!" (no XP penalty).
5. Falls back to tap-to-select when ASR unavailable.

### `src/modes/Roleplay.jsx`
Presents a dialogue scenario with a goal. Accepts the user tapping (or speaking) the correct phrase to advance. Completes with a reward animation. XP awarded per step.

### `src/modes/QuickFire.jsx`
Auto-plays phrase TTS. Shows 4 image options with a countdown timer. Correct tap → XP + next phrase. Wrong tap or timeout → "Try again!" + replay audio.

### `src/components/PhraseCard.jsx`
Reusable card showing Spanish text, English translation, and a TTS play button. Used across all modes.

### `src/components/RewardAnimation.jsx`
Plays a CSS/Lottie animation on level completion or badge award. Auto-dismisses after 2 seconds.

### `src/components/NounBank.jsx`
Slide-up panel showing swappable words grouped by category (People, Places, Food, Items). Tapping a word plays its TTS.

### `.github/workflows/deploy.yml`
GitHub Actions workflow: triggers on push to `main`, installs deps, builds with env vars from GitHub Secrets, deploys to Firebase Hosting via `FirebaseExtended/action-hosting-deploy@v0`, and deploys Firestore rules via `firebase-tools`.

---

## Design Considerations

**Why React + Vite over Next.js?**
This is a pure client-side app — no SSR, no API routes, no server. Vite's HMR makes game UI iteration fast, and the Vite PWA plugin generates the service worker with zero config. Next.js would add complexity for no benefit.

**Why Firebase over Supabase or PlanetScale?**
Firebase Auth has built-in Google OAuth, email/password, and custom SMTP support in one SDK. Firestore's offline persistence handles the "works on a plane" requirement without extra code. Both fit the zero-cost constraint (Spark plan free tier). The global CLAUDE.md CI/CD pattern is already built around Firebase Hosting + GitHub Actions.

**Why client-side only (no Cloud Functions)?**
Every operation (auth, read progress, write XP) can be done safely from the client with Firestore security rules. Eliminating Cloud Functions removes billing risk, cold-start latency, and deployment complexity.

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
| Frontend framework | React 18 + Vite | Fast DX, component model, HMR |
| Styling | Tailwind CSS | Utility-first, rapid kid-UI iteration |
| Routing | React Router v6 | SPA routing, protected route support |
| Auth | Firebase Auth | Google OAuth + email/password, free |
| Database | Firebase Firestore | Offline persistence, free tier, per-user docs |
| TTS | Web Speech API (`SpeechSynthesis`) | Browser-native, zero cost, no network |
| ASR | Web Speech API (`SpeechRecognition`) | Browser-native, private, zero cost |
| Fuzzy match | Custom Levenshtein (`fuzzy.js`) | No dependency, tiny, tuneable threshold |
| PWA / offline | Vite PWA plugin (Workbox) | Auto-generates service worker |
| Icons | Lucide React | MIT, free, tree-shakeable |
| Illustrations | unDraw | CC0, free SVG scenes |
| CI/CD | GitHub Actions | Matches global CLAUDE.md deploy pattern |
| Hosting | Firebase Hosting | CDN, free tier, same Firebase project |

---

## Deployment

1. Developer pushes to `main` on GitHub.
2. `.github/workflows/deploy.yml` triggers.
3. Workflow installs deps, builds with env vars from GitHub Actions Secrets (`VITE_FIREBASE_*`).
4. Build output (`dist/`) deployed to Firebase Hosting via `FirebaseExtended/action-hosting-deploy@v0`.
5. Firestore security rules deployed via `firebase-tools` using the service account JSON secret.
6. Live URL: Firebase Hosting default domain (or custom domain if configured later).

No manual `firebase deploy` step is ever needed or used — Firebase CLI login is unreliable on this machine.

---

## Constraints & Known Limitations

| Constraint | Detail |
|---|---|
| ASR browser support | Chrome/Edge: full. Safari: partial (requires user gesture per session). Firefox: not supported → tap-to-select fallback shown. |
| TTS voice quality | Depends on OS-installed voices. Mobile devices typically have one Spanish voice; desktop varies. No control over voice quality. |
| Offline auth | Firebase Auth `onAuthStateChanged` works offline for already-signed-in users. New sign-in requires network. |
| Firestore offline | Queued writes flush on reconnect, but there is no UI indicator for "pending sync" in v1. |
| Illustration coverage | unDraw SVGs cover generic scenes well; level-specific themed scenes may require custom SVG work. |
| No parent dashboard | Progress is visible only to the logged-in user. Parental oversight requires sharing a login. |
| 60% ASR threshold | Chosen conservatively for encouragement; may need tuning after real-child user testing. |
