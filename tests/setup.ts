import { PrismaClient } from '@prisma/client'

// Use a separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/test.db',
    },
  },
})

// Clean database before each test
beforeEach(async () => {
  // Delete in order of dependencies
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.document.deleteMany()
  await prisma.orderStatusHistory.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.inventoryLocation.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.dealerAddress.deleteMany()
  await prisma.dealerContact.deleteMany()
  await prisma.session.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.user.deleteMany()
  await prisma.dealer.deleteMany()
})

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect()
})

export { prisma }
