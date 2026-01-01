import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { changePasswordSchema } from '@/lib/validations/password'

const prisma = new PrismaClient()

describe('Password Change Validation', () => {
  describe('changePasswordSchema', () => {
    it('validates correct password change data', () => {
      const validData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      }
      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects empty current password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('currentPassword'))).toBe(true)
      }
    })

    it('rejects short new password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'Short1',
        confirmPassword: 'Short1',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without uppercase', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without lowercase', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'NEWPASSWORD123',
        confirmPassword: 'NEWPASSWORD123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without numbers', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPasswordNoNum',
        confirmPassword: 'NewPasswordNoNum',
      })
      expect(result.success).toBe(false)
    })

    it('rejects mismatched passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'DifferentPassword789',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('match'))).toBe(true)
      }
    })

    it('rejects same password as current', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'SamePassword123',
        newPassword: 'SamePassword123',
        confirmPassword: 'SamePassword123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('different'))).toBe(true)
      }
    })
  })
})

describe('Password Change Integration', () => {
  let testUserId: string

  beforeAll(async () => {
    // Create test user with known password
    const hashedPassword = await bcrypt.hash('CurrentPassword123', 12)
    const user = await prisma.user.create({
      data: {
        email: 'password-change-test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Password',
        lastName: 'Test',
        role: 'dealer_user',
        status: 'active',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'password-change-test@example.com' },
    })
    await prisma.$disconnect()
  })

  it('verifies current password is correct', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    })
    expect(user).not.toBeNull()

    const isValid = await bcrypt.compare('CurrentPassword123', user!.passwordHash)
    expect(isValid).toBe(true)
  })

  it('updates password hash when changed', async () => {
    const newPassword = 'NewSecurePassword456'
    const newHash = await bcrypt.hash(newPassword, 12)

    const updated = await prisma.user.update({
      where: { id: testUserId },
      data: { passwordHash: newHash },
    })

    expect(updated).not.toBeNull()

    // Verify old password no longer works
    const oldValid = await bcrypt.compare('CurrentPassword123', updated.passwordHash)
    expect(oldValid).toBe(false)

    // Verify new password works
    const newValid = await bcrypt.compare(newPassword, updated.passwordHash)
    expect(newValid).toBe(true)
  })

  it('rejects incorrect current password', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    })

    const isValid = await bcrypt.compare('WrongPassword', user!.passwordHash)
    expect(isValid).toBe(false)
  })
})
