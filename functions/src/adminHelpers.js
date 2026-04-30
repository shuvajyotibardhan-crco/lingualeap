const { HttpsError } = require('firebase-functions/v2/https')
const crypto         = require('crypto')

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

module.exports = { assertAdmin, assertSelfOrAdmin, generateTempPassword, generateToken }
