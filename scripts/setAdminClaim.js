// Run once to grant admin custom claim to app_admin@divel.me account.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json node scripts/setAdminClaim.js <uid>
//
// Get UID from Firebase Console → Authentication → find app_admin@divel.me → copy UID.

const admin = require('firebase-admin')

const uid = process.argv[2]
if (!uid) {
  console.error('Usage: node scripts/setAdminClaim.js <uid>')
  process.exit(1)
}

admin.initializeApp()

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim set for uid: ${uid}`)
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Failed:', err.message)
    process.exit(1)
  })
