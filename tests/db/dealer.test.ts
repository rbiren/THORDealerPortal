import { prisma } from '../setup'

describe('Dealer Model', () => {
  it('should create a dealer', async () => {
    const dealer = await prisma.dealer.create({
      data: {
        code: 'TEST-001',
        name: 'Test Dealer',
        status: 'active',
        tier: 'gold',
      },
    })

    expect(dealer.id).toBeDefined()
    expect(dealer.code).toBe('TEST-001')
    expect(dealer.name).toBe('Test Dealer')
    expect(dealer.status).toBe('active')
    expect(dealer.tier).toBe('gold')
  })

  it('should create dealer with contacts and addresses', async () => {
    const dealer = await prisma.dealer.create({
      data: {
        code: 'TEST-002',
        name: 'Full Dealer',
        contacts: {
          create: {
            type: 'primary',
            name: 'John Doe',
            email: 'john@test.com',
            phone: '555-1234',
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: 'billing',
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            isPrimary: true,
          },
        },
      },
      include: {
        contacts: true,
        addresses: true,
      },
    })

    expect(dealer.contacts).toHaveLength(1)
    expect(dealer.contacts[0].name).toBe('John Doe')
    expect(dealer.addresses).toHaveLength(1)
    expect(dealer.addresses[0].city).toBe('Test City')
  })

  it('should enforce unique dealer code', async () => {
    await prisma.dealer.create({
      data: {
        code: 'UNIQUE-001',
        name: 'First Dealer',
      },
    })

    await expect(
      prisma.dealer.create({
        data: {
          code: 'UNIQUE-001',
          name: 'Second Dealer',
        },
      })
    ).rejects.toThrow()
  })

  it('should support dealer hierarchy', async () => {
    const parent = await prisma.dealer.create({
      data: {
        code: 'PARENT-001',
        name: 'Parent Dealer',
        tier: 'platinum',
      },
    })

    const child = await prisma.dealer.create({
      data: {
        code: 'CHILD-001',
        name: 'Child Dealer',
        tier: 'gold',
        parentDealerId: parent.id,
      },
    })

    const parentWithChildren = await prisma.dealer.findUnique({
      where: { id: parent.id },
      include: { childDealers: true },
    })

    expect(parentWithChildren?.childDealers).toHaveLength(1)
    expect(parentWithChildren?.childDealers[0].code).toBe('CHILD-001')
  })
})
