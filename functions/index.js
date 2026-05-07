const admin = require('firebase-admin')
if (!admin.apps.length) admin.initializeApp()

const { submitContactMessage }  = require('./src/submitContactMessage')
const { onContactCreated }      = require('./src/onContactCreated')
const { adminReplyToContact }   = require('./src/adminReplyToContact')
const { adminResetPassword }    = require('./src/adminResetPassword')
const { adminUpdateUsername }   = require('./src/adminUpdateUsername')
const { initiateUsernameChange } = require('./src/initiateUsernameChange')
const { verifyUsernameChange }  = require('./src/verifyUsernameChange')
const { initiateEmailChange }   = require('./src/initiateEmailChange')
const { verifyEmailChange }     = require('./src/verifyEmailChange')
const { adminResetProgress }    = require('./src/adminResetProgress')
const { initiateProgressReset } = require('./src/initiateProgressReset')
const { verifyProgressReset }   = require('./src/verifyProgressReset')

module.exports = {
  submitContactMessage,
  onContactCreated,
  adminReplyToContact,
  adminResetPassword,
  adminUpdateUsername,
  initiateUsernameChange,
  verifyUsernameChange,
  initiateEmailChange,
  verifyEmailChange,
  adminResetProgress,
  initiateProgressReset,
  verifyProgressReset,
}
