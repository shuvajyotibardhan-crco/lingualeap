# REQUIREMENTS — LinguaLeap

## Overview
**LinguaLeap** is a zero-cost, kid-focused progressive web app that teaches children "Survival Spanish" for travel. It covers 100 high-frequency phrases across 12 levels grouped into 3 phases. Kids learn through four interactive gameplay modes, earn XP and badges as they progress, and the app works offline (on planes and trains). Designed for children aged 5–12; no adult jargon used anywhere.

## Scope

### In Scope
- User authentication (email/password + Google OAuth)
- 12 levels, 100 Spanish phrases, 3 curriculum phases
- Four gameplay modes: Discovery, Shadow Challenge, Roleplay, Quick-Fire
- Browser-native Text-to-Speech (TTS) and Speech Recognition (ASR)
- Per-user progress persistence in Firebase Firestore
- XP points, per-level star ratings, phase completion badges
- PWA: offline support, installable to home screen
- Kid-friendly UI (44px+ touch targets, WCAG AA colour contrast, positive-only feedback)
- Firebase Hosting + GitHub Actions CI/CD
- Password reset and admin emails via app_admin@divel.me (Tuta / Porkbun domain)

### Out of Scope
- Apple Sign-In (requires paid Apple Developer Program — not free)
- Native mobile app (iOS / Android)
- Backend server / Cloud Functions (all logic is client-side + Firestore)
- Paid TTS or ASR services
- Languages other than Spanish in the initial build (engine supports future addition)
- Parent dashboard / admin panel

---

## Delivery Strategy
Build the **complete app** (all engine + UI features) using **Phase 1 content only** (Levels 1–4, 23 phrases). Test and sign off end-to-end. Then bolt on Phase 2 content (Levels 5–8), test, then Phase 3 content (Levels 9–12), test. Phases 2 & 3 require data additions only — no engine code changes.

---

## Feature 1: Authentication

**User Story:** As a parent or child, I want to create a secure account and sign in so that my learning progress is saved and private.

**Acceptance Criteria:**
1. User **must** be able to register with a unique username, valid email address, and password (minimum 8 characters)
2. User **must** be able to sign in using Google OAuth ("Continue with Google")
3. User **must** receive a password reset email originating from `app_admin@divel.me` within 2 minutes of requesting one
4. After email/password registration, a verification email **must** be sent to the registered address before the user can access the app
5. A user who has not verified their email **must** see a "Verify your email" screen with a resend option instead of the Level Map
6. Google OAuth users **must** be granted access immediately (Google verifies the email automatically)
7. App **shall** persist the authenticated session across browser refreshes and tab closes
8. An invalid email format **shall** display an inline error: "Please enter a valid email"
9. A password under 8 characters **shall** display an inline error: "Password must be at least 8 characters"
10. Registering with an already-used email **shall** display: "An account with this email already exists"
11. Apple Sign-In **must not** be implemented (violates zero-cost constraint)

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open app → click "Sign Up" → enter username, valid email, password → submit | "Check your email" screen shown; verification email arrives from Firebase |
| 2 | Click link in verification email → return to app and sign in | Level Map shown; access granted |
| 3 | Sign in with email/password before verifying email | "Verify your email" screen shown with resend button; Level Map not accessible |
| 4 | Tap "Resend verification email" on verify screen | New verification email arrives; button shows "✅ Email sent!" |
| 5 | Click "Sign Up" → click "Continue with Google" → complete Google OAuth flow | Account created via Google; Level Map shown immediately (no email verification step) |
| 6 | Sign out → click "Forgot Password" → enter registered email → submit | Email received from app_admin@divel.me containing a password reset link |
| 7 | Register with "notanemail" as the email field | Inline error: "Please enter a valid email" |
| 8 | Register with a 6-character password | Inline error: "Password must be at least 8 characters" |
| 9 | Register with an email already registered | Inline error: "An account with this email already exists" |
| 10 | Sign in → close browser tab → reopen app URL | Still signed in; Level Map shown without re-login prompt |

---

## Feature 2: Curriculum Engine (Core)

**User Story:** As a developer, I want a language-agnostic phrase engine so that adding a second language (French, Italian, etc.) requires only a new data folder with no code changes.

**Acceptance Criteria:**
1. Engine **must** load phrase data from `/data/{language}/level_{n}.json` at runtime
2. Level N+1 **shall** be locked until the user has completed Level N
3. Each phrase data object **must** contain the fields: `id`, `spanish`, `english`, `audioHint`, `category`
4. The Traveller's Noun Bank **must** expose swappable words grouped by category (People, Places, Food, Items)
5. Adding a new language **must** require only a new data subfolder — zero engine code changes

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open DevTools → Network tab → load Level 1 | `level_1.json` fetched; 5 phrase objects returned |
| 2 | Complete all phrases in Level 1 | Level 2 card on the Level Map becomes unlocked/clickable |
| 3 | Navigate directly to `/level/3` URL before completing Level 2 | Redirected to Level Map; Level 3 shown as locked |
| 4 | Inspect a phrase object in DevTools Console | Fields: id, spanish, english, audioHint, category — all present |
| 5 | Open Noun Bank panel | Category tiles shown; tapping any word plays its TTS |
| 6 | Add a test `fr/level_1.json` with French data | App loads French content without any engine code changes |

---

## Feature 3: Phase 1 Content — Survival (Levels 1–4, Phrases 1–23)

**User Story:** As a child, I want to learn the most essential Spanish phrases so that I can greet people, ask for food, express feelings, and find my way around.

**Acceptance Criteria:**
1. All 23 phrases **must** be present and correctly mapped (Spanish ↔ English) as per the table below
2. Each phrase **must** play correctly via TTS when triggered
3. Levels 1–4 **must** appear on the Level Map in numerical order
4. Level 1 **must** be unlocked by default for all new users
5. Completing a level **shall** unlock the next level

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
| 2 | Enter Level 1 → cycle through all 5 phrases | Correct Spanish text and English translation shown for each |
| 3 | Tap TTS button on phrase #1 "¡Hola!" | Browser speaks "Hola" in Spanish |
| 4 | Complete Level 2 (Café) → return to Level Map | Level 3 card now shows as unlocked |
| 5 | Spot-check phrase #15: "¿Estás bien?" | Spanish and English both displayed correctly |
| 6 | Spot-check phrase #21: "Sigue recto" | Spanish and English both displayed correctly |
| 7 | Verify all 23 phrases present across Levels 1–4 | Count matches table above; no missing or duplicate entries |

---

## Feature 4: Gameplay Modes (All Four)

**User Story:** As a child, I want different ways to practise Spanish so that learning stays fun and I get better at speaking, listening, and recognising words.

**Acceptance Criteria:**
1. **Discovery mode:** Tapping an object icon **must** play its Spanish name via TTS
2. **Shadow Challenge mode:** App **must** play the phrase, open the microphone, then show pass/retry based on ≥60% speech match
3. **Roleplay mode:** A "How to play" banner **must** be shown; an English situation prompt **must** be presented; the user **must** respond by speaking or tapping the correct Spanish phrase; the round **shall** complete with a reward animation
4. **Quick-Fire mode:** Audio **must** play automatically; the Spanish word **must not** be shown in the prompt (audio-only to prevent trivial text-matching); the user **must** select the matching card from 4 options within a countdown timer
5. All four modes **shall** be accessible from within each level
6. Incorrect answers in all modes **must** display encouraging language only (never "wrong" or "incorrect")

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter Level 1 → select Discovery | Scene shown; tap character → TTS plays "Hola" |
| 2 | Enter Level 2 → select Shadow Challenge → speak "Quiero" clearly | Green animation + pass indicator shown; XP awarded |
| 3 | Shadow Challenge → speak gibberish | "Try again!" prompt shown; no "wrong" language |
| 4 | Enter Level 2 → select Roleplay "Order at the café" | Goal shown on screen; tapping correct phrase advances the scenario |
| 5 | Roleplay → complete all dialogue steps | Reward animation plays; XP added |
| 6 | Enter Level 1 → select Quick-Fire → audio plays | Four Spanish word cards shown; no Spanish text in the prompt area |
| 7 | Quick-Fire → let countdown expire | Encouragement shown; phrase audio replays automatically |
| 8 | Quick-Fire → select wrong card | "Try again!" shown; correct card briefly highlighted |

---

## Feature 5: Text-to-Speech (TTS)

**User Story:** As a child, I want to hear every Spanish phrase spoken aloud so that I can learn the correct pronunciation.

**Acceptance Criteria:**
1. TTS **must** use a Spanish (`es-ES` or `es-MX`) voice when one is available on the device
2. If no Spanish voice is installed, app **shall** fall back to the browser's default voice without crashing
3. TTS **must not** require any network call — all synthesis is browser-native
4. A TTS play button **shall** be visible on every phrase card
5. Starting a new TTS utterance **shall** cancel any currently playing utterance

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | On device with Spanish voice → tap any phrase's TTS button | Phrase spoken with Spanish accent |
| 2 | On device with no Spanish voice → tap TTS button | Phrase spoken with default voice; no error |
| 3 | Disable network → tap TTS button | Phrase plays normally (no network required) |
| 4 | Rapidly tap TTS button multiple times | Previous utterance cancels; new one starts cleanly |
| 5 | Open DevTools Network tab → tap TTS button | Zero network requests logged |

---

## Feature 6: Speech Recognition (ASR)

**User Story:** As a child, I want the app to listen to me speak Spanish so that I get feedback on how well I'm saying the phrase.

**Acceptance Criteria:**
1. ASR **shall** activate only in Shadow Challenge mode when the child taps the microphone button
2. A visual "listening" wave animation **must** display while the microphone is active
3. A spoken attempt matching ≥60% of the target phrase **must** score as "pass"
4. A spoken attempt below 60% match **shall** show "Try again!" with no XP penalty
5. No audio **must** ever leave the browser — all speech recognition is browser-native
6. On browsers without `SpeechRecognition` support, a tap-to-select fallback **must** appear instead of the microphone

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Shadow Challenge → tap mic button | Listening wave animation starts; DevTools shows zero outbound requests |
| 2 | Speak the target phrase clearly | Pass animation shown; XP awarded |
| 3 | Speak a close approximation (e.g. "ola" for "hola") | Pass shown (≥60% threshold met) |
| 4 | Speak an unrelated word | "Try again!" shown; no XP deducted |
| 5 | Open DevTools Network tab during mic session | Zero outbound audio or data requests |
| 6 | Test on Firefox (no SpeechRecognition API) | Tap-to-select fallback appears; no crash or blank screen |
| 7 | Grant mic permission → revoke it mid-session | Graceful error message shown; retry button available |

---

## Feature 7: Progress & Rewards

**User Story:** As a child, I want to earn stars and badges as I complete levels so that I feel proud of my progress and want to keep going.

**Acceptance Criteria:**
1. Each completed phrase **must** award XP immediately, stored in Firestore
2. A level **shall** award 1–3 stars based on the percentage of phrases passed on the first attempt
3. Completing all levels in a phase **must** unlock a phase completion badge
4. Progress (XP, stars, badges) **must** survive browser refresh and re-login
5. A reward animation **shall** play immediately after a level is completed
6. The user's XP total **shall** be visible on the home / level map screen at all times

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Complete a phrase in Shadow Challenge | XP counter increments on screen; Firestore document updated |
| 2 | Refresh browser after earning XP | XP total unchanged; all progress retained |
| 3 | Complete all phrases in Level 1 with zero retries | 3-star rating shown on Level 1 card |
| 4 | Complete Level 1 with some retries | 1 or 2-star rating shown |
| 5 | Complete all 4 levels of Phase 1 | Phase 1 "Survival" badge appears in user profile |
| 6 | Sign out → sign in as the same user | All stars, badges, and XP totals intact |
| 7 | Complete any level | Animated celebration plays before returning to Level Map |

---

## Feature 8: PWA (Offline Mode)

**User Story:** As a parent, I want the app to work without internet on planes and trains so that my child can practise Spanish anywhere.

**Acceptance Criteria:**
1. App **must** load fully after the first visit even with no network connection
2. All phrase data, images, and TTS functionality **must** work offline
3. App **must** be installable to a device home screen via the browser's "Add to Home Screen" prompt
4. Any progress saved while offline **shall** be queued and synced to Firestore when the connection returns

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | Visit app → DevTools → Application → Service Workers | Service worker shown as registered and active |
| 2 | Load app fully → enable Airplane Mode → refresh | App loads completely from service worker cache |
| 3 | While offline → complete a phrase | XP increments in UI; Firestore write queued locally |
| 4 | Re-enable network | Queued Firestore writes flush automatically; progress synced |
| 5 | Mobile Chrome → browser menu → "Add to Home Screen" | App icon appears on device home screen |
| 6 | Launch app from home screen icon | App opens in standalone mode (no browser address bar) |
| 7 | While offline → tap TTS button | Phrase plays normally (Web Speech API needs no network) |

---

## Feature 9: Kid-Friendly UI/UX

**User Story:** As a child aged 5–12, I want the app to look bright and fun with big buttons so that I can use it easily without help from a grown-up.

**Acceptance Criteria:**
1. All interactive elements **must** have a minimum touch target size of 44×44px
2. No linguistic jargon **shall** appear — use "Naming Words" for nouns and "Action Words" for verbs
3. The words "wrong" and "incorrect" **must never** appear in any user-facing text
4. Colour palette **must** achieve WCAG AA contrast minimum (4.5:1 for normal text, 3:1 for large text)
5. Layout **must** be fully functional on portrait mobile (375px), landscape tablet (768px), and desktop (1280px+)
6. All animations **shall** complete within 500ms

**Test Plan:**

| # | Step | Expected Result |
|---|---|---|
| 1 | DevTools → toggle mobile view at 375px width | All buttons and cards visible; no horizontal overflow |
| 2 | Inspect every interactive element in DevTools | Computed height and width ≥ 44px each |
| 3 | Run Lighthouse accessibility audit | No WCAG AA contrast failures reported |
| 4 | Deliberately fail a phrase attempt | Only "Try again!" or positive variant shown; "wrong"/"incorrect" absent from DOM |
| 5 | Open app on iPad in landscape orientation | Layout adapts correctly; no broken grid or clipped content |
| 6 | Open on desktop at 1280px | Centred game panel; no stretched or broken elements |
| 7 | Search all UI strings for jargon | No "verb", "noun", "syntax", "grammar" found in any user-facing label |

---

## Feature 10: Phase 2 Content — Connection (Levels 5–8, Phrases 24–60)

*Added after Iteration 1 is tested and approved. Data-only addition — no engine changes.*

**User Story:** As a child, I want to learn Spanish phrases about my family, games, colours, and school so that I can connect with other kids when I travel.

**Acceptance Criteria:**
1. All 37 phrases **must** be present and correctly mapped (Spanish ↔ English) as per the table below
2. Levels 5–8 **shall** appear locked on the Level Map until Level 4 is completed
3. All phrases **must** work in all four gameplay modes without engine changes
4. Phase 2 "Connection" badge **must** be awarded on completion of Level 8

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
| 2 | Enter Level 5 → cycle all 8 phrases | Correct Spanish/English for all family phrases shown |
| 3 | Shadow Challenge on Level 6 phrase "¡Vamos!" | TTS plays; mic captures; fuzzy match scores correctly |
| 4 | Quick-Fire on Level 7 (colours) | Four colour word cards shown; audio plays the colour name; no Spanish text in prompt |
| 5 | Complete Level 8 | Phase 2 "Connection" badge awarded; animation plays |
| 6 | Regression: re-enter Level 1 | Phase 1 content and star ratings unaffected |

---

## Feature 11: Phase 3 Content — Explorer (Levels 9–12, Phrases 61–100)

*Added after Iteration 2 is tested and approved. Data-only addition — no engine changes.*

**User Story:** As a child, I want to learn Spanish phrases for shopping, transport, time, and staying safe so that I can navigate the world confidently when I travel.

**Acceptance Criteria:**
1. All 40 phrases **must** be present and correctly mapped (Spanish ↔ English) as per the table below
2. Levels 9–12 **shall** appear locked until Level 8 is completed
3. All phrases **must** work in all four gameplay modes without engine changes
4. Phase 3 "Explorer" badge **must** be awarded on completion of Level 12
5. Completing all 12 levels **must** trigger a special "Lingua Legend" full-completion celebration

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
| 1 | Complete Level 8 → return to Level Map | Level 9 unlocked; Levels 10–12 still locked |
| 2 | Enter Level 9 → spot-check phrase #61 "¿Cuánto cuesta?" | Correct Spanish and English shown; TTS plays correctly |
| 3 | Roleplay Level 10 "Buy a bus ticket" | Scenario completes on correct phrase spoken or tapped |
| 4 | Quick-Fire Level 11 (time words) | Four time-word cards shown; audio matches phrase; no Spanish text in prompt |
| 5 | Complete Level 12 | Phase 3 "Explorer" badge awarded |
| 6 | After Level 12 completion | "Lingua Legend" full-completion celebration triggers |
| 7 | Regression: Levels 1–8 star ratings and badges intact | No regressions introduced by Phase 3 data addition |
