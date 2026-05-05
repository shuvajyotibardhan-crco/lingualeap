# LinguaLeap 🦜

A kid-friendly Progressive Web App (PWA) for learning Survival Spanish. 100 phrases across 12 levels, 4 interactive game modes, offline-capable, and free to use.

**Live app:** https://lingualeap-divel.web.app

## What it teaches

100 everyday Spanish phrases organised into 12 themed levels:

| Phase | Levels | Themes |
|---|---|---|
| Phase 1 — Beginner | 1–4 | Greetings, The Café, Feelings, Directions |
| Phase 2 — Explorer | 5–8 | My Family, Playtime, Colors & Clothes, Body & School |
| Phase 3 — Adventure | 9–12 | Marketplace, Transport, Schedules, Help & Safety |

## Game modes

- **Discovery** — Browse all phrases with text-to-speech playback
- **Shadow Challenge** — Listen and repeat; browser speech recognition scores your pronunciation
- **Roleplay** — Hear a situation in English, respond in Spanish
- **Quick Fire** — Listen and tap the matching phrase card

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 3 |
| Auth | Firebase Auth (email/password + Google OAuth) |
| Database | Firestore (user progress, XP, stars, badges) |
| Speech | Web Speech API — TTS + ASR, zero network cost |
| Offline | vite-plugin-pwa (Workbox service worker) |
| Backend | Firebase Cloud Functions v2 (Node 20) |
| Email | Nodemailer + Brevo SMTP |
| CI/CD | GitHub Actions → Firebase Hosting |

## Running locally

```bash
git clone https://github.com/shuvajyotibardhan-crco/lingualeap
cd lingualeap
npm install
cp .env.example .env   # fill in your Firebase config values
npm run dev
```

Open http://localhost:5173.

For Cloud Functions development, also run:
```bash
cd functions
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values from your Firebase project settings. The `functions/.env.example` covers SMTP and admin config for Cloud Functions.

Never commit `.env` or `functions/.env` — both are in `.gitignore`.

## CI/CD

Every push to `main` triggers `.github/workflows/deploy.yml`, which:

1. Installs dependencies for the app and Cloud Functions
2. Writes `functions/.env` from GitHub Actions Secrets
3. Builds the Vite app with all `VITE_*` env vars from Secrets
4. Deploys Firebase Hosting + Cloud Functions via `firebase deploy --only hosting,functions --force`

No manual deploy steps are needed. Add new secrets in GitHub → Settings → Secrets and variables → Actions.

## Project structure

```
public/data/es/     # Phrase JSON files (level_1.json … level_12.json, noun_bank.json)
src/
  context/          # AuthContext, ProgressContext
  modes/            # Discovery, ShadowChallenge, Roleplay, QuickFire
  pages/            # LoginPage, RegisterPage, LevelMap, LevelPage, AdminDashboard, …
  components/       # LevelCard, PhraseCard, NounBank, RewardAnimation, ContactModal, …
  hooks/            # useLevelData, useNounBank, useProgress, useTTS, useASR, useCallable
  lib/              # firebase.js, fuzzy.js
functions/src/      # Cloud Functions (contact, admin reset/rename, email change flows)
docs/               # REQUIREMENTS.md, DESIGN.md, SPECS.md, TASKS.md, PLAN.md
```

## Docs

- [Requirements](docs/REQUIREMENTS.md)
- [Design](docs/DESIGN.md)
- [Specs](docs/SPECS.md)
- [Tasks](docs/TASKS.md)
