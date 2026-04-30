# Plan: LinguaLeap — Language Learning Webapp

## Context
Building a zero-cost, kid-focused "Survival Spanish" web app called **LinguaLeap**.
Scope: 100 phrases across 12 levels (3 phases), 4 gameplay modes, browser-based TTS/speech recognition, Firebase auth + Firestore, PWA-capable.
Future: other languages added alongside Spanish using the same engine.

---

## Approval-Gated Delivery Workflow

Each stage requires user sign-off before the next begins. Docs committed to git only after approval.

| Stage | Deliverable | File |
|---|---|---|
| 1 | Feature List | `docs/REQUIREMENTS.md` |
| 2 | Architecture | `docs/DESIGN.md` |
| 3 | Technical Specs | `docs/SPECS.md` |
| 4 | Task Breakdown | `docs/TASKS.md` |
| 5 | Execution | Code + CI/CD |

---

## Stage 1 — Proposed Feature Set

> **Delivery strategy:** Build the complete app (all 9 core features) using Phase 1 content (Levels 1–4). Test and sign off on the full experience. Then implement admin/contact/settings (Iteration 2). Then add Phase 3 content, test, then Phase 4 content, test. Phases 3 & 4 are purely data additions — no new engine work needed.

---

### ── ITERATION 1: Full App + Phase 1 Content ──

---

### Feature 1: Authentication

**Description:** Secure user accounts with email/password and Google OAuth. All system emails route through app_admin@divel.me.

**Acceptance Criteria:**
1. User must be able to register with a username, valid email, and password (min 8 chars)
2. User must be able to sign in with Google OAuth
3. User must receive a password reset email from app_admin@divel.me within 2 minutes
4. App shall persist the session across browser refreshes
5. Invalid email format or weak password shall show an inline error message
6. Duplicate email registration shall show "Account already exists" error

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open app → click "Sign Up" → enter username, valid email, password → submit | Account created; redirected to Level Map |
| 2 | Sign out → sign in with same credentials | Successfully signed in; Level Map shown |
| 3 | Click "Sign Up" → click "Continue with Google" → complete Google flow | Account created via OAuth; redirected to Level Map |
| 4 | Sign out → click "Forgot Password" → enter email → submit | Email received from app_admin@divel.me with reset link |
| 5 | Register with an invalid email (e.g. "notanemail") | Inline error: "Please enter a valid email" |
| 6 | Register with a password under 8 characters | Inline error: "Password must be at least 8 characters" |
| 7 | Register with an email already in use | Inline error: "An account with this email already exists" |
| 8 | Sign in → close tab → reopen app | Still signed in; Level Map shown without re-login |

---

### Feature 2: Curriculum Engine (Core)

**Description:** Language-agnostic engine that loads phrase data from JSON files, manages level unlock state, and serves content to all gameplay modes.

**Acceptance Criteria:**
1. Engine must load phrase data from `/data/{language}/level_{n}.json` at runtime
2. Level N+1 shall be locked until Level N is completed
3. Each phrase object must contain: id, spanish, english, audioHint, category
4. The Noun Bank must expose swappable words per category
5. Adding a new language must require only a new data folder — no engine code changes

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Load Level 1 data file in browser devtools network tab | `level_1.json` fetched; 5 phrase objects returned |
| 2 | Complete all phrases in Level 1 | Level 2 card on the Level Map becomes unlocked/clickable |
| 3 | Attempt to navigate directly to Level 3 URL before completing Level 2 | Redirected back to Level Map; Level 3 shown as locked |
| 4 | Inspect a phrase object in devtools | Fields: id, spanish, english, audioHint, category all present |
| 5 | Open Noun Bank panel | Category tiles shown; tapping a word plays its TTS |
| 6 | Add a dummy `fr/level_1.json` file with French data | App loads French content without any engine code changes |

---

### Feature 3: Phase 1 Content — Survival (Levels 1–4, Phrases 1–23)

**Description:** The first 23 phrases across 4 themed levels — the initial content shipped with the full app.

**Acceptance Criteria:**
1. All 23 phrases must be present and correctly mapped (Spanish ↔ English)
2. Each phrase must play correctly via TTS when triggered
3. All 4 levels must appear on the Level Map in order
4. Level 1 must be unlocked by default for new users

**Full Phrase List:**

| # | Spanish | English | Level |
|---|---|---|---|
| 1 | ¡Hola! | Hello | 1 – Greetings |
| 2 | ¿Cómo te llamas? | What is your name? | 1 – Greetings |
| 3 | Me llamo... | My name is... | 1 – Greetings |
| 4 | Mucho gusto | Nice to meet you | 1 – Greetings |
| 5 | Adiós | Goodbye | 1 – Greetings |
| 6 | Quiero... | I want... | 2 – The Café |
| 7 | Por favor | Please | 2 – The Café |
| 8 | Gracias | Thank you | 2 – The Café |
| 9 | Tengo hambre | I am hungry | 2 – The Café |
| 10 | La cuenta, por favor | The bill, please | 2 – The Café |
| 11 | Está rico | It's yummy | 2 – The Café |
| 12 | Estoy feliz | I am happy | 3 – Feelings |
| 13 | Estoy triste | I am sad | 3 – Feelings |
| 14 | Tengo miedo | I am scared | 3 – Feelings |
| 15 | ¿Estás bien? | Are you okay? | 3 – Feelings |
| 16 | Me gusta... | I like... | 3 – Feelings |
| 17 | No me gusta... | I don't like... | 3 – Feelings |
| 18 | ¿Dónde está...? | Where is...? | 4 – Directions |
| 19 | A la derecha | To the right | 4 – Directions |
| 20 | A la izquierda | To the left | 4 – Directions |
| 21 | Sigue recto | Go straight | 4 – Directions |
| 22 | Está aquí | It's here | 4 – Directions |
| 23 | Está allí | It's there | 4 – Directions |

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Sign in as new user → open Level Map | Levels 1–4 visible; Level 1 unlocked, Levels 2–4 locked |
| 2 | Enter Level 1 → cycle through all 5 phrases | Each phrase shows correct Spanish text and English translation |
| 3 | Tap TTS button on phrase #1 "¡Hola!" | Browser speaks "Hola" in Spanish |
| 4 | Complete Level 2 (Café) → return to Level Map | Level 3 now unlocked |
| 5 | Spot-check phrase #15: "¿Estás bien?" | Spanish and English both displayed correctly |
| 6 | Spot-check phrase #21: "Sigue recto" | Spanish and English both displayed correctly |
| 7 | Verify all 23 phrases present across Levels 1–4 | Count matches table above; no missing or duplicate phrases |

---

### Feature 4: Gameplay Modes (All Four)

**Description:** Four distinct interaction modes that each use the curriculum phrase data in different ways to reinforce learning.

**Acceptance Criteria:**
1. **Discovery:** Tapping an object icon must play its Spanish name via TTS
2. **Shadow Challenge:** App must play the phrase, then open mic, then show pass/retry based on ≥60% match
3. **Roleplay:** Scenario must present a goal, accept correct phrase responses, and complete with a reward
4. **Quick-Fire:** Audio must play; user must select correct image from 4 options within a time limit
5. All modes must be accessible from within each level
6. Incorrect answers in all modes must show encouragement (not failure messaging)

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter Level 1 → select Discovery | Illustrated scene shown; tap on character → TTS plays "Hola" |
| 2 | Enter Level 2 → select Shadow Challenge → speak "Quiero" clearly | Green animation + pass indicator shown |
| 3 | Shadow Challenge → speak gibberish | "Try again!" prompt shown (no negative language) |
| 4 | Enter Level 2 → select Roleplay "Order at the café" | Goal shown; tapping correct phrase advances the scenario |
| 5 | Roleplay → complete all steps | Reward animation plays; XP added |
| 6 | Enter Level 1 → select Quick-Fire → wait for audio | Four image options shown; selecting correct one scores a point |
| 7 | Quick-Fire → let timer expire | Encouragement shown; phrase replays |
| 8 | Quick-Fire → select wrong image | "Try again!" shown; correct image highlighted |

---

### Feature 5: Text-to-Speech (TTS)

**Description:** Browser-native speech synthesis speaks Spanish phrases aloud. No external API. Audio stays local.

**Acceptance Criteria:**
1. TTS must use a Spanish (`es`) voice when available on the device
2. If no Spanish voice is installed, app must fall back to the default browser voice
3. TTS must not require any network call
4. TTS button must be visible on every phrase card

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | On a device with a Spanish voice → tap any phrase's TTS button | Phrase spoken with Spanish accent/voice |
| 2 | On a device with no Spanish voice → tap TTS button | Phrase spoken with default voice (no crash) |
| 3 | Disable network → tap TTS button | Phrase still plays (no network required) |
| 4 | Rapidly tap TTS button multiple times | Previous utterance cancelled; new one starts cleanly |
| 5 | Open devtools Network tab → tap TTS | Zero network requests logged |

---

### Feature 6: Speech Recognition (ASR)

**Description:** Browser-native microphone input scores the child's spoken attempt against the target phrase using fuzzy matching. All audio stays in the browser.

**Acceptance Criteria:**
1. ASR must activate only in Shadow Challenge mode when the child taps the mic button
2. A visual "listening" wave animation must display while the mic is active
3. A spoken attempt ≥60% similar to the target phrase must score as "pass"
4. A spoken attempt <60% similar must show "try again" (no score decrement)
5. No audio must ever leave the browser/device
6. On browsers without SpeechRecognition support, a tap-to-select fallback must appear

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Shadow Challenge → tap mic | Listening animation starts; no network call made |
| 2 | Speak the exact phrase clearly | Pass animation shown; XP awarded |
| 3 | Speak a close approximation (e.g. "ola" for "hola") | Pass shown (≥60% threshold met) |
| 4 | Speak an unrelated word | "Try again!" shown; no XP deducted |
| 5 | Open devtools Network tab during mic session | Zero outbound audio/data requests |
| 6 | Test on Firefox (no SpeechRecognition) | Tap-to-select fallback appears; no crash |
| 7 | Grant mic permission → revoke mid-session | Graceful error message; retry button shown |

---

### Feature 7: Progress & Rewards

**Description:** Per-user learning progress persisted in Firestore. Includes XP, per-level star ratings, and phase completion badges.

**Acceptance Criteria:**
1. Each completed phrase must award XP (stored in Firestore immediately)
2. A level must award 1–3 stars based on % of phrases passed first-try
3. Completing all levels in a phase must unlock a phase badge
4. Progress must survive browser refresh and re-login
5. A reward animation must play on level completion
6. XP total must be visible on the user's profile/home screen

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Complete a phrase in Shadow Challenge | XP counter increments; Firestore doc updated |
| 2 | Refresh browser after earning XP | XP total unchanged; progress retained |
| 3 | Complete all phrases in Level 1 with all first-try passes | 3-star rating shown on Level 1 card |
| 4 | Complete Level 1 with some retries | 1 or 2-star rating shown |
| 5 | Complete all 4 levels of Phase 1 | Phase 1 badge appears in profile |
| 6 | Sign out → sign in as same user | All stars, badges, and XP still present |
| 7 | Complete a level | Animated celebration plays before returning to Level Map |

---

### Feature 8: PWA (Offline Mode)

**Description:** Service worker caches all assets and phrase data so the app works with no internet connection (planes, trains).

**Acceptance Criteria:**
1. App must load fully after first visit even with no network
2. All phrase data, images, and TTS must work offline
3. App must be installable to device home screen via browser "Add to Home Screen"
4. Progress sync must queue offline writes and flush when connection returns

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Visit app on a device → open DevTools → Application → Service Workers | Service worker registered and active |
| 2 | Load app → enable Airplane Mode → refresh page | App loads fully from cache |
| 3 | Offline → complete a phrase | XP increments in UI; Firestore write queued |
| 4 | Re-enable network | Firestore updates with queued progress |
| 5 | On mobile Chrome → tap browser menu → "Add to Home Screen" | App icon appears on home screen |
| 6 | Launch from home screen icon | App opens without browser chrome (standalone mode) |
| 7 | Offline → tap TTS button | Phrase plays (no network needed for Web Speech API) |

---

### Feature 9: Kid-Friendly UI/UX

**Description:** Visual design and interaction model optimised for children aged 5–12. Bright, touch-friendly, jargon-free, and always encouraging.

**Acceptance Criteria:**
1. All interactive elements must have a minimum touch target of 44×44px
2. No linguistic jargon — use "Naming Words" for nouns, "Action Words" for verbs
3. App must never display the word "wrong" or "incorrect" — only "Try again!" variants
4. Colour palette must be bright and accessible (WCAG AA contrast minimum)
5. Layout must be fully usable on portrait mobile, landscape tablet, and desktop
6. All animations must complete within 500ms to avoid frustrating young users

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open DevTools → toggle mobile view (375px wide) | All buttons and cards fully visible; no overflow |
| 2 | Inspect every button with DevTools | Computed height and width ≥ 44px each |
| 3 | Run browser accessibility checker (axe / Lighthouse) | No WCAG AA contrast failures |
| 4 | Fail a phrase attempt deliberately | Only "Try again!" or positive variant shown; "wrong"/"incorrect" absent |
| 5 | Open app on iPad in landscape | Layout adapts; no broken grid |
| 6 | Open on desktop at 1280px | Centred game panel; no stretched elements |
| 7 | Check all user-facing labels | No "verbs", "nouns", "syntax" — only "Action Words", "Naming Words" |

---

### ── ITERATION 2: Admin Dashboard + Contact Admin + User Self-Service Settings ──

> **Status:** Ready to implement — Iteration 1 app is live and approved.
> Full task list: `docs/TASKS.md` — T5.1 through T5.41.

**Features added:**
- **Feature 12 — Contact Admin:** floating FAB on all logged-in screens; "Contact Admin" link on login page; CF-0 (handles pre-login and post-login submissions); CF-1 (emails admin on new message)
- **Feature 13 — Admin Dashboard:** `/admin` route (admin custom claim guard); Users tab (list all users, filter, expand progress); Messages tab (view open/resolved, reply → real email); Settings tab — admin-initiated password reset, username update, email change
- **Feature 14 — User Self-Service Settings:** `/settings` route (gear icon in LevelMap); self-service password reset (temp password emailed, force-change overlay on next login); self-service username change (email verification → `/verify-username-change`); self-service email change (old-email verification → `/verify-email-change`)

**New Cloud Functions (Node 20, Brevo SMTP):**
- CF-0 `submitContactMessage`, CF-1 `onContactCreated`, CF-2 `adminReplyToContact`
- CF-3 `resetPassword` (admin or self), CF-4 `adminUpdateUsername`
- CF-5 `initiateEmailChange` (admin or self), CF-6 `verifyEmailChange`
- CF-7 `initiateUsernameChange` (self), CF-8 `verifyUsernameChange`

**Architecture changes:** Firebase Blaze plan required; Nodemailer + Brevo SMTP (300/day free); SMTP credentials stored as Firebase Function Secrets; admin UID in Function env config; admin custom claim on `app_admin@divel.me` account.

---

### ── ITERATION 3: Phase 3 Content (after Iteration 2 tested & approved) ──

---

### Feature 10: Phase 3 Content — Connection (Levels 5–8, Phrases 24–60)

**Description:** 37 phrases across 4 new themed levels. Data-only addition; no engine changes.

**Acceptance Criteria:**
1. All 37 phrases must be correctly mapped (Spanish ↔ English)
2. Levels 5–8 must appear locked on Level Map until Level 4 is completed
3. All phrases must work in all four gameplay modes
4. Phase 3 badge must be grantable on completion of Level 8

**Full Phrase List:**

| # | Spanish | English | Level |
|---|---|---|---|
| 24 | Mi familia | My family | 5 – My Family |
| 25 | Mi mamá | My mom | 5 – My Family |
| 26 | Mi papá | My dad | 5 – My Family |
| 27 | Mi hermano/a | My brother/sister | 5 – My Family |
| 28 | Mi abuelo/a | My grandpa/grandma | 5 – My Family |
| 29 | Tengo un perro | I have a dog | 5 – My Family |
| 30 | Tengo un gato | I have a cat | 5 – My Family |
| 31 | Te quiero | I love you | 5 – My Family |
| 32 | ¿Quieres jugar? | Do you want to play? | 6 – Playtime |
| 33 | Es mi turno | It's my turn | 6 – Playtime |
| 34 | Es tu turno | It's your turn | 6 – Playtime |
| 35 | ¡Vamos! | Let's go! | 6 – Playtime |
| 36 | ¡Gané! | I won! | 6 – Playtime |
| 37 | Otra vez | Again | 6 – Playtime |
| 38 | Préstame esto | Lend me this | 6 – Playtime |
| 39 | Es divertido | It's fun | 6 – Playtime |
| 40 | No pasa nada | It's okay / No worries | 6 – Playtime |
| 41 | Rojo | Red | 7 – Colors & Clothes |
| 42 | Azul | Blue | 7 – Colors & Clothes |
| 43 | Verde | Green | 7 – Colors & Clothes |
| 44 | Amarillo | Yellow | 7 – Colors & Clothes |
| 45 | ¿Qué color es? | What color is it? | 7 – Colors & Clothes |
| 46 | Mi color favorito es... | My favorite color is... | 7 – Colors & Clothes |
| 47 | Es muy grande | It's very big | 7 – Colors & Clothes |
| 48 | Es muy pequeño | It's very small | 7 – Colors & Clothes |
| 49 | Me gusta tu ropa | I like your clothes | 7 – Colors & Clothes |
| 50 | Zapatos | Shoes | 7 – Colors & Clothes |
| 51 | Cabeza | Head | 8 – Body & School |
| 52 | Manos | Hands | 8 – Body & School |
| 53 | Pies | Feet | 8 – Body & School |
| 54 | Me duele... | My ... hurts | 8 – Body & School |
| 55 | ¿Puedo ir al baño? | Can I go to the bathroom? | 8 – Body & School |
| 56 | Necesito un lápiz | I need a pencil | 8 – Body & School |
| 57 | Mira esto | Look at this | 8 – Body & School |
| 58 | Escucha | Listen | 8 – Body & School |
| 59 | No entiendo | I don't understand | 8 – Body & School |
| 60 | Repite, por favor | Repeat, please | 8 – Body & School |

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Complete Level 4 → return to Level Map | Level 5 unlocked; Levels 6–8 still locked |
| 2 | Enter Level 5 → cycle all 8 phrases | Correct Spanish/English for all family phrases |
| 3 | Run Shadow Challenge on Level 6 phrase "¡Vamos!" | TTS plays; mic captures; fuzzy match works |
| 4 | Quick-Fire on Level 7 (colors) | Color images shown; audio plays color name |
| 5 | Complete Level 8 | Phase 3 badge awarded; animation plays |
| 6 | Regression: re-enter Level 1 | Phase 1 content unaffected |

---

### ── ITERATION 4: Phase 4 Content (after Iteration 3 tested & approved) ──

---

### Feature 11: Phase 4 Content — Explorer (Levels 9–12, Phrases 61–100)

**Description:** 40 phrases across 4 advanced levels. Data-only addition; no engine changes.

**Acceptance Criteria:**
1. All 40 phrases must be correctly mapped (Spanish ↔ English)
2. Levels 9–12 must appear locked until Level 8 is completed
3. All phrases must work in all four gameplay modes
4. Phase 4 / "Explorer" badge awarded on completion of Level 12
5. Full completion (all 12 levels) must trigger a special "Lingua Legend" celebration

**Full Phrase List:**

| # | Spanish | English | Level |
|---|---|---|---|
| 61 | ¿Cuánto cuesta? | How much? | 9 – Marketplace |
| 62 | Es caro | It's expensive | 9 – Marketplace |
| 63 | Es barato | It's cheap | 9 – Marketplace |
| 64 | Quiero comprar... | I want to buy... | 9 – Marketplace |
| 65 | ¿Aceptan tarjeta? | Do you take cards? | 9 – Marketplace |
| 66 | Una bolsa, por favor | A bag, please | 9 – Marketplace |
| 67 | Cambio | Change / Money | 9 – Marketplace |
| 68 | El mercado | The market | 9 – Marketplace |
| 69 | ¿Hay...? | Is there...? | 9 – Marketplace |
| 70 | Solo miro | Just looking | 9 – Marketplace |
| 71 | El autobús | The bus | 10 – Transport |
| 72 | El tren | The train | 10 – Transport |
| 73 | Un boleto | A ticket | 10 – Transport |
| 74 | ¿A qué hora sale? | What time does it leave? | 10 – Transport |
| 75 | Quiero ir a... | I want to go to... | 10 – Transport |
| 76 | Pare aquí | Stop here | 10 – Transport |
| 77 | La calle... | The street... | 10 – Transport |
| 78 | La estación | The station | 10 – Transport |
| 79 | ¿Está lejos? | Is it far? | 10 – Transport |
| 80 | ¿Está cerca? | Is it near? | 10 – Transport |
| 81 | ¿Qué hora es? | What time is it? | 11 – Schedules |
| 82 | Hoy | Today | 11 – Schedules |
| 83 | Mañana | Tomorrow | 11 – Schedules |
| 84 | Ahora | Now | 11 – Schedules |
| 85 | Más tarde | Later | 11 – Schedules |
| 86 | Pronto | Soon | 11 – Schedules |
| 87 | Desayuno | Breakfast | 11 – Schedules |
| 88 | Almuerzo | Lunch | 11 – Schedules |
| 89 | Cena | Dinner | 11 – Schedules |
| 90 | ¿Cuándo? | When? | 11 – Schedules |
| 91 | ¡Ayuda! | Help! | 12 – Help & Safety |
| 92 | Estoy perdido/a | I am lost | 12 – Help & Safety |
| 93 | Necesito ayuda | I need help | 12 – Help & Safety |
| 94 | ¿Habla inglés? | Do you speak English? | 12 – Help & Safety |
| 95 | Más despacio | Slower | 12 – Help & Safety |
| 96 | ¿Cómo se dice...? | How do you say...? | 12 – Help & Safety |
| 97 | Llame a mi mamá/papá | Call my parents | 12 – Help & Safety |
| 98 | Mi número es... | My number is... | 12 – Help & Safety |
| 99 | Perdón | Excuse me / Sorry | 12 – Help & Safety |
| 100 | Entiendo | I understand | 12 – Help & Safety |

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Complete Level 8 → return to Level Map | Level 9 unlocked; Levels 10–12 locked |
| 2 | Enter Level 9 → spot-check "¿Cuánto cuesta?" | Correct phrase shown; TTS plays correctly |
| 3 | Roleplay Level 10 "Buy a bus ticket" scenario | Scenario completes when correct phrase spoken/tapped |
| 4 | Quick-Fire Level 11 (time words) | Time-related images shown; audio matches |
| 5 | Complete Level 12 | Phase 4 badge + "Lingua Legend" full-completion celebration |
| 6 | Regression: all Phase 1 & Phase 3 levels still show correct star ratings | No regressions from data addition |

---

## Tech Stack (Zero-Cost)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React 18 + Vite | Fast DX, component model fits game UI |
| Styling | Tailwind CSS | Utility-first, rapid kid-UI iteration |
| Auth | Firebase Auth | Google OAuth + email/password, free tier |
| Database | Firebase Firestore | Free 50k reads/day; per-user progress |
| TTS | Web Speech API | Browser-native, no cost |
| ASR | Web Speech API | Browser-native, private |
| Hosting | Firebase Hosting + GitHub Actions | Matches global CLAUDE.md deploy pattern |
| Icons | Lucide React | MIT, free |
| Illustrations | unDraw | CC0, free |
| PWA | Vite PWA plugin | Zero-cost SW generation |

---

## Key Constraints & Decisions

1. **Apple Sign-In dropped** — $99/yr Apple Developer account required; violates zero-cost rule.
2. **Firebase Hosting** chosen over Vercel/GitHub Pages to reuse existing Firebase project (Auth + Firestore already in same project), matching global CLAUDE.md CI/CD pattern.
3. **Web Speech API** browser support: Chrome/Edge full support; Safari partial; Firefox limited. App will show graceful fallback (tap-to-select) when ASR unavailable.
4. **Language extensibility**: all phrase data lives in `public/data/{language}/` JSON files. New language = new folder, same engine.
5. **Cloud Functions (Blaze)** required for admin operations and contact form — approved for Iteration 2. All logic is client-side + Firestore for Iterations 1, 3, and 4.
6. **Admin email: app_admin@divel.me** — Tuta account on Porkbun-registered divel.me domain. Used as the sender for password resets and any system emails. Shared with the Mental Maths / Divel Edu Quiz app. Firebase Auth custom SMTP configured to use this address.

---

## Files to Create (Root Structure)

```
Language Learning App/
├── .github/workflows/deploy.yml     # GitHub Actions CI/CD
├── public/                          # Static assets, manifest.json
├── src/
│   ├── data/
│   │   └── es/                      # Spanish phrase data (JSON per level)
│   ├── components/                  # Reusable UI components
│   ├── pages/                       # Route-level pages
│   ├── modes/                       # Discovery, Shadow, Roleplay, QuickFire
│   ├── hooks/                       # useSpeech, useProgress, useAuth
│   ├── context/                     # AuthContext, ProgressContext
│   ├── lib/                         # firebase.js, tts.js, asr.js, fuzzy.js
│   └── main.jsx
├── docs/
│   ├── PLAN.md                      # This file
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md
│   └── TASKS.md
├── CLAUDE.md
├── progress.md
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Verification (End-to-End Integration)

Each feature has its own test plan above. The integration smoke test across all features:

| # | Step | Expected Result |
|---|---|---|
| 1 | Register new account with email | Redirected to Level Map; Level 1 unlocked |
| 2 | Sign out → sign in with Google | Redirected to Level Map; progress synced |
| 3 | Complete Level 1 via Shadow Challenge | Level 2 unlocks; star rating shown; XP added |
| 4 | Discovery mode: tap object | TTS fires in Spanish; no network call |
| 5 | Shadow Challenge: speak phrase | Visual wave; pass or "try again" shown |
| 6 | Quick-Fire: audio plays | Correct image selectable within time |
| 7 | Roleplay: complete mission | Reward animation; badge if phase done |
| 8 | Kill network → reload app | App loads from cache; TTS still works |
| 9 | Re-enable network | Queued Firestore writes flushed |
| 10 | Check Firestore console | Progress record matches UI exactly |
| 11 | Push to main on GitHub | GitHub Actions deploys successfully; live URL updated |

---

## Immediate Next Actions
1. ~~All Iteration 1 tasks (T0–T1)~~ ✅ COMPLETE — full app deployed, all features live
2. **Iteration 2 implementation** — IN PROGRESS — Admin Dashboard (Feature 13), Contact Admin (Feature 12), User Self-Service Settings (Feature 14); tasks T5.1 through T5.41 in TASKS.md
3. **Iteration 3** — Phase 3 Content (Levels 5–8) — blocked on Iteration 2 sign-off
4. **Iteration 4** — Phase 4 Content (Levels 9–12) — blocked on Iteration 3 sign-off
5. **Noun Bank** — expanded to ~1,373 words across 12 categories (`public/data/es/noun_bank.json`)
