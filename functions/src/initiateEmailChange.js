const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { generateToken } = require('./adminHelpers')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

const APP_URL = 'https://lingualeap-divel.web.app'

exports.initiateEmailChange = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')

  const { targetUid, newEmail } = request.data || {}
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid required')
  if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
    throw new HttpsError('invalid-argument', 'Valid new email required')
  }

  const isAdmin = request.auth.uid === process.env.ADMIN_UID
  if (!isAdmin && request.auth.uid !== targetUid) {
    throw new HttpsError('permission-denied', 'Can only change your own email')
  }

  const userRecord = await admin.auth().getUser(targetUid)
  if (userRecord.email === newEmail) {
    throw new HttpsError('invalid-argument', 'New email is the same as current email')
  }

  const snap = await admin.firestore().collection('users').doc(targetUid).get()
  if (snap.exists && snap.data().pendingEmailChange) {
    throw new HttpsError('failed-precondition', 'An email change is already pending for this account')
  }

  const token = generateToken()
  await admin.firestore().collection('users').doc(targetUid).set(
    {
      pendingEmailChange: {
        newEmail,
        token,
        requestedAt: admin.firestore.Timestamp.now(),
      },
    },
    { merge: true }
  )

  const link = `${APP_URL}/verify-email-change?token=${token}&uid=${targetUid}`
  await sendEmail(
    userRecord.email,
    'Confirm your LinguaLeap email change',
    `Hi ${userRecord.displayName || 'there'},\n\nClick the link below to confirm your login email change to: ${newEmail}\n\nThis link expires in 24 hours.\n\n${link}\n\n— The LinguaLeap Team`
  )

  return { success: true }
})
