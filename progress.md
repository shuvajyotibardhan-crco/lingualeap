# Project State
- **Last Updated:** 2026-05-07
- **Current Branch:** main
- **Current Task:** Progress Reset feature — COMPLETE; deployed

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
11. [x] T2.2–T2.6: functions/ bootstrapped; useCallable.js; email/badge schema fixes
12. [x] T2.8–T2.9: CF-0 submitContactMessage + CF-1 onContactCreated
13. [x] T2.10–T2.13: ContactModal + ContactButton FAB; added to all 6 logged-in screens; LoginPage contact link
14. [x] T2.14: CF-2 adminReplyToContact
15. [x] T2.15–T2.19: AdminRoute + AdminDashboard (3-tab shell) + UsersTab + MessagesTab + SettingsTab; /admin route wired
16. [x] T2.20–T2.23: CF-3 adminResetPassword; ForcePasswordChange overlay wired into ProtectedRoute
17. [x] T2.24–T2.28: CF-4 adminUpdateUsername; CF-7 initiateUsernameChange; CF-8 verifyUsernameChange; VerifyUsernameChangePage
18. [x] T2.29–T2.32: CF-5 initiateEmailChange; CF-6 verifyEmailChange; VerifyEmailChangePage; SettingsTab email panel
19. [x] T2.33–T2.35: UserSettings page; /settings route; /verify-email-change + /verify-username-change routes
20. [x] T2.36: deploy.yml — installs functions deps + deploys hosting + functions via firebase-tools
21. [x] T2.39: scripts/setAdminClaim.cjs written; admin custom claim set on app_admin@divel.me via GH Actions workflow
22. [x] CF config pivot: all CFs switched to process.env; deploy.yml writes functions/.env from secrets
23. [x] firestore.rules: contactMessages create rule added and deployed
24. [x] Password show/hide eye icon; success screen on ForcePasswordChange
25. [x] T3 + T4 COMPLETE — levels 5–12 fully generic; linguaLegend badge wired
26. [x] T5.1 COMPLETE — README.md created; all docs current
27. [x] Admin entry point: AuthContext exposes isAdmin; LevelMap shows Admin link; AdminRoute guards /admin; set-admin-claim.yml GH Actions workflow
28. [x] Admin wildcard search (min 3 chars): UsersTab + SettingsTab UserSearch require ≥3 chars; wildcard on username + email; contextual hint
29. [x] PDF proof upload: ProofUpload component — PDF ≤10 MB required before any Settings action; uploads to Firebase Storage admin-proofs/{action}/{targetUid}/{adminUid}_{ts}.pdf; progress bar; submit locked until proofUrl set
30. [x] Audit trail: writeAuditLog() in adminHelpers → adminActions Firestore collection; all 4 admin CFs write audit entries; proofUrl included; firestore.rules denies client writes, allows admin reads
31. [x] Firebase Storage: initialised in firebase.js; storage.rules created (admin custom-claim only); firebase.json updated
32. [x] All docs updated — REQUIREMENTS F13 ACs 5/10a–10f/29–32; DESIGN modules + CF table; SPECS AdminAction model + adminActions + Storage schema + file inventory
33. [x] T6 COMPLETE — CF-10 adminResetProgress; CF-11 initiateProgressReset; CF-12 verifyProgressReset; SettingsTab Reset Progress panel; UserSettings Reset Progress section; VerifyProgressResetPage; App.jsx route; TASKS.md updated

## Current Logic Context
- Firebase project ID: lingualeap-divel
- Hosting: https://lingualeap-divel.web.app
- Stack: React 19 + Vite 8 + Tailwind 3 / Firebase 11 / Web Speech API / vite-plugin-pwa
- Cloud Functions: Node 20, firebase-functions v6 (2nd gen), Nodemailer + Brevo SMTP
- Storage bucket: lingualeap-divel.firebasestorage.app
- Admin-proof storage path: admin-proofs/{action}/{targetUid}/{adminUid}_{timestamp}.pdf
- Audit Firestore collection: adminActions (Admin SDK write only; admin read via custom claim)
- Phrase data: public/data/es/level_N.json → served at /data/es/level_N.json
- PASS_XP=10, FIRST_ATTEMPT_BONUS=5, PASS_THRESHOLD=0.60
- Admin UID: eit7Q3XC1ldUVPlugaiLoK3m7Ex2 (app_admin@divel.me) — admin claim set ✓

## Manual Steps Still Required
- **Firebase Console → Storage → Rules**: paste contents of `storage.rules` (admin-only; enables proof uploads)
- **Firebase Console → Firestore → Rules**: paste updated contents of `firestore.rules` (adds adminActions read-only rule)

## Progress Reset Feature — COMPLETE

### What to build
- **CF-10 `adminResetProgress`** — admin callable; resets any user's progress to phase 1/2/3; requires proofUrl; writes audit log
- **CF-11 `initiateProgressReset`** — self callable; stores pendingProgressReset token; emails verification link
- **CF-12 `verifyProgressReset`** — token-auth callable; validates token, executes reset, clears pending
- **SettingsTab** — new "Reset Progress" panel (user search + phase selector + proof upload)
- **UserSettings** — new "Reset Progress" section (phase selector + initiate email → verify page)
- **VerifyProgressResetPage** — `/verify-progress-reset?token=&uid=`; calls CF-12; full page reload on success

### Reset logic (shared between CF-10 and CF-12)
- Phase 1 → clear levels 1–12; xp=0; unlockedLevels=[1]; remove all badges
- Phase 2 → clear levels 5–12; subtract XP for 5–12; keep unlocked 1–4 + add 5; remove phase3/phase4/linguaLegend
- Phase 3 → clear levels 9–12; subtract XP for 9–12; keep unlocked 1–8 + add 9; remove phase4/linguaLegend
- XP: stars 2/3 → 15 XP, stars 1 → 10 XP; clamp to ≥0
- Proof storage path: admin-proofs/resetProgress/{targetUid}/{adminUid}_{ts}.pdf

### Pending manual Firebase Console updates (still required)
- Storage → Rules: paste storage.rules
- Firestore → Rules: paste firestore.rules (with admin read on users collection)

## Next Immediate Step
All features complete. No pending implementation tasks.
