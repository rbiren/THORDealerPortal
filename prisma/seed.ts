import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default password for seed users (only for development)
const DEFAULT_PASSWORD = 'Password123!'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
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

  console.log('🧹 Cleaned existing data')

  // Create Inventory Locations
  const warehouse = await prisma.inventoryLocation.create({
    data: {
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      type: 'warehouse',
      address: '123 Industrial Blvd, Chicago, IL 60601',
    },
  })

  const distCenter = await prisma.inventoryLocation.create({
    data: {
      name: 'East Distribution Center',
      code: 'DC-EAST',
      type: 'distribution_center',
      address: '456 Logistics Way, Newark, NJ 07102',
    },
  })

  console.log('📍 Created inventory locations')

  // Create Product Categories
  const partsCategory = await prisma.productCategory.create({
    data: {
      name: 'Parts',
      slug: 'parts',
      description: 'Replacement and upgrade parts',
    },
  })

  const accessoriesCategory = await prisma.productCategory.create({
    data: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Add-on accessories and upgrades',
    },
  })

  const electronicsCategory = await prisma.productCategory.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic components and systems',
      parentId: accessoriesCategory.id,
    },
  })

  console.log('📁 Created product categories')

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'PRT-001',
        name: 'Premium Brake Pad Set',
        description: 'High-performance brake pads for all models',
        categoryId: partsCategory.id,
        price: 89.99,
        costPrice: 45.00,
        status: 'active',
        specifications: JSON.stringify({ material: 'ceramic', warranty: '2 years' }),
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PRT-002',
        name: 'Oil Filter - Standard',
        description: 'OEM-quality oil filter',
        categoryId: partsCategory.id,
        price: 12.99,
        costPrice: 5.50,
        status: 'active',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ACC-001',
        name: 'LED Light Bar - 20 inch',
        description: 'High-intensity LED light bar for off-road use',
        categoryId: electronicsCategory.id,
        price: 249.99,
        costPrice: 120.00,
        status: 'active',
        specifications: JSON.stringify({ lumens: 12000, voltage: '12V', waterproof: 'IP67' }),
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ACC-002',
        name: 'Backup Camera System',
        description: 'Wireless backup camera with LCD display',
        categoryId: electronicsCategory.id,
        price: 179.99,
        costPrice: 85.00,
        status: 'active',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PRT-003',
        name: 'Air Filter - Performance',
        description: 'Reusable high-flow air filter',
        categoryId: partsCategory.id,
        price: 54.99,
        costPrice: 25.00,
        status: 'active',
      },
    }),
  ])

  console.log('📦 Created products')

  // Create Inventory for products
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: warehouse.id,
        quantity: Math.floor(Math.random() * 100) + 20,
        reserved: 0,
        lowStockThreshold: 10,
      },
    })
    await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: distCenter.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        reserved: 0,
        lowStockThreshold: 5,
      },
    })
  }

  console.log('📊 Created inventory records')

  // Create Dealers
  const dealers = await Promise.all([
    prisma.dealer.create({
      data: {
        code: 'DLR-001',
        name: 'Midwest Motors',
        status: 'active',
        tier: 'platinum',
        ein: '12-3456789',
        contacts: {
          create: {
            type: 'primary',
            name: 'John Smith',
            email: 'john@midwestmotors.com',
            phone: '312-555-0100',
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: 'billing',
            street: '100 Main Street',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            isPrimary: true,
          },
        },
      },
    }),
    prisma.dealer.create({
      data: {
        code: 'DLR-002',
        name: 'East Coast Auto Group',
        status: 'active',
        tier: 'gold',
        contacts: {
          create: {
            type: 'primary',
            name: 'Sarah Johnson',
            email: 'sarah@eastcoastauto.com',
            phone: '212-555-0200',
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: 'billing',
            street: '200 Broadway',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            isPrimary: true,
          },
        },
      },
    }),
    prisma.dealer.create({
      data: {
        code: 'DLR-003',
        name: 'Pacific Auto Parts',
        status: 'active',
        tier: 'silver',
        contacts: {
          create: {
            type: 'primary',
            name: 'Mike Chen',
            email: 'mike@pacificauto.com',
            phone: '415-555-0300',
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: 'billing',
            street: '300 Market Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            isPrimary: true,
          },
        },
      },
    }),
    prisma.dealer.create({
      data: {
        code: 'DLR-004',
        name: 'Southern Supply Co',
        status: 'pending',
        tier: 'bronze',
        contacts: {
          create: {
            type: 'primary',
            name: 'Lisa Brown',
            email: 'lisa@southernsupply.com',
            phone: '404-555-0400',
            isPrimary: true,
          },
        },
        addresses: {
          create: {
            type: 'billing',
            street: '400 Peachtree Street',
            city: 'Atlanta',
            state: 'GA',
            zipCode: '30301',
            isPrimary: true,
          },
        },
      },
    }),
  ])

  console.log('🏢 Created dealers')

  // Create Users with properly hashed passwords
  const passwordHash = await hashPassword(DEFAULT_PASSWORD)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@thordealer.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      status: 'active',
    },
  })

  const dealerUsers = await Promise.all(
    dealers.slice(0, 3).map((dealer, index) =>
      prisma.user.create({
        data: {
          email: `dealer${index + 1}@example.com`,
          passwordHash,
          firstName: `Dealer`,
          lastName: `User ${index + 1}`,
          role: 'dealer_admin',
          status: 'active',
          dealerId: dealer.id,
        },
      })
    )
  )

  console.log('👤 Created users')

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0001',
      dealerId: dealers[0].id,
      status: 'delivered',
      subtotal: 352.97,
      taxAmount: 28.24,
      shippingAmount: 15.00,
      totalAmount: 396.21,
      poNumber: 'PO-MM-1234',
      shippingAddress: JSON.stringify({
        street: '100 Main Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
      }),
      submittedAt: new Date('2026-01-15'),
      confirmedAt: new Date('2026-01-15'),
      shippedAt: new Date('2026-01-17'),
      deliveredAt: new Date('2026-01-20'),
      items: {
        create: [
          { productId: products[0].id, quantity: 2, unitPrice: 89.99, totalPrice: 179.98 },
          { productId: products[2].id, quantity: 1, unitPrice: 249.99, totalPrice: 249.99 },
        ],
      },
      statusHistory: {
        create: [
          { status: 'submitted', note: 'Order placed' },
          { status: 'confirmed', note: 'Payment verified' },
          { status: 'shipped', note: 'Shipped via FedEx' },
          { status: 'delivered', note: 'Delivered to customer' },
        ],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0002',
      dealerId: dealers[1].id,
      status: 'processing',
      subtotal: 192.98,
      taxAmount: 15.44,
      shippingAmount: 10.00,
      totalAmount: 218.42,
      poNumber: 'PO-ECA-5678',
      submittedAt: new Date('2026-01-28'),
      confirmedAt: new Date('2026-01-28'),
      items: {
        create: [
          { productId: products[3].id, quantity: 1, unitPrice: 179.99, totalPrice: 179.99 },
          { productId: products[1].id, quantity: 1, unitPrice: 12.99, totalPrice: 12.99 },
        ],
      },
      statusHistory: {
        create: [
          { status: 'submitted', note: 'Order placed' },
          { status: 'confirmed', note: 'Payment verified' },
          { status: 'processing', note: 'Preparing for shipment' },
        ],
      },
    },
  })

  console.log('🛒 Created orders')

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: dealerUsers[0].id,
        type: 'order_update',
        title: 'Order Delivered',
        body: 'Your order ORD-2026-0001 has been delivered.',
        readAt: new Date(),
      },
      {
        userId: dealerUsers[1].id,
        type: 'order_update',
        title: 'Order Processing',
        body: 'Your order ORD-2026-0002 is being processed.',
      },
      {
        userId: adminUser.id,
        type: 'low_stock',
        title: 'Low Stock Alert',
        body: 'Oil Filter - Standard is running low in Main Warehouse.',
      },
    ],
  })

  console.log('🔔 Created notifications')

  // Create audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'create',
        entityType: 'Dealer',
        entityId: dealers[0].id,
        newValues: JSON.stringify({ name: 'Midwest Motors', tier: 'platinum' }),
      },
      {
        userId: dealerUsers[0].id,
        action: 'create',
        entityType: 'Order',
        entityId: order1.id,
        newValues: JSON.stringify({ orderNumber: 'ORD-2026-0001' }),
      },
    ],
  })

  console.log('📝 Created audit logs')

  console.log('✅ Seed completed successfully!')
  console.log(`
Summary:
- ${await prisma.dealer.count()} Dealers
- ${await prisma.user.count()} Users
- ${await prisma.product.count()} Products
- ${await prisma.inventory.count()} Inventory records
- ${await prisma.order.count()} Orders
- ${await prisma.notification.count()} Notifications
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
