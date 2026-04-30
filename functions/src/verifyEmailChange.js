const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const crypto = require('crypto')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

exports.verifyEmailChange = onCall(async (request) => {
  const { uid, token } = request.data || {}

  if (!uid || !token) {
    throw new HttpsError('invalid-argument', 'uid and token are required')
  }

  const ref = admin.firestore().collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'User not found')

  const { pendingEmailChange } = snap.data()
  if (!pendingEmailChange) {
    throw new HttpsError('failed-precondition', 'No pending email change found')
  }

  const { newEmail, token: storedToken, requestedAt } = pendingEmailChange
  if (Date.now() - requestedAt.toMillis() > 24 * 60 * 60 * 1000) {
    throw new HttpsError('deadline-exceeded', 'This link has expired — please request a new one')
  }

  const stored = Buffer.from(storedToken, 'hex')
  const input  = Buffer.from(token, 'hex')
  if (stored.length !== input.length || !crypto.timingSafeEqual(stored, input)) {
    throw new HttpsError('invalid-argument', 'Invalid or already-used token')
  }

  await admin.auth().updateUser(uid, { email: newEmail })
  await ref.set(
    {
      email: newEmail,
      pendingEmailChange: admin.firestore.FieldValue.delete(),
    },
    { merge: true }
  )

  try {
    await sendEmail(
      newEmail,
      'Your LinguaLeap login email has been updated',
      `Your login email has been successfully changed to: ${newEmail}\n\n— The LinguaLeap Team`
    )
  } catch (err) {
    console.error('Failed to send email change confirmation:', err)
  }

  return { success: true, newEmail }
})
