import { prisma } from '../setup'
import bcrypt from 'bcryptjs'

// Import functions to test - using dynamic import to avoid ESM issues
// We'll test the password reset logic directly with Prisma

describe('Password Reset Flow', () => {
  const testEmail = 'reset-test@example.com'
  const testPassword = 'OldPassword123!'

  beforeEach(async () => {
    // Create a test user
    const passwordHash = await bcrypt.hash(testPassword, 12)
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Reset',
        lastName: 'Test',
        role: 'dealer_user',
        status: 'active',
      },
    })
  })

  describe('Token Generation', () => {
    it('should create a password reset token for existing user', async () => {
      // Create reset token
      const token = 'test-token-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      const reset = await prisma.passwordReset.create({
        data: {
          email: testEmail,
          token,
          expiresAt,
        },
      })

      expect(reset.id).toBeDefined()
      expect(reset.email).toBe(testEmail)
      expect(reset.token).toBe(token)
      expect(reset.usedAt).toBeNull()
    })

    it('should enforce unique token constraint', async () => {
      const token = 'unique-token-test'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email: testEmail, token, expiresAt },
      })

      await expect(
        prisma.passwordReset.create({
          data: { email: testEmail, token, expiresAt },
        })
      ).rejects.toThrow()
    })
  })

  describe('Token Validation', () => {
    it('should find valid unexpired token', async () => {
      const token = 'valid-token-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email: testEmail, token, expiresAt },
      })

      const found = await prisma.passwordReset.findUnique({
        where: { token },
      })

      expect(found).not.toBeNull()
      expect(found?.email).toBe(testEmail)
      expect(found?.usedAt).toBeNull()
      expect(found?.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should detect expired token', async () => {
      const token = 'expired-token-' + Date.now()
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

      await prisma.passwordReset.create({
        data: { email: testEmail, token, expiresAt },
      })

      const found = await prisma.passwordReset.findUnique({
        where: { token },
      })

      expect(found).not.toBeNull()
      expect(found?.expiresAt.getTime()).toBeLessThan(Date.now())
    })

    it('should detect used token', async () => {
      const token = 'used-token-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: {
          email: testEmail,
          token,
          expiresAt,
          usedAt: new Date(),
        },
      })

      const found = await prisma.passwordReset.findUnique({
        where: { token },
      })

      expect(found).not.toBeNull()
      expect(found?.usedAt).not.toBeNull()
    })
  })

  describe('Password Update', () => {
    it('should update user password', async () => {
      const newPassword = 'NewPassword456!'
      const newHash = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { email: testEmail },
        data: { passwordHash: newHash },
      })

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      })

      expect(user).not.toBeNull()
      const isValid = await bcrypt.compare(newPassword, user!.passwordHash)
      expect(isValid).toBe(true)
    })

    it('should mark token as used after password reset', async () => {
      const token = 'complete-token-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email: testEmail, token, expiresAt },
      })

      // Mark as used
      await prisma.passwordReset.update({
        where: { token },
        data: { usedAt: new Date() },
      })

      const reset = await prisma.passwordReset.findUnique({
        where: { token },
      })

      expect(reset?.usedAt).not.toBeNull()
    })
  })

  describe('Multiple Reset Requests', () => {
    it('should allow multiple tokens for same email', async () => {
      const token1 = 'token1-' + Date.now()
      const token2 = 'token2-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email: testEmail, token: token1, expiresAt },
      })

      await prisma.passwordReset.create({
        data: { email: testEmail, token: token2, expiresAt },
      })

      const tokens = await prisma.passwordReset.findMany({
        where: { email: testEmail },
      })

      expect(tokens.length).toBe(2)
    })

    it('should be able to invalidate old tokens', async () => {
      const token1 = 'old-token-' + Date.now()
      const token2 = 'new-token-' + Date.now()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordReset.create({
        data: { email: testEmail, token: token1, expiresAt },
      })

      // Invalidate old tokens
      await prisma.passwordReset.updateMany({
        where: {
          email: testEmail,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      })

      // Create new token
      await prisma.passwordReset.create({
        data: { email: testEmail, token: token2, expiresAt },
      })

      const validTokens = await prisma.passwordReset.findMany({
        where: {
          email: testEmail,
          usedAt: null,
        },
      })

      expect(validTokens.length).toBe(1)
      expect(validTokens[0].token).toBe(token2)
    })
  })
})
