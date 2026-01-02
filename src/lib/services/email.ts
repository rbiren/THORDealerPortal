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

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<SendResult> {
  // Import dynamically to avoid circular dependencies
  const { prisma } = await import('@/lib/prisma')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      },
      dealer: {
        include: {
          users: {
            where: { role: { in: ['dealer_admin', 'dealer_user'] } },
            select: { email: true, name: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  const recipient = order.dealer.users[0]
  if (!recipient) {
    return { success: false, error: 'No recipient found for dealer' }
  }

  let shippingAddress: { name?: string; street?: string; city?: string; state?: string; zipCode?: string } = {}
  try {
    if (order.shippingAddress) {
      shippingAddress = JSON.parse(order.shippingAddress)
    }
  } catch {
    // Ignore parse errors
  }

  const subject = `Order Confirmation - ${order.orderNumber}`
  const itemsList = order.items
    .map((item) => `  - ${item.product.name} (${item.product.sku}) x${item.quantity} = $${item.totalPrice.toFixed(2)}`)
    .join('\n')

  const text = `
Thank you for your order!

Order Number: ${order.orderNumber}
${order.poNumber ? `PO Number: ${order.poNumber}` : ''}

Items:
${itemsList}

Subtotal: $${order.subtotal.toFixed(2)}
Tax: $${order.taxAmount.toFixed(2)}
Shipping: $${order.shippingAmount.toFixed(2)}
Total: $${order.totalAmount.toFixed(2)}

Ship To:
${shippingAddress.name || ''}
${shippingAddress.street || ''}
${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}

We'll send you another email when your order ships.

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
  <div style="background: #556B2F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #556B2F;">Order Confirmed!</h2>
    <p>Thank you for your order, ${recipient.name || 'Valued Customer'}.</p>

    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      ${order.poNumber ? `<p style="margin: 5px 0 0;"><strong>PO Number:</strong> ${order.poNumber}</p>` : ''}
    </div>

    <h3 style="color: #556B2F;">Items Ordered</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
          <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
          <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <strong>${item.product.name}</strong><br>
              <span style="color: #666; font-size: 12px;">${item.product.sku}</span>
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;">Subtotal:</td>
          <td style="padding: 10px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;">Tax:</td>
          <td style="padding: 10px; text-align: right;">$${order.taxAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;">Shipping:</td>
          <td style="padding: 10px; text-align: right;">$${order.shippingAmount.toFixed(2)}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 16px;">
          <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb;">Total:</td>
          <td style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb; color: #556B2F;">$${order.totalAmount.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <h3 style="color: #556B2F;">Ship To</h3>
    <div style="background: white; padding: 15px; border-radius: 6px;">
      <p style="margin: 0;">${shippingAddress.name || ''}</p>
      <p style="margin: 5px 0;">${shippingAddress.street || ''}</p>
      <p style="margin: 0;">${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}</p>
    </div>

    <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to: recipient.email, subject, text, html })
}
