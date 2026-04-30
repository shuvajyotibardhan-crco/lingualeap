const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { generateToken } = require('./adminHelpers')
const { sendEmail, emailSecrets } = require('./email')

if (!admin.apps.length) admin.initializeApp()

const APP_URL = 'https://lingualeap-divel.web.app'

exports.initiateUsernameChange = onCall({ secrets: emailSecrets }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')

  const uid = request.auth.uid
  const userRecord = await admin.auth().getUser(uid)
  const token = generateToken()

  await admin.firestore().collection('users').doc(uid).set(
    {
      pendingUsernameChange: {
        token,
        requestedAt: admin.firestore.Timestamp.now(),
      },
    },
    { merge: true }
  )

  const link = `${APP_URL}/verify-username-change?token=${token}&uid=${uid}`
  await sendEmail(
    userRecord.email,
    'Confirm your LinguaLeap username change',
    `Hi ${userRecord.displayName || 'there'},\n\nClick the link below to choose a new username. This link expires in 24 hours.\n\n${link}\n\n— The LinguaLeap Team`
  )

  return { success: true }
})
