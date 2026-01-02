import prisma from '@/lib/db'
import crypto from 'crypto'

const TOKEN_EXPIRY_HOURS = 1

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a password reset request
 * Returns the token if user exists, null otherwise (to prevent email enumeration)
 */
export async function createPasswordResetRequest(
  email: string
): Promise<{ token: string; expiresAt: Date } | null> {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    // Don't reveal whether user exists
    return null
  }

  // Invalidate any existing reset tokens for this email
  await prisma.passwordReset.updateMany({
    where: {
      email: email.toLowerCase(),
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  })

  // Create new reset token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.passwordReset.create({
    data: {
      email: email.toLowerCase(),
      token,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(
  token: string
): Promise<{ valid: true; email: string } | { valid: false; error: string }> {
  const reset = await prisma.passwordReset.findUnique({
    where: { token },
  })

  if (!reset) {
    return { valid: false, error: 'Invalid reset link' }
  }

  if (reset.usedAt) {
    return { valid: false, error: 'This reset link has already been used' }
  }

  if (reset.expiresAt < new Date()) {
    return { valid: false, error: 'This reset link has expired' }
  }

  return { valid: true, email: reset.email }
}

/**
 * Complete password reset - update password and mark token as used
 */
export async function completePasswordReset(
  token: string,
  hashedPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const validation = await validateResetToken(token)

  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Update user password
  const user = await prisma.user.findUnique({
    where: { email: validation.email },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // Use a transaction to update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true }
}

/**
 * Get reset request details (for displaying to user)
 */
export async function getResetRequestInfo(token: string): Promise<{
  valid: boolean
  email?: string
  expiresAt?: Date
  error?: string
}> {
  const reset = await prisma.passwordReset.findUnique({
    where: { token },
  })

  if (!reset) {
    return { valid: false, error: 'Invalid reset link' }
  }

  if (reset.usedAt) {
    return { valid: false, error: 'This reset link has already been used' }
  }

  if (reset.expiresAt < new Date()) {
    return { valid: false, error: 'This reset link has expired' }
  }

  // Mask email for privacy
  const emailParts = reset.email.split('@')
  const maskedEmail =
    emailParts[0].substring(0, 2) +
    '***@' +
    emailParts[1]

  return {
    valid: true,
    email: maskedEmail,
    expiresAt: reset.expiresAt,
  }
}
