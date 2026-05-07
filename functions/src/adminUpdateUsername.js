const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { assertAdmin, writeAuditLog } = require('./adminHelpers')
const { sendEmail } = require('./email')

if (!admin.apps.length) admin.initializeApp()

exports.adminUpdateUsername = onCall(async (request) => {
  assertAdmin(request)

  const { targetUid, newUsername, proofUrl } = request.data || {}
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid required')
  if (!newUsername || newUsername.trim().length < 1 || newUsername.trim().length > 40) {
    throw new HttpsError('invalid-argument', 'Username must be 1–40 characters')
  }
  if (!proofUrl) throw new HttpsError('invalid-argument', 'proofUrl required')

  const name = newUsername.trim()
  const userRecord = await admin.auth().getUser(targetUid)
  await admin.auth().updateUser(targetUid, { displayName: name })
  await admin.firestore().collection('users').doc(targetUid).set(
    { username: name },
    { merge: true }
  )

  try {
    await sendEmail(
      userRecord.email,
      'Your LinguaLeap username has been updated',
      `Hi,\n\nYour username has been updated to: ${name}\n\n— The LinguaLeap Team`
    )
  } catch (err) {
    console.error('Failed to email username update notification:', err)
  }

  await writeAuditLog({
    adminUid:       request.auth.uid,
    action:         'updateUsername',
    targetUid,
    targetEmail:    userRecord.email,
    targetUsername: userRecord.displayName || null,
    proofUrl,
    details:        { newUsername: name },
  })

  return { success: true }
})
