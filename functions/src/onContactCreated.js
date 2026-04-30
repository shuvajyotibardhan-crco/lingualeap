const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { sendEmail, emailSecrets } = require('./email')

exports.onContactCreated = onDocumentCreated(
  { document: 'contactMessages/{messageId}', secrets: emailSecrets },
  async (event) => {
    const data = event.data?.data()
    if (!data) return

    try {
      await sendEmail(
        'app_admin@divel.me',
        `New contact message from ${data.username}`,
        `From: ${data.username} <${data.email}>\n\n${data.message}\n\nView at: https://lingualeap-divel.web.app/admin`
      )
    } catch (err) {
      console.error('Failed to email admin on new contact message:', err)
    }
  }
)
