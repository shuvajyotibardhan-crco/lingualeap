const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

if (!admin.apps.length) admin.initializeApp()

exports.submitContactMessage = onCall(async (request) => {
  const { username, email, message } = request.data || {}

  if (!username || username.trim().length < 1 || username.trim().length > 80) {
    throw new HttpsError('invalid-argument', 'Username must be 1–80 characters')
  }
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new HttpsError('invalid-argument', 'Valid email is required')
  }
  if (!message || message.trim().length < 1 || message.trim().length > 2000) {
    throw new HttpsError('invalid-argument', 'Message must be 1–2000 characters')
  }

  await admin.firestore().collection('contactMessages').add({
    username: username.trim(),
    email,
    message: message.trim(),
    uid: request.auth?.uid ?? null,
    status: 'open',
    replies: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { success: true }
})
