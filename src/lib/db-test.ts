import { PrismaClient } from '@prisma/client'

// Test database client - uses test.db
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db',
    },
  },
})

export default testPrisma
