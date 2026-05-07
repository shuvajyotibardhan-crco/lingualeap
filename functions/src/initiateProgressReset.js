const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { generateToken } = require('./adminHelpers')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

const APP_URL = 'https://lingualeap-divel.web.app'

exports.initiateProgressReset = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')

  const { resetToPhase } = request.data || {}
  if (![1, 2, 3].includes(Number(resetToPhase))) {
    throw new HttpsError('invalid-argument', 'resetToPhase must be 1, 2, or 3')
  }

  const uid   = request.auth.uid
  const phase = Number(resetToPhase)

  const ref  = admin.firestore().collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'User not found')
  if (snap.data().pendingProgressReset) {
    throw new HttpsError('failed-precondition', 'A progress reset is already pending — check your email')
  }

  const userRecord = await admin.auth().getUser(uid)

  const token = generateToken()
  await ref.set(
    {
      pendingProgressReset: {
        resetToPhase: phase,
        token,
        requestedAt: admin.firestore.Timestamp.now(),
      },
    },
    { merge: true }
  )

  const phaseLabel = ['', 'Phase 1 (Levels 1–4)', 'Phase 2 (Levels 5–8)', 'Phase 3 (Levels 9–12)'][phase]
  const link = `${APP_URL}/verify-progress-reset?token=${token}&uid=${uid}`

  await sendEmail(
    userRecord.email,
    'Confirm your LinguaLeap progress reset',
    `Hi ${userRecord.displayName || 'there'},\n\nYou requested to reset your progress back to ${phaseLabel}. This will permanently clear your stars, XP, and badges for that phase and all later phases.\n\nClick the link below to confirm. This link expires in 24 hours.\n\n${link}\n\nIf you did not request this, you can safely ignore this email.\n\n— The LinguaLeap Team`
  )

  return { success: true }
})
