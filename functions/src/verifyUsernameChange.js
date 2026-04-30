const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const crypto = require('crypto')

if (!admin.apps.length) admin.initializeApp()

exports.verifyUsernameChange = onCall(async (request) => {
  const { uid, token, newUsername } = request.data || {}

  if (!uid || !token || !newUsername) {
    throw new HttpsError('invalid-argument', 'uid, token, and newUsername are required')
  }
  if (newUsername.trim().length < 1 || newUsername.trim().length > 40) {
    throw new HttpsError('invalid-argument', 'Username must be 1–40 characters')
  }

  const ref = admin.firestore().collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'User not found')

  const { pendingUsernameChange } = snap.data()
  if (!pendingUsernameChange) {
    throw new HttpsError('failed-precondition', 'No pending username change found')
  }

  const { token: storedToken, requestedAt } = pendingUsernameChange
  if (Date.now() - requestedAt.toMillis() > 24 * 60 * 60 * 1000) {
    throw new HttpsError('deadline-exceeded', 'This link has expired — please request a new one')
  }

  const stored = Buffer.from(storedToken, 'hex')
  const input  = Buffer.from(token, 'hex')
  if (stored.length !== input.length || !crypto.timingSafeEqual(stored, input)) {
    throw new HttpsError('invalid-argument', 'Invalid or already-used token')
  }

  const name = newUsername.trim()
  await admin.auth().updateUser(uid, { displayName: name })
  await ref.set(
    {
      username: name,
      pendingUsernameChange: admin.firestore.FieldValue.delete(),
    },
    { merge: true }
  )

  return { success: true }
})
