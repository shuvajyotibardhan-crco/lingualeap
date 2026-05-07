const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const { assertAdmin, executeProgressReset, writeAuditLog } = require('./adminHelpers')

if (!admin.apps.length) admin.initializeApp()

exports.adminResetProgress = onCall(async (request) => {
  assertAdmin(request)

  const { targetUid, resetToPhase, proofUrl } = request.data || {}
  if (!targetUid)                  throw new HttpsError('invalid-argument', 'targetUid required')
  if (![1, 2, 3].includes(Number(resetToPhase))) {
    throw new HttpsError('invalid-argument', 'resetToPhase must be 1, 2, or 3')
  }
  if (!proofUrl) throw new HttpsError('invalid-argument', 'proofUrl required')

  const phase = Number(resetToPhase)

  const userRecord = await admin.auth().getUser(targetUid)

  await executeProgressReset(targetUid, phase)

  await writeAuditLog({
    adminUid:       request.auth.uid,
    action:         'resetProgress',
    targetUid,
    targetEmail:    userRecord.email || null,
    targetUsername: userRecord.displayName || null,
    proofUrl,
    details:        { resetToPhase: phase },
  })

  return { success: true }
})
