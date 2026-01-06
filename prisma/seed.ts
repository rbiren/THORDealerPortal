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

  // Clean existing data - order matters for foreign keys!
  // Using exact model names from schema.prisma

  // Forum
  await prisma.forumReplyLike.deleteMany()
  await prisma.forumPostLike.deleteMany()
  await prisma.forumReply.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.forumCategory.deleteMany()

  // Marketing
  await prisma.marketingAssetDownload.deleteMany()
  await prisma.campaignTemplate.deleteMany()
  await prisma.marketingAsset.deleteMany()
  await prisma.marketingAssetCategory.deleteMany()

  // Parts & Service
  await prisma.recallDealerNotification.deleteMany()
  await prisma.recallNotice.deleteMany()
  await prisma.serviceBulletinAcknowledgment.deleteMany()
  await prisma.serviceBulletin.deleteMany()
  await prisma.partsOrderItem.deleteMany()
  await prisma.partsOrder.deleteMany()
  await prisma.part.deleteMany()
  await prisma.partCategory.deleteMany()

  // Scorecard
  await prisma.tierThreshold.deleteMany()
  await prisma.scoreWeight.deleteMany()
  await prisma.salesTarget.deleteMany()
  await prisma.performanceMetric.deleteMany()
  await prisma.dealerScorecard.deleteMany()

  // Training
  await prisma.certification.deleteMany()
  await prisma.courseProgress.deleteMany()
  await prisma.trainingAssignment.deleteMany()
  await prisma.quizQuestion.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.courseContent.deleteMany()
  await prisma.trainingCourse.deleteMany()

  // Incentives
  await prisma.incentivePayout.deleteMany()
  await prisma.incentiveClaimDocument.deleteMany()
  await prisma.incentiveClaim.deleteMany()
  await prisma.rebateAccrual.deleteMany()
  await prisma.dealerProgramEnrollment.deleteMany()
  await prisma.incentiveProgram.deleteMany()

  // Knowledge base
  await prisma.knowledgeArticle.deleteMany()
  await prisma.knowledgeCategory.deleteMany()

  // Support tickets
  await prisma.ticketAttachment.deleteMany()
  await prisma.ticketMessage.deleteMany()
  await prisma.supportTicket.deleteMany()

  // Warranty
  await prisma.warrantyClaimStatusHistory.deleteMany()
  await prisma.warrantyClaimNote.deleteMany()
  await prisma.warrantyClaimAttachment.deleteMany()
  await prisma.warrantyClaimItem.deleteMany()
  await prisma.warrantyClaim.deleteMany()

  // Announcements & Notifications
  await prisma.announcementReadReceipt.deleteMany()
  await prisma.systemAnnouncement.deleteMany()
  await prisma.notificationPreference.deleteMany()
  await prisma.notification.deleteMany()

  // Documents
  await prisma.documentExpiryReminder.deleteMany()
  await prisma.documentAccessLog.deleteMany()
  await prisma.document.deleteMany()

  // Forecasting
  await prisma.marketIndicator.deleteMany()
  await prisma.seasonalPattern.deleteMany()
  await prisma.suggestedOrder.deleteMany()
  await prisma.demandForecast.deleteMany()
  await prisma.forecastConfig.deleteMany()

  // Orders and invoices
  await prisma.orderNote.deleteMany()
  await prisma.orderStatusHistory.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.order.deleteMany()

  // Cart
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()

  // Inventory
  await prisma.inventory.deleteMany()
  await prisma.inventoryLocation.deleteMany()

  // Products
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()

  // Audit log
  await prisma.auditLog.deleteMany()

  // Dealers and users
  await prisma.dealerAddress.deleteMany()
  await prisma.dealerContact.deleteMany()
  await prisma.session.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.user.deleteMany()
  await prisma.dealer.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create Forum Categories
  const forumCategories = await Promise.all([
    prisma.forumCategory.create({
      data: {
        name: 'General Discussion',
        slug: 'general',
        description: 'General topics and conversations about dealership operations',
        icon: 'MessageSquare',
        color: '#3B82F6',
        targetAudience: 'all',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Product Questions',
        slug: 'products',
        description: 'Ask questions about THOR products, features, and specifications',
        icon: 'HelpCircle',
        color: '#8B5CF6',
        targetAudience: 'all',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Sales Tips & Strategies',
        slug: 'sales',
        description: 'Share sales strategies, closing techniques, and success stories',
        icon: 'TrendingUp',
        color: '#10B981',
        targetAudience: 'all',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Service & Warranty',
        slug: 'service',
        description: 'Discuss service issues, warranty claims, and technical support',
        icon: 'Wrench',
        color: '#F59E0B',
        targetAudience: 'all',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Announcements',
        slug: 'announcements',
        description: 'Official announcements from THOR Industries',
        icon: 'Megaphone',
        color: '#EF4444',
        targetAudience: 'all',
        sortOrder: 0,
        isActive: true,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Tips & Best Practices',
        slug: 'tips',
        description: 'Share helpful tips and best practices with the dealer community',
        icon: 'Lightbulb',
        color: '#F97316',
        targetAudience: 'all',
        sortOrder: 5,
        isActive: true,
      },
    }),
  ])

  console.log('💬 Created forum categories')

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

  // Create sample forum posts
  const forumPosts = await Promise.all([
    prisma.forumPost.create({
      data: {
        categoryId: forumCategories[0].id, // General Discussion
        authorId: dealerUsers[0].id,
        dealerId: dealers[0].id,
        title: 'Tips for winter RV storage preparation',
        content: `Hi everyone! With winter approaching, I wanted to share some tips we've found helpful for preparing RVs for winter storage:

1. **Drain all water systems** - This includes fresh water tank, water heater, and all lines
2. **Add RV antifreeze** - Use non-toxic antifreeze in all drains and toilet
3. **Remove batteries** - Store in a warm, dry place and keep charged
4. **Cover tires** - Protect from UV damage with tire covers
5. **Ventilate the interior** - Leave vents cracked to prevent moisture buildup

What other tips do you recommend to customers? Would love to hear what works for your dealerships!`,
        excerpt: 'With winter approaching, I wanted to share some tips for preparing RVs for winter storage including draining water systems, adding antifreeze, and more...',
        postType: 'discussion',
        tags: JSON.stringify(['winter', 'storage', 'maintenance', 'tips']),
        status: 'published',
        isPinned: true,
        viewCount: 245,
        replyCount: 8,
        likeCount: 32,
        lastReplyAt: new Date('2026-01-05T14:30:00Z'),
      },
    }),
    prisma.forumPost.create({
      data: {
        categoryId: forumCategories[1].id, // Product Questions
        authorId: dealerUsers[1].id,
        dealerId: dealers[1].id,
        title: 'Question about 2026 Jayco North Point suspension upgrades',
        content: `Has anyone gotten details on the suspension upgrades in the 2026 Jayco North Point lineup?

A customer is asking about the differences between the MORryde IS suspension and the new upgraded option. Specifically:
- Weight capacity differences
- Ride quality improvements
- Warranty coverage

Any insights from those who've had customers with both versions would be greatly appreciated!`,
        excerpt: 'Has anyone gotten details on the suspension upgrades in the 2026 Jayco North Point lineup? A customer is asking about the differences...',
        postType: 'question',
        tags: JSON.stringify(['jayco', 'north-point', 'suspension', '2026']),
        status: 'published',
        isResolved: false,
        viewCount: 127,
        replyCount: 4,
        likeCount: 15,
        lastReplyAt: new Date('2026-01-04T09:15:00Z'),
      },
    }),
    prisma.forumPost.create({
      data: {
        categoryId: forumCategories[2].id, // Sales Tips
        authorId: dealerUsers[0].id,
        dealerId: dealers[0].id,
        title: 'Successful financing strategies for first-time RV buyers',
        content: `Wanted to share what's been working for us with first-time RV buyers who are nervous about financing:

**Key Strategies:**
1. Walk through the total cost of ownership, not just monthly payments
2. Compare RV camping costs vs hotel stays - the math often surprises them
3. Partner with multiple lenders to find the best rates for different credit profiles
4. Offer extended warranties as part of the financing discussion
5. Create a "first year owner" checklist to build confidence

We've seen a 23% increase in first-time buyer conversions since implementing these strategies last quarter.

What approaches have worked for your teams?`,
        excerpt: 'Wanted to share what has been working for us with first-time RV buyers who are nervous about financing...',
        postType: 'tip',
        tags: JSON.stringify(['sales', 'financing', 'first-time-buyers', 'strategies']),
        status: 'published',
        isFeatured: true,
        viewCount: 312,
        replyCount: 12,
        likeCount: 47,
        lastReplyAt: new Date('2026-01-06T08:00:00Z'),
      },
    }),
    prisma.forumPost.create({
      data: {
        categoryId: forumCategories[3].id, // Service & Warranty
        authorId: dealerUsers[2].id,
        dealerId: dealers[2].id,
        title: 'Best practices for slide-out seal replacement',
        content: `Our service team has been dealing with several slide-out seal replacements lately. Here's our refined process:

**Tools needed:**
- Heat gun
- Seal removal tool
- Adhesive remover
- New seal material
- Dicor lap sealant

**Process:**
1. Fully extend the slide
2. Remove old seal carefully with heat gun
3. Clean surface thoroughly with adhesive remover
4. Apply new seal starting at bottom, working up
5. Use Dicor at corners and seams

Anyone have tips for dealing with stubborn adhesive residue?`,
        excerpt: 'Our service team has been dealing with several slide-out seal replacements lately. Here is our refined process...',
        postType: 'tip',
        tags: JSON.stringify(['service', 'slide-out', 'seals', 'repair']),
        status: 'published',
        viewCount: 189,
        replyCount: 6,
        likeCount: 28,
        lastReplyAt: new Date('2026-01-03T16:45:00Z'),
      },
    }),
    prisma.forumPost.create({
      data: {
        categoryId: forumCategories[4].id, // Announcements
        authorId: adminUser.id,
        title: 'New 2026 Model Year Pricing Now Available in Portal',
        content: `Hello Dealers,

We're excited to announce that the 2026 model year pricing is now available in the dealer portal!

**Key Updates:**
- All Jayco brands pricing updated
- New Airstream touring coach configurations
- Updated MSRP for Keystone fifth wheels
- Refreshed pricing tiers for volume discounts

**Action Required:**
Please review the new pricing in the Products section and update your showroom pricing accordingly. Contact your regional sales manager if you have questions.

The old 2025 pricing will remain visible for reference until January 31st.

Thank you for your continued partnership!`,
        excerpt: 'The 2026 model year pricing is now available in the dealer portal. Please review and update your showroom pricing accordingly.',
        postType: 'announcement',
        tags: JSON.stringify(['pricing', '2026', 'models', 'official']),
        status: 'published',
        isPinned: true,
        viewCount: 523,
        replyCount: 3,
        likeCount: 89,
        lastReplyAt: new Date('2026-01-02T11:00:00Z'),
      },
    }),
  ])

  // Create some forum replies
  await prisma.forumReply.createMany({
    data: [
      {
        postId: forumPosts[0].id,
        authorId: dealerUsers[1].id,
        dealerId: dealers[1].id,
        content: 'Great tips! We also recommend customers use moisture absorbers like DampRid inside the RV during storage. Works wonders for preventing mold and mildew.',
        status: 'published',
        likeCount: 8,
      },
      {
        postId: forumPosts[0].id,
        authorId: dealerUsers[2].id,
        dealerId: dealers[2].id,
        content: 'Don\'t forget to close the propane tank valve and cover the LP regulator! We\'ve seen some issues with wasps building nests in unprotected regulators.',
        status: 'published',
        likeCount: 12,
      },
      {
        postId: forumPosts[1].id,
        authorId: adminUser.id,
        content: 'The MORryde IS has a 7,000 lb axle capacity while the new upgrade supports up to 8,000 lbs. I\'ll get the official spec sheet from the product team and share it here.',
        status: 'published',
        likeCount: 6,
      },
      {
        postId: forumPosts[2].id,
        authorId: dealerUsers[1].id,
        dealerId: dealers[1].id,
        content: 'This is gold! We\'ve started using a simple spreadsheet that compares 10 weekend trips via RV vs hotels. The visual really helps first-timers see the value.',
        status: 'published',
        likeCount: 15,
      },
    ],
  })

  console.log('💬 Created forum posts and replies')

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
