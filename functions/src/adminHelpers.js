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

const PHASE_LEVELS = {
  1: [1,2,3,4,5,6,7,8,9,10,11,12],
  2: [5,6,7,8,9,10,11,12],
  3: [9,10,11,12],
}
const PHASE_ENTRY = { 1: 1, 2: 5, 3: 9 }
const BADGES_REMOVE = {
  1: ['phase1', 'phase3', 'phase4', 'linguaLegend'],
  2: ['phase3', 'phase4', 'linguaLegend'],
  3: ['phase4', 'linguaLegend'],
}

async function executeProgressReset(targetUid, resetToPhase) {
  const levels = PHASE_LEVELS[resetToPhase]
  const entry  = PHASE_ENTRY[resetToPhase]

  const snap = await admin.firestore().collection('users').doc(targetUid).get()
  if (!snap.exists) throw new HttpsError('not-found', 'User not found')
  const data = snap.data()

  const levelStars     = data.levelStars     || {}
  const unlockedLevels = data.unlockedLevels || [1]
  const badges         = data.badges         || []
  const currentXp      = data.xp             || 0

  let xpToSubtract = 0
  for (const lvl of levels) {
    const stars = levelStars[String(lvl)] || 0
    if (stars >= 2)      xpToSubtract += 15
    else if (stars === 1) xpToSubtract += 10
  }

  const newUnlocked = [...new Set([
    ...unlockedLevels.filter(l => !levels.includes(l) || l === entry),
    entry,
  ])]

  const updateData = {
    xp:             Math.max(0, currentXp - xpToSubtract),
    unlockedLevels: newUnlocked,
    badges:         badges.filter(b => !BADGES_REMOVE[resetToPhase].includes(b)),
    lastUpdated:    admin.firestore.Timestamp.now(),
  }
  for (const lvl of levels) {
    updateData[`levelStars.${lvl}`] = admin.firestore.FieldValue.delete()
  }

  await admin.firestore().collection('users').doc(targetUid).update(updateData)
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

module.exports = { assertAdmin, assertSelfOrAdmin, generateTempPassword, generateToken, executeProgressReset, writeAuditLog }
