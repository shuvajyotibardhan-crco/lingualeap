const { defineSecret } = require('firebase-functions/params')
const nodemailer = require('nodemailer')

const SMTP_HOST = defineSecret('SMTP_HOST')
const SMTP_PORT = defineSecret('SMTP_PORT')
const SMTP_USER = defineSecret('SMTP_USER')
const SMTP_PASS = defineSecret('SMTP_PASS')

const emailSecrets = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS]

async function sendEmail(to, subject, text) {
  const port = parseInt(SMTP_PORT.value(), 10)
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port,
    secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
  })
  await transporter.sendMail({
    from: `"LinguaLeap" <${SMTP_USER.value()}>`,
    to,
    subject,
    text,
  })
}

module.exports = { sendEmail, emailSecrets }
