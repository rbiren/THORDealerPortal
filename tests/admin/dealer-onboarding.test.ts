import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingContactSchema,
  onboardingAddressSchema,
  onboardingStep3Schema,
  fullOnboardingSchema,
} from '@/lib/validations/dealer'

const prisma = new PrismaClient()

describe('Dealer Onboarding Validation', () => {
  describe('Step 1: Basic Info Schema', () => {
    it('validates correct basic info', () => {
      const result = onboardingStep1Schema.safeParse({
        code: 'NEWDEALER01',
        name: 'New Test Dealer',
        tier: 'gold',
        parentDealerId: null,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty code', () => {
      const result = onboardingStep1Schema.safeParse({
        code: '',
        name: 'Test Dealer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects lowercase code', () => {
      const result = onboardingStep1Schema.safeParse({
        code: 'lowercase',
        name: 'Test Dealer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects code with special characters', () => {
      const result = onboardingStep1Schema.safeParse({
        code: 'DLR-001',
        name: 'Test Dealer',
      })
      expect(result.success).toBe(false)
    })

    it('sets default tier to bronze', () => {
      const result = onboardingStep1Schema.safeParse({
        code: 'TEST001',
        name: 'Test Dealer',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tier).toBe('bronze')
      }
    })

    it('accepts valid tier values', () => {
      const tiers = ['platinum', 'gold', 'silver', 'bronze'] as const
      tiers.forEach((tier) => {
        const result = onboardingStep1Schema.safeParse({
          code: 'TEST001',
          name: 'Test Dealer',
          tier,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Step 2: Business Details Schema', () => {
    it('validates empty business details', () => {
      const result = onboardingStep2Schema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates correct EIN format', () => {
      const result = onboardingStep2Schema.safeParse({
        ein: '12-3456789',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid EIN format', () => {
      const result = onboardingStep2Schema.safeParse({
        ein: '123456789',
      })
      expect(result.success).toBe(false)
    })

    it('allows empty EIN', () => {
      const result = onboardingStep2Schema.safeParse({
        ein: '',
      })
      expect(result.success).toBe(true)
    })

    it('validates license number length', () => {
      const result = onboardingStep2Schema.safeParse({
        licenseNumber: 'A'.repeat(51),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Contact Schema', () => {
    it('validates correct contact', () => {
      const result = onboardingContactSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        type: 'primary',
        isPrimary: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = onboardingContactSchema.safeParse({
        name: '',
        email: 'john@example.com',
        type: 'primary',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = onboardingContactSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        type: 'primary',
      })
      expect(result.success).toBe(false)
    })

    it('validates all contact types', () => {
      const types = ['primary', 'billing', 'sales', 'support', 'technical'] as const
      types.forEach((type) => {
        const result = onboardingContactSchema.safeParse({
          name: 'John Doe',
          email: 'john@example.com',
          type,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Address Schema', () => {
    it('validates correct address', () => {
      const result = onboardingAddressSchema.safeParse({
        type: 'billing',
        street: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zipCode: '75001',
        country: 'USA',
        isPrimary: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty street', () => {
      const result = onboardingAddressSchema.safeParse({
        type: 'billing',
        street: '',
        city: 'Anytown',
        state: 'TX',
        zipCode: '75001',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid state code', () => {
      const result = onboardingAddressSchema.safeParse({
        type: 'billing',
        street: '123 Main St',
        city: 'Anytown',
        state: 'Texas',
        zipCode: '75001',
      })
      expect(result.success).toBe(false)
    })

    it('validates all address types', () => {
      const types = ['billing', 'shipping', 'both'] as const
      types.forEach((type) => {
        const result = onboardingAddressSchema.safeParse({
          type,
          street: '123 Main St',
          city: 'Anytown',
          state: 'TX',
          zipCode: '75001',
        })
        expect(result.success).toBe(true)
      })
    })

    it('sets default country to USA', () => {
      const result = onboardingAddressSchema.safeParse({
        type: 'billing',
        street: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zipCode: '75001',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.country).toBe('USA')
      }
    })
  })

  describe('Step 3: Contacts & Addresses Schema', () => {
    it('requires at least one contact', () => {
      const result = onboardingStep3Schema.safeParse({
        contacts: [],
        addresses: [
          {
            type: 'billing',
            street: '123 Main St',
            city: 'Anytown',
            state: 'TX',
            zipCode: '75001',
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('requires at least one address', () => {
      const result = onboardingStep3Schema.safeParse({
        contacts: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            type: 'primary',
          },
        ],
        addresses: [],
      })
      expect(result.success).toBe(false)
    })

    it('validates complete step 3 data', () => {
      const result = onboardingStep3Schema.safeParse({
        contacts: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            type: 'primary',
            isPrimary: true,
          },
        ],
        addresses: [
          {
            type: 'billing',
            street: '123 Main St',
            city: 'Anytown',
            state: 'TX',
            zipCode: '75001',
            isPrimary: true,
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Full Onboarding Schema', () => {
    const validOnboarding = {
      code: 'ONBOARD01',
      name: 'Onboarding Test Dealer',
      tier: 'gold' as const,
      parentDealerId: null,
      ein: '12-3456789',
      licenseNumber: 'LIC-12345',
      insurancePolicy: 'POL-67890',
      contacts: [
        {
          name: 'John Primary',
          email: 'john@dealer.com',
          phone: '555-1234',
          type: 'primary' as const,
          isPrimary: true,
        },
      ],
      addresses: [
        {
          type: 'both' as const,
          street: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75001',
          country: 'USA',
          isPrimary: true,
        },
      ],
    }

    it('validates complete onboarding data', () => {
      const result = fullOnboardingSchema.safeParse(validOnboarding)
      expect(result.success).toBe(true)
    })

    it('rejects missing required fields', () => {
      const result = fullOnboardingSchema.safeParse({
        name: 'Test Dealer',
      })
      expect(result.success).toBe(false)
    })

    it('validates with multiple contacts and addresses', () => {
      const result = fullOnboardingSchema.safeParse({
        ...validOnboarding,
        contacts: [
          { name: 'John', email: 'john@test.com', type: 'primary' as const, isPrimary: true },
          { name: 'Jane', email: 'jane@test.com', type: 'billing' as const, isPrimary: false },
        ],
        addresses: [
          {
            type: 'billing' as const,
            street: '123 Main',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75001',
            isPrimary: true,
          },
          {
            type: 'shipping' as const,
            street: '456 Ship Ave',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75002',
            isPrimary: false,
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Dealer Onboarding Integration', () => {
  const testDealerCodes: string[] = []

  afterAll(async () => {
    // Clean up test data
    for (const code of testDealerCodes) {
      const dealer = await prisma.dealer.findUnique({ where: { code } })
      if (dealer) {
        await prisma.dealerAddress.deleteMany({ where: { dealerId: dealer.id } })
        await prisma.dealerContact.deleteMany({ where: { dealerId: dealer.id } })
        await prisma.dealer.delete({ where: { code } })
      }
    }
    await prisma.$disconnect()
  })

  it('can create dealer with contacts and addresses', async () => {
    const code = 'INTEGTEST01'
    testDealerCodes.push(code)

    const dealer = await prisma.$transaction(async (tx) => {
      const newDealer = await tx.dealer.create({
        data: {
          code,
          name: 'Integration Test Dealer',
          tier: 'gold',
          status: 'pending',
          ein: '99-8765432',
        },
      })

      await tx.dealerContact.create({
        data: {
          dealerId: newDealer.id,
          name: 'Test Contact',
          email: 'test@integration.com',
          type: 'primary',
          isPrimary: true,
        },
      })

      await tx.dealerAddress.create({
        data: {
          dealerId: newDealer.id,
          type: 'billing',
          street: '789 Test Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'USA',
          isPrimary: true,
        },
      })

      return newDealer
    })

    expect(dealer).toBeDefined()
    expect(dealer.code).toBe(code)
    expect(dealer.status).toBe('pending')

    // Verify contacts
    const contacts = await prisma.dealerContact.findMany({
      where: { dealerId: dealer.id },
    })
    expect(contacts.length).toBe(1)
    expect(contacts[0].name).toBe('Test Contact')

    // Verify addresses
    const addresses = await prisma.dealerAddress.findMany({
      where: { dealerId: dealer.id },
    })
    expect(addresses.length).toBe(1)
    expect(addresses[0].city).toBe('Austin')
  })

  it('enforces unique dealer code constraint', async () => {
    const code = 'UNIQUETEST'
    testDealerCodes.push(code)

    await prisma.dealer.create({
      data: {
        code,
        name: 'First Dealer',
        tier: 'bronze',
        status: 'pending',
      },
    })

    await expect(
      prisma.dealer.create({
        data: {
          code,
          name: 'Duplicate Dealer',
          tier: 'bronze',
          status: 'pending',
        },
      })
    ).rejects.toThrow()
  })

  it('can set parent dealer relationship', async () => {
    const parentCode = 'PARENTOB'
    const childCode = 'CHILDOB'
    testDealerCodes.push(parentCode, childCode)

    const parent = await prisma.dealer.create({
      data: {
        code: parentCode,
        name: 'Parent Onboarding Dealer',
        tier: 'platinum',
        status: 'active',
      },
    })

    const child = await prisma.dealer.create({
      data: {
        code: childCode,
        name: 'Child Onboarding Dealer',
        tier: 'bronze',
        status: 'pending',
        parentDealerId: parent.id,
      },
    })

    expect(child.parentDealerId).toBe(parent.id)

    const childWithParent = await prisma.dealer.findUnique({
      where: { id: child.id },
      include: { parentDealer: true },
    })

    expect(childWithParent?.parentDealer?.code).toBe(parentCode)
  })

  it('can create dealer with multiple contacts', async () => {
    const code = 'MULTICONTACT'
    testDealerCodes.push(code)

    const dealer = await prisma.dealer.create({
      data: {
        code,
        name: 'Multi Contact Dealer',
        tier: 'silver',
        status: 'pending',
      },
    })

    await prisma.dealerContact.createMany({
      data: [
        {
          dealerId: dealer.id,
          name: 'Primary Contact',
          email: 'primary@test.com',
          type: 'primary',
          isPrimary: true,
        },
        {
          dealerId: dealer.id,
          name: 'Billing Contact',
          email: 'billing@test.com',
          type: 'billing',
          isPrimary: false,
        },
        {
          dealerId: dealer.id,
          name: 'Support Contact',
          email: 'support@test.com',
          type: 'support',
          isPrimary: false,
        },
      ],
    })

    const contacts = await prisma.dealerContact.findMany({
      where: { dealerId: dealer.id },
    })

    expect(contacts.length).toBe(3)
    expect(contacts.filter((c) => c.isPrimary).length).toBe(1)
  })

  it('can create dealer with multiple addresses', async () => {
    const code = 'MULTIADDR'
    testDealerCodes.push(code)

    const dealer = await prisma.dealer.create({
      data: {
        code,
        name: 'Multi Address Dealer',
        tier: 'gold',
        status: 'pending',
      },
    })

    await prisma.dealerAddress.createMany({
      data: [
        {
          dealerId: dealer.id,
          type: 'billing',
          street: '100 Billing St',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
          isPrimary: true,
        },
        {
          dealerId: dealer.id,
          type: 'shipping',
          street: '200 Shipping Ave',
          city: 'Houston',
          state: 'TX',
          zipCode: '77002',
          country: 'USA',
          isPrimary: false,
        },
      ],
    })

    const addresses = await prisma.dealerAddress.findMany({
      where: { dealerId: dealer.id },
    })

    expect(addresses.length).toBe(2)
    expect(addresses.map((a) => a.type)).toContain('billing')
    expect(addresses.map((a) => a.type)).toContain('shipping')
  })
})
