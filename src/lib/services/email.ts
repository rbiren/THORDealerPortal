/**
 * Email service for sending transactional emails
 * Currently uses console logging for development
 * Replace with actual email provider (Resend, SendGrid, etc.) for production
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  text: string
  html?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export type EmailTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'invoice_created'
  | 'invoice_overdue'
  | 'password_reset'
  | 'document_expiry'
  | 'low_stock_alert'
  | 'system_announcement'
  | 'welcome'

/**
 * Send an email
 * In development, logs to console
 * In production, would use actual email provider
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const { to, subject, text, html } = options
  const recipients = Array.isArray(to) ? to : [to]

  // Development mode: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${recipients.join(', ')}`)
    console.log(`Subject: ${subject}`)
    if (options.cc?.length) console.log(`CC: ${options.cc.join(', ')}`)
    if (options.bcc?.length) console.log(`BCC: ${options.bcc.join(', ')}`)
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
  //   to: recipients,
  //   subject,
  //   text,
  //   html,
  //   cc: options.cc,
  //   bcc: options.bcc,
  //   replyTo: options.replyTo,
  //   attachments: options.attachments,
  // })

  console.warn('Email sending not configured for production')
  return {
    success: false,
    error: 'Email provider not configured',
  }
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  text: string,
  html?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = await Promise.all(
    recipients.map((to) => sendEmail({ to, subject, text, html }))
  )

  const success = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const errors = results.filter((r) => r.error).map((r) => r.error!)

  return { success, failed, errors }
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
  type OrderItemLine = { product: { name: string; sku: string }; quantity: number; totalPrice: number }
  const itemsList = order.items
    .map((item: OrderItemLine) => `  - ${item.product.name} (${item.product.sku}) x${item.quantity} = $${item.totalPrice.toFixed(2)}`)
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
        ${order.items.map((item: { product: { name: string; sku: string }; quantity: number; totalPrice: number }) => `
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

/**
 * Send order shipped notification email
 */
export async function sendOrderShippedEmail(
  to: string,
  orderNumber: string,
  trackingNumber?: string,
  carrier?: string,
  estimatedDelivery?: Date
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const orderUrl = `${baseUrl}/orders/${orderNumber}`

  const subject = `Your Order ${orderNumber} Has Shipped!`
  const text = `
Great news! Your order has shipped.

Order Number: ${orderNumber}
${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}
${carrier ? `Carrier: ${carrier}` : ''}
${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery.toLocaleDateString()}` : ''}

Track your order: ${orderUrl}

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
    <h2 style="margin-top: 0; color: #556B2F;">Your Order Has Shipped! 📦</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
      ${trackingNumber ? `<p style="margin: 5px 0 0;"><strong>Tracking:</strong> ${trackingNumber}</p>` : ''}
      ${carrier ? `<p style="margin: 5px 0 0;"><strong>Carrier:</strong> ${carrier}</p>` : ''}
      ${estimatedDelivery ? `<p style="margin: 5px 0 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString()}</p>` : ''}
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${orderUrl}" style="background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Track Order</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const invoiceUrl = `${baseUrl}/invoices/${invoiceNumber}`

  const subject = `Invoice ${invoiceNumber} - $${amount.toFixed(2)}`
  const text = `
A new invoice has been created for your account.

Invoice Number: ${invoiceNumber}
Amount Due: $${amount.toFixed(2)}
Due Date: ${dueDate.toLocaleDateString()}

View Invoice: ${invoiceUrl}

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
    <h2 style="margin-top: 0; color: #556B2F;">New Invoice</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p style="margin: 5px 0 0;"><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
      <p style="margin: 5px 0 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoiceUrl}" style="background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Invoice</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}

/**
 * Send document expiry notification email
 */
export async function sendDocumentExpiryEmail(
  to: string,
  documentName: string,
  expiresAt: Date,
  daysUntilExpiry: number
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const documentsUrl = `${baseUrl}/documents`

  const urgency = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'important' : 'reminder'
  const urgencyColor = daysUntilExpiry <= 7 ? '#dc2626' : daysUntilExpiry <= 14 ? '#f59e0b' : '#556B2F'

  const subject = `Document Expiring Soon: ${documentName}`
  const text = `
Your document "${documentName}" will expire in ${daysUntilExpiry} days.

Document: ${documentName}
Expiration Date: ${expiresAt.toLocaleDateString()}
Days Remaining: ${daysUntilExpiry}

Please renew or update this document before it expires.

View Documents: ${documentsUrl}

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
  <div style="background: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: ${urgencyColor};">Document Expiring Soon</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
      <p style="margin: 0;"><strong>Document:</strong> ${documentName}</p>
      <p style="margin: 5px 0 0;"><strong>Expiration Date:</strong> ${expiresAt.toLocaleDateString()}</p>
      <p style="margin: 5px 0 0; color: ${urgencyColor}; font-weight: bold;">${daysUntilExpiry} days remaining</p>
    </div>
    <p>Please renew or update this document before it expires to maintain compliance.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${documentsUrl}" style="background: ${urgencyColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Documents</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlertEmail(
  to: string,
  products: Array<{ name: string; sku: string; quantity: number; threshold: number }>
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const inventoryUrl = `${baseUrl}/inventory`

  const subject = `Low Stock Alert: ${products.length} product(s) below threshold`
  const productList = products
    .map((p) => `  - ${p.name} (${p.sku}): ${p.quantity} units (threshold: ${p.threshold})`)
    .join('\n')

  const text = `
Low Stock Alert

The following products are below their minimum stock threshold:

${productList}

Please review and reorder as needed.

View Inventory: ${inventoryUrl}

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
  <div style="background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #f59e0b;">Low Stock Alert ⚠️</h2>
    <p>The following products are below their minimum stock threshold:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Product</th>
          <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Current</th>
          <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Threshold</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((p) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <strong>${p.name}</strong><br>
              <span style="color: #666; font-size: 12px;">${p.sku}</span>
            </td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${p.quantity}</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${p.threshold}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inventoryUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Inventory</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}

/**
 * Send system announcement email
 */
export async function sendSystemAnnouncementEmail(
  to: string,
  title: string,
  body: string,
  type: 'info' | 'warning' | 'alert' | 'maintenance' = 'info'
): Promise<SendResult> {
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'

  const typeConfig = {
    info: { color: '#2563eb', icon: 'ℹ️', label: 'Information' },
    warning: { color: '#f59e0b', icon: '⚠️', label: 'Warning' },
    alert: { color: '#dc2626', icon: '🚨', label: 'Alert' },
    maintenance: { color: '#8b5cf6', icon: '🔧', label: 'Maintenance' },
  }

  const config = typeConfig[type]
  const subject = `[${config.label}] ${title}`

  const text = `
${config.label}: ${title}

${body}

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
  <div style="background: ${config.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: ${config.color};">${config.icon} ${title}</h2>
    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${config.color};">
      <p style="margin: 0; white-space: pre-line;">${body}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}" style="background: ${config.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Go to Portal</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  return sendEmail({ to, subject, text, html })
}
