const nodemailer = require('nodemailer')

async function sendEmail(to, subject, text) {
  const port = parseInt(process.env.SMTP_PORT, 10)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transporter.sendMail({
    from: `"LinguaLeap" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    text,
  })
}

module.exports = { sendEmail }
