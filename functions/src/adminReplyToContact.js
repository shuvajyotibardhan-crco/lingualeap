const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { assertAdmin } = require('./adminHelpers')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

exports.adminReplyToContact = onCall(async (request) => {
  assertAdmin(request)

  const { messageId, replyText } = request.data || {}
  if (!messageId) throw new HttpsError('invalid-argument', 'messageId required')
  if (!replyText || replyText.trim().length < 1 || replyText.trim().length > 2000) {
    throw new HttpsError('invalid-argument', 'replyText must be 1–2000 characters')
  }

  const ref = admin.firestore().collection('contactMessages').doc(messageId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Message not found')

  const data = snap.data()
  await ref.update({
    replies: admin.firestore.FieldValue.arrayUnion({
      text: replyText.trim(),
      repliedAt: new Date().toISOString(),
    }),
    status: 'resolved',
  })

  try {
    await sendEmail(
      data.email,
      'Reply from LinguaLeap Support',
      `Hi ${data.username},\n\nA member of our team has replied to your message:\n\n"${replyText.trim()}"\n\nThank you for reaching out!\n\n— The LinguaLeap Team`
    )
  } catch (err) {
    console.error('Failed to email user on reply:', err)
  }

  return { success: true }
})
