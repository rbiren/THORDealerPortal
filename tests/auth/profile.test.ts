import { updateProfileSchema } from '@/lib/validations/profile'
import { prisma } from '../setup'
import bcrypt from 'bcryptjs'

describe('Profile Validation', () => {
  describe('updateProfileSchema', () => {
    it('should validate correct profile data', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-123-4567',
      })
      expect(result.success).toBe(true)
    })

    it('should validate without phone', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
      })
      expect(result.success).toBe(true)
    })

    it('should validate with empty phone', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty first name', () => {
      const result = updateProfileSchema.safeParse({
        firstName: '',
        lastName: 'Doe',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.firstName).toContain(
          'First name is required'
        )
      }
    })

    it('should reject empty last name', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.lastName).toContain(
          'Last name is required'
        )
      }
    })

    it('should reject first name over 50 characters', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'a'.repeat(51),
        lastName: 'Doe',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.firstName).toContain(
          'First name must be less than 50 characters'
        )
      }
    })

    it('should reject last name over 50 characters', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: 'a'.repeat(51),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.lastName).toContain(
          'Last name must be less than 50 characters'
        )
      }
    })

    it('should reject phone over 20 characters', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '1'.repeat(21),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.phone).toContain(
          'Phone number must be less than 20 characters'
        )
      }
    })
  })
})

describe('Profile Database Operations', () => {
  const testEmail = 'profile-test@example.com'

  beforeEach(async () => {
    // Clean up existing test data first
    await prisma.user.deleteMany({ where: { email: testEmail } })
    await prisma.dealer.deleteMany({ where: { code: 'PROF-DLR' } })

    const passwordHash = await bcrypt.hash('TestPassword123!', 12)
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Original',
        lastName: 'Name',
        role: 'dealer_user',
        status: 'active',
      },
    })
  })

  it('should update user profile', async () => {
    await prisma.user.update({
      where: { email: testEmail },
      data: {
        firstName: 'Updated',
        lastName: 'User',
        phone: '555-123-4567',
      },
    })

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    expect(user?.firstName).toBe('Updated')
    expect(user?.lastName).toBe('User')
    expect(user?.phone).toBe('555-123-4567')
  })

  it('should clear phone when set to null', async () => {
    // First set a phone
    await prisma.user.update({
      where: { email: testEmail },
      data: { phone: '555-123-4567' },
    })

    // Then clear it
    await prisma.user.update({
      where: { email: testEmail },
      data: { phone: null },
    })

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    expect(user?.phone).toBeNull()
  })

  it('should include dealer info in profile query', async () => {
    // Create dealer first
    const dealer = await prisma.dealer.create({
      data: {
        code: 'PROF-001',
        name: 'Profile Test Dealer',
        tier: 'gold',
      },
    })

    // Associate user with dealer
    await prisma.user.update({
      where: { email: testEmail },
      data: { dealerId: dealer.id },
    })

    // Query with dealer include
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            tier: true,
          },
        },
      },
    })

    expect(user?.dealer).not.toBeNull()
    expect(user?.dealer?.name).toBe('Profile Test Dealer')
    expect(user?.dealer?.tier).toBe('gold')
  })
})
