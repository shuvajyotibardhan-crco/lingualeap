const { HttpsError } = require('firebase-functions/v2/https')
const crypto         = require('crypto')
const admin          = require('firebase-admin')

function assertAdmin(request) {
  if (!request.auth || request.auth.uid !== process.env.ADMIN_UID) {
    throw new HttpsError('permission-denied', 'Admin access required')
  }
}

function assertSelfOrAdmin(request, targetUid) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')
  if (request.auth.uid !== targetUid && request.auth.uid !== process.env.ADMIN_UID) {
    throw new HttpsError('permission-denied', 'Access denied')
  }
}

function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12)
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function writeAuditLog({ adminUid, action, targetUid, targetEmail, targetUsername, proofUrl, details }) {
  await admin.firestore().collection('adminActions').add({
    action,
    adminUid,
    targetUid:      targetUid      || null,
    targetEmail:    targetEmail    || null,
    targetUsername: targetUsername || null,
    proofUrl:       proofUrl       || null,
    details:        details        || {},
    performedAt:    admin.firestore.Timestamp.now(),
  })
}

module.exports = { assertAdmin, assertSelfOrAdmin, generateTempPassword, generateToken, writeAuditLog }
