# Project State
- **Last Updated:** 2026-04-30
- **Current Branch:** main
- **Current Task:** Awaiting 5 GitHub Secrets + 3 user manual steps, then push to deploy Iteration 2

## Completed Actions
1. [x] All docs written & APPROVED (REQUIREMENTS, DESIGN, SPECS, TASKS) — Iteration 1
2. [x] All 100 phrases: public/data/es/level_1.json → level_12.json
3. [x] T0 COMPLETE — repo: https://github.com/shuvajyotibardhan-crco/lingualeap
4. [x] Firebase project: lingualeap-divel | Auth: Email+Google | Firestore: production
5. [x] All 7 GitHub Actions secrets set
6. [x] T1.1–T1.15 — Full app built and deployed (Auth, Progress, TTS, ASR, all 4 modes, PWA)
7. [x] UAT fixes: email verification banner, QuickFire audio-only mode, Roleplay instructions, Noun Bank panel
8. [x] Noun Bank expanded — public/data/es/noun_bank.json (1,373 entries, 12 categories)
9. [x] REQUIREMENTS.md — Features 12–14 written & APPROVED; DESIGN.md, SPECS.md, TASKS.md all updated
10. [x] PLAN.md + TASKS.md renumbered — Iteration 5 → Iteration 2; phase content renaming applied
11. [x] T2.2–T2.6: functions/ bootstrapped; useCallable.js; email/badge schema fixes in RegisterPage + ProgressContext
12. [x] T2.8–T2.9: CF-0 submitContactMessage + CF-1 onContactCreated
13. [x] T2.10–T2.13: ContactModal + ContactButton FAB; added to all 6 logged-in screens; LoginPage contact link
14. [x] T2.14: CF-2 adminReplyToContact
15. [x] T2.15–T2.19: AdminRoute + AdminDashboard (3-tab shell) + UsersTab + MessagesTab + SettingsTab; /admin route wired
16. [x] T2.20–T2.23: CF-3 adminResetPassword; ForcePasswordChange overlay wired into ProtectedRoute
17. [x] T2.24–T2.28: CF-4 adminUpdateUsername; CF-7 initiateUsernameChange; CF-8 verifyUsernameChange; VerifyUsernameChangePage
18. [x] T2.29–T2.32: CF-5 initiateEmailChange; CF-6 verifyEmailChange; VerifyEmailChangePage; SettingsTab email panel
19. [x] T2.33–T2.35: UserSettings page; /settings route; /verify-email-change + /verify-username-change routes
20. [x] T2.36: deploy.yml updated — installs functions deps + deploys hosting + functions via firebase-tools
21. [x] T2.39: scripts/setAdminClaim.js written
22. [x] CF config pivot: email.js + adminHelpers.js + all 7 CF files switched from defineSecret/defineString to process.env
23. [x] deploy.yml: "Write functions env" step added; target expanded to hosting+functions+firestore:rules
24. [x] firestore.rules: contactMessages create rule added (T2.7 — deployed via CI, not manual Console edit)
25. [x] functions/.env.example created; functions/.env added to .gitignore

## Phase Renaming (approved 2026-04-30)
- Iteration 2 = Admin Dashboard + Contact Admin + User Self-Service Settings (Cloud Functions)
- Iteration 3 = Phase 3 Content (Levels 5–8)
- Iteration 4 = Phase 4 Content (Levels 9–12)
- Phase badges: phase1 (L4), phase3 (L8), phase4 (L12), linguaLegend (all 12)

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 / Web Speech API / vite-plugin-pwa
- Cloud Functions: Node 20, firebase-functions v6 (2nd gen), Nodemailer + Brevo SMTP
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- ProgressContext badge map: { 4: 'phase1', 8: 'phase3', 12: 'phase4' }
- PASS_XP=10, FIRST_ATTEMPT_BONUS=5, PASS_THRESHOLD=0.60

## Steps Required Before Iteration 2 Goes Live

### Claude-executable (needs your secret values):
- **T2.37+T2.38 [SECRETS]**: Add 5 GitHub Actions Secrets via gh CLI:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Brevo SMTP values
  - `ADMIN_UID` — Firebase UID of app_admin@divel.me account

### User manual:
- **T2.1 [MANUAL]**: Firebase Console → upgrade lingualeap-divel to Blaze plan (required for Cloud Functions)
- **T2.39 [MANUAL]**: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json node scripts/setAdminClaim.js <admin_uid>`
  - Get admin UID from Firebase Console → Authentication → find app_admin@divel.me

### Auto-deployed on push (no longer manual):
- ~~T2.7~~ — contactMessages Firestore rule is now in firestore.rules and deployed via CI

## Next Immediate Step
1. User upgrades Firebase project to Blaze plan (T2.1)
2. User provides Brevo SMTP credentials + admin UID → Claude sets 5 GitHub Secrets
3. User runs setAdminClaim.js with service account JSON (T2.39)
4. Push to main → GitHub Actions deploys hosting + functions + firestore:rules
5. After deploy: run T2.41 QA (all 34 Verification Plan test cases)
