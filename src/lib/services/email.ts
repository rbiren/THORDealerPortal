/**
 * Email service for sending transactional emails
 * Currently uses console logging for development
 * Replace with actual email provider (Resend, SendGrid, etc.) for production
 */

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email
 * In development, logs to console
 * In production, would use actual email provider
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const { to, subject, text, html } = options

  // Development mode: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('-'.repeat(60))
    console.log(text)
    console.log('='.repeat(60) + '\n')

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    }
  }

  // Production: would integrate with email provider here
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // const result = await resend.emails.send({
  //   from: 'noreply@thordealer.com',
  //   to,
  //   subject,
  //   text,
  //   html,
  // })

  console.warn('Email sending not configured for production')
  return {
    success: false,
    error: 'Email provider not configured',
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  expiresAt: Date
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
  const expiresIn = Math.round(
    (expiresAt.getTime() - Date.now()) / 1000 / 60
  )

  const subject = 'Reset your THOR Dealer Portal password'
  const text = `
You requested a password reset for your THOR Dealer Portal account.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiresIn} minutes.

If you didn't request this reset, you can safely ignore this email.

---
THOR Dealer Portal
`.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0;">Reset Your Password</h2>
    <p>You requested a password reset for your THOR Dealer Portal account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in ${expiresIn} minutes.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}
