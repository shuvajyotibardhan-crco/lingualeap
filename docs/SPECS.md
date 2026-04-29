# SPECS — LinguaLeap

Technical reference for implementers.

---

## Data Models

### Phrase
```ts
interface Phrase {
  id: string;         // "{lang}-{level}-{index}", e.g. "es-1-1"
  spanish: string;    // Target language text, e.g. "¡Hola!"
  english: string;    // English translation, e.g. "Hello"
  audioHint: string;  // Pronunciation guide, e.g. "OH-lah"
  category: string;   // Noun Bank category: "greeting" | "food" | "feeling" | "direction" | "family" | "play" | "colour" | "body" | "market" | "transport" | "time" | "safety"
}
```

### LevelData
```ts
interface LevelData {
  level: number;       // 1–12
  theme: string;       // e.g. "Greetings", "The Café"
  phase: 1 | 2 | 3;
  phrases: Phrase[];
}
```

### UserProgress (Firestore document)
```ts
interface UserProgress {
  uid: string;                        // Firebase Auth UID
  username: string;                   // Display name set at registration
  xp: number;                         // Cumulative XP total
  levelStars: Record<string, number>; // { "1": 3, "2": 2, ... } — 0 = not done
  badges: string[];                   // e.g. ["phase1", "phase2", "linguaLegend"]
  unlockedLevels: number[];           // Levels the user has access to, always includes 1
  lastUpdated: Timestamp;
}
```

### NounBankEntry
```ts
interface NounBankEntry {
  id: string;
  word: string;           // Spanish word
  english: string;
  category: "people" | "places" | "food" | "items";
  audioHint: string;
}
```

---

## Storage Schema

### Firestore

**Collection:** `users`
**Document ID:** Firebase Auth UID (`uid`)

```
users/
  {uid}/
    uid:             string
    username:        string
    xp:              number
    levelStars:      map<string, number>   // keys: "1" through "12"
    badges:          array<string>
    unlockedLevels:  array<number>
    lastUpdated:     timestamp
```

**Security rules (summary):**
- Read and write allowed only if `request.auth.uid == resource.data.uid`
- No other collection exists — all app state is in this single document per user

**Offline persistence:** enabled via `initializeFirestore(app, { localCache: persistentLocalCache() })` (Firebase 11 modern API) — all Firestore reads/writes survive network loss and sync on reconnect.

### LocalStorage / SessionStorage

Not used for persistent state — Firestore + Firebase Auth session cover all persistence needs.

### Service Worker Cache (Vite PWA / Workbox)

| Cache name | Contents |
|---|---|
| `lingualeap-assets` | JS bundles, CSS, fonts, icons, SVG illustrations |
| `lingualeap-phrase-data` | `/data/es/level_*.json` phrase files (served from `public/data/es/`) |
| `lingualeap-static` | `index.html`, `manifest.json`, favicon |

All caches populated on first load; app functions fully offline thereafter.

---

## API Endpoints

LinguaLeap has no custom backend. All external calls go to Firebase services via the client SDK.

| Service | Operation | SDK call | Notes |
|---|---|---|---|
| Firebase Auth | Register (email) | `createUserWithEmailAndPassword(auth, email, password)` | Sets `displayName` via `updateProfile` immediately after |
| Firebase Auth | Register (Google) | `signInWithPopup(auth, googleProvider)` | Uses `GoogleAuthProvider` |
| Firebase Auth | Sign in (email) | `signInWithEmailAndPassword(auth, email, password)` | |
| Firebase Auth | Sign out | `signOut(auth)` | |
| Firebase Auth | Password reset | `sendPasswordResetEmail(auth, email)` | Custom SMTP sends from `app_admin@divel.me` |
| Firebase Auth | Session state | `onAuthStateChanged(auth, callback)` | Fires on mount in AuthContext |
| Firestore | Read progress | `getDoc(doc(db, "users", uid))` | On auth state change |
| Firestore | Write progress | `setDoc(doc(db, "users", uid), data, { merge: true })` | After every XP/star/badge change |

No third-party REST APIs are called. TTS and ASR use browser-native Web Speech API — zero network calls.

---

## Algorithms

### Level Unlock Logic
```
function isLevelUnlocked(levelNumber, unlockedLevels):
  return levelNumber IN unlockedLevels

function unlockNextLevel(currentLevel, unlockedLevels):
  nextLevel = currentLevel + 1
  if nextLevel <= 12 AND nextLevel NOT IN unlockedLevels:
    unlockedLevels.push(nextLevel)
  return unlockedLevels
```

### Star Rating
```
function calculateStars(phrases, firstAttemptPasses):
  ratio = firstAttemptPasses / phrases.length
  if ratio == 1.0:  return 3
  if ratio >= 0.6:  return 2
  else:             return 1
```

### XP Award
```
PASS_XP   = 10   // phrase passed (any attempt)
FIRST_XP  = 5    // bonus for first-attempt pass

function awardXP(wasFirstAttempt):
  xp += PASS_XP
  if wasFirstAttempt:
    xp += FIRST_XP
  writeToFirestore(xp)
```

### Level Completion (stars + unlock + badges — single atomic Firestore write)
```
PHASE_BADGE_MAP = { 4: "phase1", 8: "phase2", 12: "phase3" }
LEGEND_BADGE    = "linguaLegend"

function completeLevel(level, firstAttemptPasses, totalPhrases):
  stars      = calculateStars(totalPhrases, firstAttemptPasses)
  levelStars = { ...progress.levelStars, [level]: stars }

  nextLevel      = level + 1
  unlockedLevels = nextLevel > 12 || nextLevel already unlocked
    ? existing list
    : [...existing, nextLevel]

  badges = [...existing badges]
  if PHASE_BADGE_MAP[level] exists AND not already in badges:
    badges.push(PHASE_BADGE_MAP[level])
  if all 12 levels in levelStars AND LEGEND_BADGE not in badges:
    badges.push(LEGEND_BADGE)

  writeToFirestore({ levelStars, unlockedLevels, badges })  // single setDoc merge
  return { stars, badges, isLinguaLegend }
```

### ASR Fuzzy Match (Levenshtein similarity)
```
function normalise(str):
  return str.toLowerCase()
            .replace(/[áàä]/g, 'a')
            .replace(/[éèë]/g, 'e')
            .replace(/[íìï]/g, 'i')
            .replace(/[óòö]/g, 'o')
            .replace(/[úùü]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9 ]/g, '')
            .trim()

function levenshtein(a, b):
  // standard DP implementation
  // returns edit distance integer

function similarity(transcript, target):
  a = normalise(transcript)
  b = normalise(target)
  maxLen = max(a.length, b.length)
  if maxLen == 0: return 1.0
  return 1 - (levenshtein(a, b) / maxLen)

PASS_THRESHOLD = 0.60

function scoreAttempt(transcript, targetPhrase):
  score = similarity(transcript, targetPhrase.spanish)
  return score >= PASS_THRESHOLD ? "pass" : "retry"
```

### TTS Voice Selection
```
function selectVoice(lang):   // lang e.g. "es"
  voices = speechSynthesis.getVoices()
  // prefer exact locale match
  match = voices.find(v => v.lang.startsWith(lang + "-"))
  if match: return match
  // fall back to partial match
  match = voices.find(v => v.lang.startsWith(lang))
  if match: return match
  // fall back to browser default
  return null   // null = browser picks default

function speak(text, lang):
  speechSynthesis.cancel()
  utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = selectVoice(lang)
  utterance.lang = lang + "-ES"   // hint even without explicit voice
  speechSynthesis.speak(utterance)
```

### Offline Write Queue (Firestore)
Firestore's built-in `persistentLocalCache` (configured at init via `initializeFirestore`) handles this automatically:
1. Write called while offline → stored in IndexedDB
2. Firestore SDK monitors network state
3. On reconnect → all pending writes flushed in order
4. No custom queue code needed in the app

---

## Configuration

### Environment Variables (`.env` / GitHub Secrets)

| Variable | Example value | Used in |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | `src/lib/firebase.js` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `lingualeap.firebaseapp.com` | `src/lib/firebase.js` |
| `VITE_FIREBASE_PROJECT_ID` | `lingualeap` | `src/lib/firebase.js` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `lingualeap.appspot.com` | `src/lib/firebase.js` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | `src/lib/firebase.js` |
| `VITE_FIREBASE_APP_ID` | `1:123...` | `src/lib/firebase.js` |

All variables must be prefixed `VITE_` to be exposed to the browser by Vite. A `.env.example` with placeholder values is committed to the repo; the real `.env` is never committed.

### GitHub Actions Secrets (required for CI/CD)

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON from Firebase Console → Project Settings → Service Accounts |

### ASR / TTS Constants (in `src/lib/`)

| Constant | Value | File |
|---|---|---|
| `PASS_THRESHOLD` | `0.60` | `fuzzy.js` |
| `PASS_XP` | `10` | `context/ProgressContext.jsx` |
| `FIRST_ATTEMPT_BONUS` | `5` | `context/ProgressContext.jsx` |
| `DEFAULT_LANG` | `"es"` | `lib/tts.js` |
| `TTS_LANG_HINT` | `"es-ES"` | `lib/tts.js` |

---

## File Inventory

```
Language Learning App/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions: build + Firebase deploy on push to main
├── public/
│   ├── favicon.ico
│   ├── manifest.json               # PWA manifest (name, icons, theme colour, display: standalone)
│   └── icons/                      # PWA icons (192x192, 512x512)
├── public/
│   ├── data/
│   │   └── es/                     # Spanish phrase data — served as static assets at /data/es/
│   │       ├── level_1.json        # 5 phrases — Greetings
│   │       ├── level_2.json        # 6 phrases — The Café
│   │       ├── level_3.json        # 6 phrases — Feelings
│   │       ├── level_4.json        # 6 phrases — Directions
│   │       ├── level_5.json        # 8 phrases — My Family
│   │       ├── level_6.json        # 9 phrases — Playtime
│   │       ├── level_7.json        # 10 phrases — Colors & Clothes
│   │       ├── level_8.json        # 10 phrases — Body & School
│   │       ├── level_9.json        # 10 phrases — Marketplace
│   │       ├── level_10.json       # 10 phrases — Transport
│   │       ├── level_11.json       # 10 phrases — Schedules
│   │       ├── level_12.json       # 10 phrases — Help & Safety
│   │       └── noun_bank.json      # 15 Traveller's Noun Bank words (people/places/food/items)
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx         # Provides { user, loading } via onAuthStateChanged
│   │   └── ProgressContext.jsx     # Provides { progress, loading, awardXP, completeLevel, isLevelUnlocked, calculateStars }
│   ├── hooks/
│   │   ├── useLevelData.js         # Fetches /data/es/level_N.json — returns { phrases, loading, error }
│   │   ├── useNounBank.js          # Fetches /data/es/noun_bank.json once — returns { entries, loading }
│   │   ├── useTTS.js               # Wraps lib/tts.js — returns { speak, isSpeaking }
│   │   ├── useASR.js               # Wraps lib/asr.js — returns { startListening, stopListening, transcript, isListening, isSupported }
│   │   └── useProgress.js          # Re-exports ProgressContext values
│   ├── lib/
│   │   ├── firebase.js             # Firebase app init; exports auth, db
│   │   ├── tts.js                  # speak(text, lang), selectVoice(lang)
│   │   ├── asr.js                  # startListening, stopListening; returns null if unsupported
│   │   ├── fuzzy.js                # similarity(a, b) — Levenshtein; PASS_THRESHOLD = 0.60
│   │   └── xp.js                   # PASS_XP, FIRST_ATTEMPT_BONUS_XP constants
│   ├── components/
│   │   ├── PhraseCard.jsx          # Spanish text + English + TTS button
│   │   ├── RewardAnimation.jsx     # Celebration overlay; auto-dismisses after 2s
│   │   ├── NounBank.jsx            # Slide-up swappable word panel, grouped by category
│   │   ├── ProtectedRoute.jsx      # Redirects to /login if no auth; shows dismissable verification banner for unverified email/password users
│   │   └── LevelCard.jsx           # Level tile on the map; locked/unlocked/completed states
│   ├── modes/
│   │   ├── Discovery.jsx           # Tap objects → TTS; no scoring
│   │   ├── ShadowChallenge.jsx     # TTS → mic → fuzzy score → pass/retry
│   │   ├── Roleplay.jsx            # Dialogue scenario; tap/speak correct phrase to advance
│   │   └── QuickFire.jsx           # Auto TTS (audio-only prompt, no Spanish shown) → pick matching card → countdown timer
│   ├── pages/
│   │   ├── LoginPage.jsx           # Email sign-in + Google OAuth button
│   │   ├── RegisterPage.jsx        # Username + email + password form
│   │   ├── LevelMap.jsx            # 12-level grid; XP total in header
│   │   └── LevelPage.jsx           # Mode selector + phrase loader for a given level
│   ├── App.jsx                     # React Router routes; wraps AuthContext + ProgressContext
│   └── main.jsx                    # Vite entry point; mounts <App />
├── docs/
│   ├── PLAN.md
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md                    # This file
│   └── TASKS.md                    # (pending)
├── CLAUDE.md                       # Project context for Claude Code sessions
├── progress.md                     # Session state tracker
├── .env                            # Local secrets — never committed
├── .env.example                    # Placeholder template — committed
├── .gitignore                      # node_modules/, dist/, .env, .DS_Store
├── firebase.json                   # Firebase Hosting config (public: dist)
├── firestore.rules                 # Firestore security rules
├── index.html                      # Vite HTML entry
├── package.json
├── tailwind.config.js
├── vite.config.js                  # Includes vite-plugin-pwa config
└── README.md
```

---

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox | Notes |
|---|---|---|---|---|---|
| `SpeechSynthesis` (TTS) | ✅ Full | ✅ Full | ✅ Full | ✅ Full | All major browsers; voice quality varies by OS |
| `SpeechRecognition` (ASR) | ✅ Full | ✅ Full | ⚠️ Partial | ❌ None | Firefox + unsupported browsers get tap-to-select fallback |
| Service Worker / PWA | ✅ | ✅ | ✅ iOS 16.4+ | ✅ | Older iOS Safari may not support "Add to Home Screen" install prompt |
| IndexedDB (Firestore offline) | ✅ | ✅ | ✅ | ✅ | Required for offline Firestore persistence |
| CSS Grid / Flexbox | ✅ | ✅ | ✅ | ✅ | No polyfill needed |
| Minimum target | Chrome 90+ | Edge 90+ | Safari 15+ | Firefox 90+ | Covers 97%+ of active browsers as of 2025 |

---

## Security Notes

| Area | Decision |
|---|---|
| Auth | Firebase Auth manages all tokens — no custom JWT handling |
| Firestore rules | Read/write scoped strictly to `request.auth.uid == resource.data.uid` — users cannot read or write each other's documents |
| API keys in frontend | Firebase client-side keys are intentionally public (they identify the project, not grant access); Firestore rules are the security boundary |
| `.env` file | Never committed; `.env.example` with placeholders committed instead |
| Service account JSON | Used only in GitHub Actions secrets for CI deploy; never in source code or `.env` |
| No Cloud Functions | No server-side code = no server-side attack surface |
| ASR audio | `SpeechRecognition` is browser-native; audio never sent to any external server |
| TTS audio | `SpeechSynthesis` is browser-native; no audio leaves the device |
| Password reset email | Sent via Firebase Auth with custom SMTP → `app_admin@divel.me`; reset link is one-time and time-limited by Firebase |
| Content Security Policy | To be configured in `firebase.json` headers to restrict script sources to self + Firebase domains |
