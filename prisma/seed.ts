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

  // RV Inventory (new)
  await prisma.serviceRecord.deleteMany()
  await prisma.vehicleOrderStatusHistory.deleteMany()
  await prisma.vehicleInvoice.deleteMany()
  await prisma.vehicleOrder.deleteMany()
  await prisma.tradeIn.deleteMany()
  await prisma.rVModelIncentive.deleteMany()
  await prisma.rVUnit.deleteMany()
  await prisma.rVModel.deleteMany()

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

  // ============================================================================
  // RV INVENTORY SEEDING
  // ============================================================================

  // Create RV Models
  const rvModels = await Promise.all([
    prisma.rVModel.create({
      data: {
        code: 'ARIA-4000',
        name: 'Aria 4000',
        series: 'Aria',
        classType: 'Class A',
        modelYear: 2025,
        lengthFeet: 40,
        lengthInches: 6,
        baseWeight: 32000,
        freshWaterCapacity: 100,
        grayWaterCapacity: 65,
        blackWaterCapacity: 50,
        lpgCapacity: 30,
        fuelCapacity: 100,
        sleepingCapacity: 6,
        slideOuts: 4,
        chassisMake: 'Freightliner',
        chassisModel: 'XC-R',
        engineType: 'Diesel',
        engineSize: '6.7L Cummins',
        baseMSRP: 425000,
        dealerInvoice: 380000,
        holdback: 5000,
        availableExteriorColors: JSON.stringify(['Slate Gray', 'Modern White', 'Midnight Blue']),
        availableInteriorColors: JSON.stringify(['Modern Farmhouse', 'Contemporary Dark', 'Coastal']),
        standardFeatures: JSON.stringify([
          'King-size bed', 'Residential refrigerator', 'Washer/dryer combo',
          'Fireplace', 'Power awning', 'Solar panels'
        ]),
        status: 'active',
      },
    }),
    prisma.rVModel.create({
      data: {
        code: 'MAGNITUDE-XG32',
        name: 'Magnitude XG32',
        series: 'Magnitude',
        classType: 'Class A',
        modelYear: 2025,
        lengthFeet: 32,
        lengthInches: 11,
        baseWeight: 26000,
        freshWaterCapacity: 80,
        grayWaterCapacity: 50,
        blackWaterCapacity: 40,
        lpgCapacity: 24,
        fuelCapacity: 80,
        sleepingCapacity: 5,
        slideOuts: 2,
        chassisMake: 'Ford',
        chassisModel: 'F-53',
        engineType: 'Gas',
        engineSize: '7.3L V8',
        baseMSRP: 189000,
        dealerInvoice: 165000,
        holdback: 3000,
        availableExteriorColors: JSON.stringify(['Champagne', 'Graphite', 'Oxford White']),
        availableInteriorColors: JSON.stringify(['Saddle', 'Ash', 'Mocha']),
        standardFeatures: JSON.stringify([
          'Queen-size bed', 'Convection microwave', 'Power drop-down bunk',
          'Backup camera', 'LED lighting'
        ]),
        status: 'active',
      },
    }),
    prisma.rVModel.create({
      data: {
        code: 'COMPASS-24TF',
        name: 'Compass 24TF',
        series: 'Compass',
        classType: 'Class C',
        modelYear: 2025,
        lengthFeet: 25,
        lengthInches: 5,
        baseWeight: 12500,
        freshWaterCapacity: 44,
        grayWaterCapacity: 30,
        blackWaterCapacity: 30,
        lpgCapacity: 11,
        fuelCapacity: 50,
        sleepingCapacity: 5,
        slideOuts: 1,
        chassisMake: 'Ford',
        chassisModel: 'E-450',
        engineType: 'Gas',
        engineSize: '7.3L V8',
        baseMSRP: 129000,
        dealerInvoice: 112000,
        holdback: 2000,
        availableExteriorColors: JSON.stringify(['Arctic White', 'Ingot Silver']),
        availableInteriorColors: JSON.stringify(['Nutmeg', 'Fossil']),
        standardFeatures: JSON.stringify([
          'Cab-over bunk', 'Full bath', 'Dinette', 'LED TV', 'Generator'
        ]),
        status: 'active',
      },
    }),
    prisma.rVModel.create({
      data: {
        code: 'VENETIAN-F42',
        name: 'Venetian F42',
        series: 'Venetian',
        classType: 'Class A',
        modelYear: 2025,
        lengthFeet: 42,
        lengthInches: 8,
        baseWeight: 38000,
        freshWaterCapacity: 130,
        grayWaterCapacity: 80,
        blackWaterCapacity: 60,
        lpgCapacity: 35,
        fuelCapacity: 150,
        sleepingCapacity: 4,
        slideOuts: 4,
        chassisMake: 'Freightliner',
        chassisModel: 'XCR',
        engineType: 'Diesel',
        engineSize: '8.9L Cummins',
        baseMSRP: 625000,
        dealerInvoice: 560000,
        holdback: 8000,
        availableExteriorColors: JSON.stringify(['Pearl White', 'Obsidian Black', 'Champagne Pearl']),
        availableInteriorColors: JSON.stringify(['Italian Villa', 'Modern Luxe', 'Tuscan']),
        standardFeatures: JSON.stringify([
          'King bed with sleep number', 'Residential refrigerator', 'Central vacuum',
          'Aqua-Hot heating', 'In-motion satellite', 'Dishwasher'
        ]),
        status: 'active',
      },
    }),
    prisma.rVModel.create({
      data: {
        code: 'OUTLAW-38MB',
        name: 'Outlaw 38MB',
        series: 'Outlaw',
        classType: 'Toy Hauler',
        modelYear: 2025,
        lengthFeet: 38,
        lengthInches: 10,
        baseWeight: 25000,
        freshWaterCapacity: 80,
        grayWaterCapacity: 48,
        blackWaterCapacity: 48,
        lpgCapacity: 30,
        fuelCapacity: 80,
        sleepingCapacity: 8,
        slideOuts: 2,
        chassisMake: 'Ford',
        chassisModel: 'F-53',
        engineType: 'Gas',
        engineSize: '7.3L V8',
        baseMSRP: 215000,
        dealerInvoice: 188000,
        holdback: 3500,
        availableExteriorColors: JSON.stringify(['Stealth Gray', 'Race Red', 'Lightning Blue']),
        availableInteriorColors: JSON.stringify(['Sport', 'Titanium']),
        standardFeatures: JSON.stringify([
          '10ft garage', 'Ramp door with party patio', 'Fuel station', 'Zero-gravity recliners',
          'Power loft bed', 'Exterior entertainment center'
        ]),
        status: 'active',
      },
    }),
  ])

  console.log('🚐 Created RV models')

  // Create RV Units (inventory)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const oneTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)

  const rvUnits = await Promise.all([
    // Aria units
    prisma.rVUnit.create({
      data: {
        vin: '1THOR4000A2500001',
        stockNumber: 'A4000-001',
        modelId: rvModels[0].id,
        modelYear: 2025,
        exteriorColor: 'Slate Gray',
        interiorColor: 'Modern Farmhouse',
        installedOptions: JSON.stringify(['Premium sound system', 'Exterior TV', 'Lithium batteries']),
        condition: 'new',
        status: 'in_stock',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Lot A, Row 1',
        msrp: 445000,
        invoiceCost: 398000,
        internetPrice: 429000,
        minimumPrice: 410000,
        floorPlanLender: 'Bank of America',
        floorPlanNumber: 'FL-2025-001234',
        floorPlanPayoff: 390000,
        floorPlanDueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        floorPlanInterestRate: 5.99,
        receivedDate: thirtyDaysAgo,
        daysOnLot: 30,
        warrantyStartDate: thirtyDaysAgo,
        warrantyEndDate: new Date(thirtyDaysAgo.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.rVUnit.create({
      data: {
        vin: '1THOR4000A2500002',
        stockNumber: 'A4000-002',
        modelId: rvModels[0].id,
        modelYear: 2025,
        exteriorColor: 'Modern White',
        interiorColor: 'Contemporary Dark',
        condition: 'new',
        status: 'reserved',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Lot A, Row 2',
        msrp: 438000,
        invoiceCost: 392000,
        internetPrice: 425000,
        receivedDate: sixtyDaysAgo,
        daysOnLot: 60,
        warrantyStartDate: sixtyDaysAgo,
        warrantyEndDate: new Date(sixtyDaysAgo.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    // Magnitude units
    prisma.rVUnit.create({
      data: {
        vin: '1THORMAG32B2500001',
        stockNumber: 'M32-001',
        modelId: rvModels[1].id,
        modelYear: 2025,
        exteriorColor: 'Champagne',
        interiorColor: 'Saddle',
        condition: 'new',
        status: 'in_stock',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Lot B, Row 1',
        msrp: 199000,
        invoiceCost: 172000,
        internetPrice: 189000,
        floorPlanLender: 'M&T Bank',
        floorPlanNumber: 'FL-2025-005678',
        floorPlanPayoff: 168000,
        floorPlanDueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        floorPlanInterestRate: 6.25,
        receivedDate: ninetyDaysAgo,
        daysOnLot: 90,
        warrantyStartDate: ninetyDaysAgo,
        warrantyEndDate: new Date(ninetyDaysAgo.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.rVUnit.create({
      data: {
        vin: '1THORMAG32B2500002',
        stockNumber: 'M32-002',
        modelId: rvModels[1].id,
        modelYear: 2025,
        exteriorColor: 'Graphite',
        interiorColor: 'Ash',
        condition: 'demo',
        status: 'in_stock',
        mileage: 1250,
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        msrp: 199000,
        invoiceCost: 172000,
        internetPrice: 175000,
        minimumPrice: 165000,
        receivedDate: oneTwentyDaysAgo,
        daysOnLot: 120,
        conditionNotes: 'Demo unit - excellent condition. Minor wear on driver seat.',
      },
    }),
    // Compass units
    prisma.rVUnit.create({
      data: {
        vin: '1THORCOMP24C2500001',
        stockNumber: 'C24-001',
        modelId: rvModels[2].id,
        modelYear: 2025,
        exteriorColor: 'Arctic White',
        interiorColor: 'Nutmeg',
        condition: 'new',
        status: 'in_stock',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Lot C, Row 1',
        msrp: 135000,
        invoiceCost: 118000,
        internetPrice: 129000,
        receivedDate: thirtyDaysAgo,
        daysOnLot: 30,
        warrantyStartDate: thirtyDaysAgo,
        warrantyEndDate: new Date(thirtyDaysAgo.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.rVUnit.create({
      data: {
        vin: '1THORCOMP24C2500002',
        stockNumber: 'C24-002',
        modelId: rvModels[2].id,
        modelYear: 2025,
        exteriorColor: 'Ingot Silver',
        interiorColor: 'Fossil',
        condition: 'new',
        status: 'in_transit',
        dealerId: dealers[0].id,
        msrp: 132000,
        invoiceCost: 115000,
        availableDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    // Venetian unit
    prisma.rVUnit.create({
      data: {
        vin: '1THORVENETF42D2500001',
        stockNumber: 'V42-001',
        modelId: rvModels[3].id,
        modelYear: 2025,
        exteriorColor: 'Pearl White',
        interiorColor: 'Italian Villa',
        installedOptions: JSON.stringify(['Stacked washer/dryer', 'Wine cooler', 'Outdoor kitchen', 'Upgraded suspension']),
        condition: 'new',
        status: 'in_stock',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Premium Lot, Spot 1',
        msrp: 685000,
        invoiceCost: 610000,
        internetPrice: 659000,
        minimumPrice: 630000,
        floorPlanLender: 'Wells Fargo',
        floorPlanNumber: 'WF-2025-007890',
        floorPlanPayoff: 600000,
        floorPlanDueDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        floorPlanInterestRate: 5.5,
        receivedDate: sixtyDaysAgo,
        daysOnLot: 60,
        warrantyStartDate: sixtyDaysAgo,
        warrantyEndDate: new Date(sixtyDaysAgo.getTime() + 5 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    // Outlaw Toy Hauler
    prisma.rVUnit.create({
      data: {
        vin: '1THOROUTLAW38E2500001',
        stockNumber: 'OL38-001',
        modelId: rvModels[4].id,
        modelYear: 2025,
        exteriorColor: 'Stealth Gray',
        interiorColor: 'Sport',
        condition: 'new',
        status: 'in_stock',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Lot D, Row 1',
        msrp: 225000,
        invoiceCost: 196000,
        internetPrice: 215000,
        receivedDate: thirtyDaysAgo,
        daysOnLot: 30,
        warrantyStartDate: thirtyDaysAgo,
        warrantyEndDate: new Date(thirtyDaysAgo.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    }),
    // Used unit
    prisma.rVUnit.create({
      data: {
        vin: '1THORMAG32B2400099',
        stockNumber: 'U-M32-099',
        modelId: rvModels[1].id,
        modelYear: 2024,
        exteriorColor: 'Oxford White',
        interiorColor: 'Mocha',
        condition: 'used',
        status: 'in_stock',
        mileage: 12500,
        conditionNotes: 'Trade-in. Previous owner well-maintained. New tires, recent service.',
        dealerId: dealers[0].id,
        locationId: warehouse.id,
        lotLocation: 'Used Lot, Row 2',
        msrp: 165000,
        invoiceCost: 125000,
        internetPrice: 159000,
        minimumPrice: 145000,
        receivedDate: sixtyDaysAgo,
        daysOnLot: 60,
        warrantyEndDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months left
      },
    }),
  ])

  console.log('🚗 Created RV inventory units')

  console.log('✅ Seed completed successfully!')
  console.log(`
Summary:
- ${await prisma.dealer.count()} Dealers
- ${await prisma.user.count()} Users
- ${await prisma.product.count()} Products
- ${await prisma.inventory.count()} Inventory records
- ${await prisma.order.count()} Orders
- ${await prisma.notification.count()} Notifications
- ${await prisma.rVModel.count()} RV Models
- ${await prisma.rVUnit.count()} RV Units
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
