const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { generateTempPassword } = require('./adminHelpers')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

exports.adminResetPassword = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')

  const { targetUid } = request.data || {}
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid required')

  const isAdmin = request.auth.uid === process.env.ADMIN_UID
  if (!isAdmin && request.auth.uid !== targetUid) {
    throw new HttpsError('permission-denied', 'Can only reset your own password')
  }

  const tempPassword = generateTempPassword()
  const userRecord = await admin.auth().getUser(targetUid)

  await admin.auth().updateUser(targetUid, { password: tempPassword })
  await admin.firestore().collection('users').doc(targetUid).set(
    { requiresPasswordChange: true },
    { merge: true }
  )

  try {
    await sendEmail(
      userRecord.email,
      'Your LinguaLeap password has been reset',
      `Hi ${userRecord.displayName || 'there'},\n\nYour password has been reset. Use this temporary password to sign in:\n\n  ${tempPassword}\n\nYou will be asked to set a new password immediately after signing in.\n\n— The LinguaLeap Team`
    )
  } catch (err) {
    console.error('Failed to email temp password:', err)
  }

  return { success: true }
})
