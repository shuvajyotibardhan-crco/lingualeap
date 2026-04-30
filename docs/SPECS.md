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
  email: string;                      // Login email — written at registration and on Google OAuth login
  xp: number;                         // Cumulative XP total
  levelStars: Record<string, number>; // { "1": 3, "2": 2, ... } — 0 = not done
  badges: string[];                   // e.g. ["phase1", "phase3", "linguaLegend"]
  unlockedLevels: number[];           // Levels the user has access to, always includes 1
  lastUpdated: Timestamp;
  // Account-management fields (optional — only present when relevant)
  requiresPasswordChange?: boolean;   // true after admin/self password reset; cleared on new password set
  pendingEmailChange?: {              // set by initiateEmailChange CF; cleared by verifyEmailChange CF
    newEmail: string;
    token: string;                    // 64-char hex, 256-bit entropy
    requestedAt: Timestamp;           // used to enforce 24h expiry in verifyEmailChange
  };
  pendingUsernameChange?: {           // set by initiateUsernameChange CF; cleared by verifyUsernameChange CF
    token: string;                    // 64-char hex, 256-bit entropy
    requestedAt: Timestamp;
  };
}
```

### ContactMessage (Firestore document)
```ts
interface ContactMessage {
  uid: string | null;    // Firebase Auth UID of sender; null for pre-login submissions
  username: string;      // sender-provided or pre-filled from auth
  email: string;         // sender email address (for admin replies)
  message: string;       // free text, max 2,000 chars
  status: 'open' | 'resolved';
  createdAt: Timestamp;  // serverTimestamp() on write
  updatedAt: Timestamp;  // serverTimestamp() on reply or status change
  replies: Array<{
    replyText: string;
    repliedAt: Timestamp;
    repliedByUid: string; // admin UID for audit trail
  }>;
}
```

### NounBankEntry
```ts
interface NounBankEntry {
  id: string;
  word: string;           // Spanish word
  english: string;
  category: "people" | "places" | "food" | "animals" | "body" | "clothing" | "nature" | "transport" | "home" | "school" | "colours" | "time";
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
    uid:                    string
    username:               string
    email:                  string           // NEW — written at registration & Google login
    xp:                     number
    levelStars:             map<string, number>   // keys: "1" through "12"
    badges:                 array<string>
    unlockedLevels:         array<number>
    lastUpdated:            timestamp
    requiresPasswordChange: boolean          // OPTIONAL — present only after password reset
    pendingEmailChange:     map             // OPTIONAL — { newEmail, token, requestedAt }
    pendingUsernameChange:  map             // OPTIONAL — { token, requestedAt }
```

**Security rules (summary):**
- Read and write allowed only if `request.auth.uid == resource.data.uid`
- Cloud Functions running under Admin SDK bypass all rules and can read/write any user document

**Collection:** `contactMessages`
**Document ID:** auto-generated

```
contactMessages/
  {messageId}/
    uid:        string | null   // sender Firebase UID; null for pre-login submissions
    username:   string
    email:      string
    message:    string          // max 2,000 chars
    status:     string          // "open" | "resolved"
    createdAt:  timestamp
    updatedAt:  timestamp
    replies:    array<map>      // [{ replyText, repliedAt, repliedByUid }]
```

**contactMessages security rules:**
- Authenticated users may `create` where `request.resource.data.uid == request.auth.uid`, `status == "open"`, and `message.size() <= 2000`
- Pre-login (unauthenticated) submissions written by CF-0 via Admin SDK (bypasses rules)
- All reads and updates performed by Cloud Functions via Admin SDK

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

## Cloud Function API

All callable functions are invoked client-side via `httpsCallable(getFunctions(app), 'functionName')`. Runtime: Node 20, region `us-central1`. Admin SDK bypasses Firestore security rules.

### CF-0: `submitContactMessage`
- **Type:** callable (open — no auth required)
- **Input:** `{ username: string, email: string, message: string }`
- **Validates:** all fields non-empty; `message.length <= 2000`; email format regex
- **Logic:** writes `ContactMessage` to `contactMessages` via Admin SDK with `uid: context.auth?.uid ?? null`
- **Returns:** `{ success: true }`

### CF-1: `onContactCreated`
- **Type:** Firestore trigger — `onDocumentCreated('contactMessages/{id}')`
- **Logic:** sends email to `app_admin@divel.me` with username, sender email, message, link to `/admin`
- **Returns:** void; errors logged only (no rethrow — avoids infinite retry)

### CF-2: `adminReplyToContact`
- **Type:** callable
- **Auth:** `assertAdmin(context)` — `context.auth.uid === ADMIN_UID`
- **Input:** `{ messageId: string, replyText: string }` (replyText max 2,000 chars)
- **Logic:** reads message from Firestore to get user email (never trusts client-sent email), appends reply to `replies` array, sets `status: 'resolved'`, `updatedAt: serverTimestamp()`, sends email to user
- **Returns:** `{ success: true }`

### CF-3: `resetPassword`
- **Type:** callable
- **Auth:** if `context.auth.uid !== ADMIN_UID`, then `targetUid` must equal `context.auth.uid` (self-service only)
- **Input:** `{ targetUid: string }`
- **Logic:**
  1. Fetch target user via `admin.auth().getUser(targetUid)` — validates UID exists, gets email
  2. `tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12)` (~71 bits)
  3. `admin.auth().updateUser(targetUid, { password: tempPassword })`
  4. Firestore: `users/{targetUid}` — set `requiresPasswordChange: true`
  5. Email user's Auth email with temp password (plain text)
  6. If self-service: client signs out after receiving `{ success: true }` response
  7. `tempPassword` discarded — **never returned to caller**
- **Returns:** `{ success: true }`

### CF-4: `adminUpdateUsername`
- **Type:** callable
- **Auth:** `assertAdmin(context)`
- **Input:** `{ targetUid: string, newUsername: string }` (1–40 chars after trim)
- **Logic:** `admin.auth().updateUser(targetUid, { displayName: newUsername })`, Firestore `username` update, email notification to user
- **Returns:** `{ success: true }`

### CF-5: `initiateEmailChange`
- **Type:** callable
- **Auth:** if `context.auth.uid !== ADMIN_UID`, then `targetUid` must equal `context.auth.uid`
- **Input:** `{ targetUid: string, newEmail: string }`
- **Validates:** `newEmail` format; `newEmail !== currentEmail`; if self-service: no existing `pendingEmailChange` on the document
- **Logic:**
  1. Fetch current user email from Auth
  2. `token = crypto.randomBytes(32).toString('hex')`
  3. Firestore `users/{targetUid}`: set `pendingEmailChange: { newEmail, token, requestedAt: serverTimestamp() }`
  4. Email current address with link: `https://lingualeap-divel.web.app/verify-email-change?token={token}&uid={targetUid}` (valid 24h)
- **Returns:** `{ success: true }`

### CF-6: `verifyEmailChange`
- **Type:** callable (open — token is the authenticator)
- **Input:** `{ uid: string, token: string }`
- **Logic:**
  1. Read `users/{uid}`, check `pendingEmailChange` exists
  2. `crypto.timingSafeEqual(Buffer.from(pendingEmailChange.token), Buffer.from(token))` — constant-time comparison
  3. Check `requestedAt` < 24h; if expired: delete `pendingEmailChange`, throw `deadline-exceeded`
  4. `admin.auth().updateUser(uid, { email: pendingEmailChange.newEmail })`
  5. Firestore: delete `pendingEmailChange`, update `email` field, set `lastUpdated: serverTimestamp()`
  6. Email new address with confirmation
- **Returns:** `{ success: true, newEmail: string }`

### CF-7: `initiateUsernameChange`
- **Type:** callable (self-service only)
- **Auth:** `context.auth` must exist; only own UID (`context.auth.uid`) is targeted
- **Input:** none beyond auth context
- **Logic:**
  1. `token = crypto.randomBytes(32).toString('hex')`
  2. Firestore `users/{uid}`: set `pendingUsernameChange: { token, requestedAt: serverTimestamp() }`
  3. Email user's registered email with link: `https://lingualeap-divel.web.app/verify-username-change?token={token}&uid={uid}` (valid 24h)
- **Returns:** `{ success: true }`

### CF-8: `verifyUsernameChange`
- **Type:** callable (open — token is the authenticator)
- **Input:** `{ uid: string, token: string, newUsername: string }` (1–40 chars)
- **Logic:**
  1. Read `users/{uid}`, check `pendingUsernameChange` exists
  2. Constant-time token comparison
  3. Check `requestedAt` < 24h; if expired: delete `pendingUsernameChange`, throw `deadline-exceeded`
  4. `admin.auth().updateUser(uid, { displayName: newUsername })`
  5. Firestore: set `username: newUsername`, delete `pendingUsernameChange`, set `lastUpdated: serverTimestamp()`
- **Returns:** `{ success: true }`

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
PHASE_BADGE_MAP = { 4: "phase1", 8: "phase3", 12: "phase4" }
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

### Firebase Function Secrets (set once via CLI — never in GitHub Secrets or source)

Set via `firebase functions:secrets:set SECRET_NAME`. Accessed in functions via `defineSecret('SECRET_NAME')`.

| Secret name | Value |
|---|---|
| `SMTP_HOST` | Brevo SMTP host (e.g. `smtp-relay.brevo.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_USER` | Brevo SMTP login (account email) |
| `SMTP_PASS` | Brevo SMTP API key / password |

### Firebase Function Environment Config (set once via CLI)

Set via `firebase functions:config:set admin.uid=<uid>`. Accessed in functions via `process.env.ADMIN_UID` (or `functions.config().admin.uid` for gen1).

| Config key | Value |
|---|---|
| `admin.uid` | Firebase Auth UID of the admin account (`app_admin@divel.me`) |

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
│       └── deploy.yml              # GitHub Actions: build React app + deploy Hosting + Functions
├── functions/                      # NEW — Firebase Cloud Functions (Node 20)
│   ├── package.json                # firebase-functions v6, firebase-admin v13, nodemailer
│   ├── index.js                    # Exports all 9 Cloud Functions
│   └── src/
│       ├── email.js                # Nodemailer transporter + sendEmail(to, subject, text) helper
│       ├── adminHelpers.js         # assertAdmin(ctx), generateTempPassword(), generateToken()
│       ├── submitContactMessage.js # CF-0: open callable — writes contactMessage via Admin SDK
│       ├── onContactCreated.js     # CF-1: Firestore trigger — emails admin on new message
│       ├── adminReplyToContact.js  # CF-2: admin callable — emails user + updates Firestore
│       ├── adminResetPassword.js   # CF-3: self/admin callable — random temp pass, email, set flag
│       ├── adminUpdateUsername.js  # CF-4: admin callable — direct username update + email notify
│       ├── initiateEmailChange.js  # CF-5: self/admin callable — token + verification email to current address
│       ├── verifyEmailChange.js    # CF-6: token-auth callable — validates, updates Auth email
│       ├── initiateUsernameChange.js # CF-7: self callable — token + verification email
│       └── verifyUsernameChange.js # CF-8: token-auth callable — validates, updates username
├── public/
│   ├── favicon.ico
│   ├── manifest.json               # PWA manifest
│   ├── icons/                      # PWA icons (192x192, 512x512)
│   └── data/
│       └── es/                     # Spanish phrase data — served as static assets at /data/es/
│           ├── level_1.json        # 5 phrases — Greetings
│           ├── level_2.json        # 6 phrases — The Café
│           ├── level_3.json        # 6 phrases — Feelings
│           ├── level_4.json        # 6 phrases — Directions
│           ├── level_5.json        # 8 phrases — My Family
│           ├── level_6.json        # 9 phrases — Playtime
│           ├── level_7.json        # 10 phrases — Colors & Clothes
│           ├── level_8.json        # 10 phrases — Body & School
│           ├── level_9.json        # 10 phrases — Marketplace
│           ├── level_10.json       # 10 phrases — Transport
│           ├── level_11.json       # 10 phrases — Schedules
│           ├── level_12.json       # 10 phrases — Help & Safety
│           └── noun_bank.json      # 1,373 Traveller's Noun Bank words across 12 categories
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx         # Provides { user, loading } via onAuthStateChanged
│   │   └── ProgressContext.jsx     # Provides { progress, loading, awardXP, completeLevel, isLevelUnlocked, calculateStars }
│   ├── hooks/
│   │   ├── useLevelData.js         # Fetches /data/es/level_N.json — returns { phrases, loading, error }
│   │   ├── useNounBank.js          # Fetches /data/es/noun_bank.json — returns { entries, loading }
│   │   ├── useTTS.js               # Wraps lib/tts.js — returns { speak, isSpeaking }
│   │   ├── useASR.js               # Wraps lib/asr.js — returns { startListening, stopListening, transcript, isListening, isSupported }
│   │   ├── useProgress.js          # Re-exports ProgressContext values
│   │   └── useCallable.js          # NEW — httpsCallable wrapper: { call, loading, error, data }
│   ├── lib/
│   │   ├── firebase.js             # Firebase app init; exports auth, db, functions
│   │   ├── tts.js                  # speak(text, lang), selectVoice(lang)
│   │   ├── asr.js                  # startListening, stopListening; returns null if unsupported
│   │   └── fuzzy.js                # similarity(a, b) — Levenshtein; PASS_THRESHOLD = 0.60
│   ├── components/
│   │   ├── PhraseCard.jsx          # Spanish text + English + TTS button
│   │   ├── RewardAnimation.jsx     # Celebration overlay; auto-dismisses after 2s
│   │   ├── NounBank.jsx            # Slide-up word panel, 12 categories + search
│   │   ├── ProtectedRoute.jsx      # Redirects to /login if no auth; email banner; ForcePasswordChange intercept
│   │   ├── LevelCard.jsx           # Level tile on the map; locked/unlocked/completed states
│   │   ├── ContactButton.jsx       # NEW — fixed bottom-right FAB; opens ContactModal
│   │   ├── ContactModal.jsx        # NEW — slide-up contact form; calls CF-0
│   │   ├── AdminRoute.jsx          # NEW — getIdTokenResult(true) claim check; redirects non-admin to /
│   │   └── ForcePasswordChange.jsx # NEW — full-screen overlay; updatePassword + clear Firestore flag
│   ├── admin/                      # NEW — admin dashboard sub-components
│   │   ├── UsersTab.jsx            # getDocs(users), filter by username, expandable rows
│   │   ├── MessagesTab.jsx         # contactMessages grouped open/resolved, reply form → CF-2
│   │   └── SettingsTab.jsx         # user search + 3 action panels → CF-3, CF-4, CF-5
│   ├── modes/
│   │   ├── Discovery.jsx           # Tap objects → TTS; no scoring
│   │   ├── ShadowChallenge.jsx     # TTS → mic → fuzzy score → pass/retry
│   │   ├── Roleplay.jsx            # Dialogue scenario; tap/speak correct phrase to advance
│   │   └── QuickFire.jsx           # Auto TTS (audio-only) → pick matching card → countdown timer
│   ├── pages/
│   │   ├── LoginPage.jsx           # Email sign-in + Google OAuth + Contact Admin link
│   │   ├── RegisterPage.jsx        # Username + email + password form
│   │   ├── LevelMap.jsx            # 12-level grid; XP in header; gear icon → /settings
│   │   ├── LevelPage.jsx           # Mode selector + phrase loader for a given level
│   │   ├── AdminDashboard.jsx      # NEW — /admin; tab shell (Users | Messages | Settings)
│   │   ├── UserSettings.jsx        # NEW — /settings; self-service account management
│   │   ├── VerifyEmailChangePage.jsx    # NEW — /verify-email-change; reads token, calls CF-6
│   │   └── VerifyUsernameChangePage.jsx # NEW — /verify-username-change; reads token, calls CF-8
│   ├── App.jsx                     # React Router routes; wraps AuthContext + ProgressContext
│   └── main.jsx                    # Vite entry point; mounts <App />
├── scripts/
│   └── setAdminClaim.js            # One-time script: sets admin custom claim on app_admin@divel.me UID
├── docs/
│   ├── PLAN.md
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md                    # This file
│   └── TASKS.md
├── CLAUDE.md                       # Project context for Claude Code sessions
├── progress.md                     # Session state tracker
├── .env                            # Local secrets — never committed
├── .env.example                    # Placeholder template — committed
├── .gitignore                      # node_modules/, dist/, .env, .DS_Store
├── firebase.json                   # Firebase Hosting + Functions config
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
| Firestore rules | `users/{uid}`: scoped to own UID. `contactMessages`: authenticated create with field validation; all reads/writes by admin via Admin SDK (bypasses rules). |
| Admin identity | Admin UID stored as Firebase Function environment config — never in client bundle or Firestore rules string comparison |
| Admin claim | Custom claim `admin: true` set once via Admin SDK script on the admin account. `AdminRoute` force-refreshes the token (`getIdTokenResult(true)`) to get the latest claims. |
| Cloud Function security | All admin-only callable functions call `assertAdmin(context)` as the first operation — before any data access. CF-5/CF-3 allow self-service by validating `targetUid === context.auth.uid` for non-admin callers. |
| Token security | Email/username change tokens: 64-char hex (256-bit), generated via `crypto.randomBytes(32)`. Compared using `crypto.timingSafeEqual` to prevent timing attacks. Expire after 24 hours. |
| Temp password | Generated server-side in CF-3. Never returned to caller. Stored in Auth only — not in Firestore or logs. |
| SMTP credentials | Stored as Firebase Function Secrets (not environment config) — encrypted at rest, injected at runtime only. Not in source code, `.env`, or GitHub Secrets. |
| API keys in frontend | Firebase client-side keys are intentionally public; Firestore rules are the security boundary |
| `.env` file | Never committed; `.env.example` with placeholders committed instead |
| Service account JSON | Used only in GitHub Actions secrets for CI deploy; never in source code or `.env` |
| ASR audio | `SpeechRecognition` is browser-native; audio never sent to any external server |
| TTS audio | `SpeechSynthesis` is browser-native; no audio leaves the device |
| Password reset email | Admin/self-service reset via CF-3 — random temp password, plain-text email. Standard "forgot password" still available on the login page via Firebase Auth `sendPasswordResetEmail`. |
| Content Security Policy | To be configured in `firebase.json` headers to restrict script sources to self + Firebase domains |
