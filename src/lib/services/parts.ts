/**
 * Parts & Service Module Service
 * Phase 8.5: Parts catalog, Service bulletins, Recalls
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreatePartInput {
  partNumber: string;
  name: string;
  description?: string;
  categoryId?: string;
  listPrice: number;
  dealerPrice: number;
  costPrice?: number;
  quantityOnHand?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  unitOfMeasure?: string;
  imageUrl?: string;
  specSheetUrl?: string;
  applicableProducts?: string[];
}

export interface CreatePartsOrderInput {
  dealerId: string;
  orderedById: string;
  items: Array<{ partId: string; quantity: number }>;
  shippingAddress?: string;
  poNumber?: string;
  notes?: string;
  isRush?: boolean;
}

export interface CreateBulletinInput {
  bulletinNumber: string;
  title: string;
  description: string;
  content: string;
  category: string;
  severity?: string;
  affectedProducts?: string[];
  affectedSerialRange?: string;
  affectedModelYears?: string;
  actionRequired?: string;
  laborTimeHours?: number;
  partsRequired?: string[];
  effectiveDate: Date;
  expirationDate?: Date;
  attachmentUrls?: string[];
  publishedById?: string;
}

export interface CreateRecallInput {
  recallNumber: string;
  title: string;
  description: string;
  content: string;
  nhtsaCampaignNumber?: string;
  regulatoryBody?: string;
  severity: string;
  safetyRisk?: string;
  affectedProducts?: string[];
  affectedSerialRange?: string;
  affectedModelYears?: string;
  estimatedAffectedUnits?: number;
  remedyDescription?: string;
  remedyAvailableDate?: Date;
  announcedDate: Date;
  remedyDeadline?: Date;
}

// ============================================================================
// PARTS CATALOG
// ============================================================================

/**
 * Create a part
 */
export async function createPart(input: CreatePartInput) {
  return prisma.part.create({
    data: {
      partNumber: input.partNumber,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      listPrice: input.listPrice,
      dealerPrice: input.dealerPrice,
      costPrice: input.costPrice,
      quantityOnHand: input.quantityOnHand || 0,
      reorderPoint: input.reorderPoint || 5,
      reorderQuantity: input.reorderQuantity || 10,
      weight: input.weight,
      dimensions: input.dimensions ? JSON.stringify(input.dimensions) : null,
      unitOfMeasure: input.unitOfMeasure || 'each',
      imageUrl: input.imageUrl,
      specSheetUrl: input.specSheetUrl,
      applicableProducts: input.applicableProducts
        ? JSON.stringify(input.applicableProducts)
        : null,
      status: 'active',
    },
    include: {
      category: true,
    },
  });
}

/**
 * Get a part by ID or part number
 */
export async function getPart(idOrPartNumber: string) {
  return prisma.part.findFirst({
    where: {
      OR: [{ id: idOrPartNumber }, { partNumber: idOrPartNumber }],
    },
    include: {
      category: true,
      supersededBy: { select: { id: true, partNumber: true, name: true } },
      supersedes: { select: { id: true, partNumber: true, name: true } },
    },
  });
}

/**
 * Search parts
 */
export async function searchParts(options: {
  search?: string;
  categoryId?: string;
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { search, categoryId, status, productId, page = 1, limit = 20 } = options;

  const where: Prisma.PartWhereInput = {};

  if (search) {
    where.OR = [
      { partNumber: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (productId) where.applicableProducts = { contains: productId };

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  return {
    parts: parts.map((p) => ({
      ...p,
      dimensions: p.dimensions ? JSON.parse(p.dimensions) : null,
      applicableProducts: p.applicableProducts ? JSON.parse(p.applicableProducts) : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Update part inventory
 */
export async function updatePartInventory(
  partId: string,
  adjustment: number,
  reason?: string
) {
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) throw new Error('Part not found');

  const newQuantity = Math.max(0, part.quantityOnHand + adjustment);

  return prisma.part.update({
    where: { id: partId },
    data: { quantityOnHand: newQuantity },
  });
}

/**
 * Get low stock parts
 */
export async function getLowStockParts() {
  return prisma.part.findMany({
    where: {
      status: 'active',
      quantityOnHand: { lte: prisma.part.fields.reorderPoint },
    },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { quantityOnHand: 'asc' },
  });
}

// ============================================================================
// PARTS CATEGORIES
// ============================================================================

/**
 * Create a part category
 */
export async function createPartCategory(input: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}) {
  return prisma.partCategory.create({
    data: input,
    include: { parent: true },
  });
}

/**
 * Get part category tree
 */
export async function getPartCategoryTree() {
  const categories = await prisma.partCategory.findMany({
    include: {
      children: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { parts: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return categories.filter((c) => !c.parentId);
}

// ============================================================================
// PARTS ORDERS
// ============================================================================

/**
 * Generate parts order number
 */
async function generatePartsOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  const lastOrder = await prisma.partsOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

/**
 * Create a parts order
 */
export async function createPartsOrder(input: CreatePartsOrderInput) {
  const orderNumber = await generatePartsOrderNumber();

  // Calculate totals
  let subtotal = 0;
  const itemsWithPrices = [];

  for (const item of input.items) {
    const part = await prisma.part.findUnique({ where: { id: item.partId } });
    if (!part) throw new Error(`Part ${item.partId} not found`);
    if (part.status !== 'active') throw new Error(`Part ${part.partNumber} is not available`);

    const totalPrice = part.dealerPrice * item.quantity;
    subtotal += totalPrice;

    itemsWithPrices.push({
      partId: item.partId,
      quantity: item.quantity,
      unitPrice: part.dealerPrice,
      totalPrice,
    });
  }

  // Estimate shipping (simplified)
  const shippingAmount = subtotal > 500 ? 0 : 25;
  const taxAmount = subtotal * 0.08; // 8% tax estimate
  const totalAmount = subtotal + shippingAmount + taxAmount;

  return prisma.partsOrder.create({
    data: {
      orderNumber,
      dealerId: input.dealerId,
      orderedById: input.orderedById,
      status: 'draft',
      subtotal,
      shippingAmount,
      taxAmount,
      totalAmount,
      shippingAddress: input.shippingAddress,
      poNumber: input.poNumber,
      notes: input.notes,
      isRush: input.isRush || false,
      items: {
        create: itemsWithPrices,
      },
    },
    include: {
      items: {
        include: { part: { select: { id: true, partNumber: true, name: true } } },
      },
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Submit a parts order
 */
export async function submitPartsOrder(orderId: string) {
  const order = await prisma.partsOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error('Order not found');
  if (order.status !== 'draft') throw new Error('Order already submitted');

  // Check inventory and reserve
  for (const item of order.items) {
    const part = await prisma.part.findUnique({ where: { id: item.partId } });
    if (!part) throw new Error('Part not found');

    const available = part.quantityOnHand - part.quantityReserved;
    if (available < item.quantity) {
      // Mark as backordered
      await prisma.partsOrderItem.update({
        where: { id: item.id },
        data: { quantityBackordered: item.quantity - available },
      });
    }

    // Reserve inventory
    const toReserve = Math.min(item.quantity, available);
    await prisma.part.update({
      where: { id: item.partId },
      data: { quantityReserved: { increment: toReserve } },
    });
  }

  return prisma.partsOrder.update({
    where: { id: orderId },
    data: {
      status: 'submitted',
      submittedAt: new Date(),
    },
    include: {
      items: { include: { part: true } },
      dealer: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get parts orders
 */
export async function getPartsOrders(options: {
  dealerId?: string;
  status?: string | string[];
  page?: number;
  limit?: number;
} = {}) {
  const { dealerId, status, page = 1, limit = 20 } = options;

  const where: Prisma.PartsOrderWhereInput = {};
  if (dealerId) where.dealerId = dealerId;
  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  const [orders, total] = await Promise.all([
    prisma.partsOrder.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.partsOrder.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============================================================================
// SERVICE BULLETINS
// ============================================================================

/**
 * Create a service bulletin
 */
export async function createServiceBulletin(input: CreateBulletinInput) {
  return prisma.serviceBulletin.create({
    data: {
      bulletinNumber: input.bulletinNumber,
      title: input.title,
      description: input.description,
      content: input.content,
      category: input.category,
      severity: input.severity || 'normal',
      affectedProducts: input.affectedProducts
        ? JSON.stringify(input.affectedProducts)
        : null,
      affectedSerialRange: input.affectedSerialRange,
      affectedModelYears: input.affectedModelYears,
      actionRequired: input.actionRequired,
      laborTimeHours: input.laborTimeHours,
      partsRequired: input.partsRequired
        ? JSON.stringify(input.partsRequired)
        : null,
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      attachmentUrls: input.attachmentUrls
        ? JSON.stringify(input.attachmentUrls)
        : null,
      publishedById: input.publishedById,
      status: 'draft',
    },
  });
}

/**
 * Get service bulletin
 */
export async function getServiceBulletin(idOrNumber: string) {
  const bulletin = await prisma.serviceBulletin.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { bulletinNumber: idOrNumber }],
    },
    include: {
      _count: { select: { acknowledgments: true } },
    },
  });

  if (!bulletin) return null;

  return {
    ...bulletin,
    affectedProducts: bulletin.affectedProducts
      ? JSON.parse(bulletin.affectedProducts)
      : [],
    partsRequired: bulletin.partsRequired
      ? JSON.parse(bulletin.partsRequired)
      : [],
    attachmentUrls: bulletin.attachmentUrls
      ? JSON.parse(bulletin.attachmentUrls)
      : [],
  };
}

/**
 * List service bulletins
 */
export async function listServiceBulletins(options: {
  category?: string;
  severity?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { category, severity, status, search, page = 1, limit = 20 } = options;

  const where: Prisma.ServiceBulletinWhereInput = {};
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { bulletinNumber: { contains: search } },
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [bulletins, total] = await Promise.all([
    prisma.serviceBulletin.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { effectiveDate: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceBulletin.count({ where }),
  ]);

  return {
    bulletins: bulletins.map((b) => ({
      ...b,
      affectedProducts: b.affectedProducts ? JSON.parse(b.affectedProducts) : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Publish a service bulletin
 */
export async function publishServiceBulletin(id: string, publishedById: string) {
  return prisma.serviceBulletin.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      publishedById,
    },
  });
}

/**
 * Acknowledge a service bulletin
 */
export async function acknowledgeBulletin(
  bulletinId: string,
  dealerId: string,
  userId: string
) {
  return prisma.serviceBulletinAcknowledgment.upsert({
    where: { bulletinId_dealerId: { bulletinId, dealerId } },
    create: { bulletinId, dealerId, userId },
    update: { userId, acknowledgedAt: new Date() },
    include: {
      bulletin: { select: { bulletinNumber: true, title: true } },
    },
  });
}

/**
 * Get dealer's unacknowledged bulletins
 */
export async function getUnacknowledgedBulletins(dealerId: string) {
  const acknowledged = await prisma.serviceBulletinAcknowledgment.findMany({
    where: { dealerId },
    select: { bulletinId: true },
  });

  const acknowledgedIds = acknowledged.map((a) => a.bulletinId);

  return prisma.serviceBulletin.findMany({
    where: {
      status: 'published',
      id: { notIn: acknowledgedIds },
      OR: [
        { expirationDate: null },
        { expirationDate: { gt: new Date() } },
      ],
    },
    orderBy: [{ severity: 'desc' }, { effectiveDate: 'desc' }],
  });
}

// ============================================================================
// RECALL NOTICES
// ============================================================================

/**
 * Create a recall notice
 */
export async function createRecallNotice(input: CreateRecallInput) {
  return prisma.recallNotice.create({
    data: {
      recallNumber: input.recallNumber,
      title: input.title,
      description: input.description,
      content: input.content,
      nhtsaCampaignNumber: input.nhtsaCampaignNumber,
      regulatoryBody: input.regulatoryBody,
      severity: input.severity,
      safetyRisk: input.safetyRisk,
      affectedProducts: input.affectedProducts
        ? JSON.stringify(input.affectedProducts)
        : null,
      affectedSerialRange: input.affectedSerialRange,
      affectedModelYears: input.affectedModelYears,
      estimatedAffectedUnits: input.estimatedAffectedUnits,
      remedyDescription: input.remedyDescription,
      remedyAvailableDate: input.remedyAvailableDate,
      announcedDate: input.announcedDate,
      remedyDeadline: input.remedyDeadline,
      status: 'active',
    },
  });
}

/**
 * Get recall notice
 */
export async function getRecallNotice(idOrNumber: string) {
  const recall = await prisma.recallNotice.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { recallNumber: idOrNumber }],
    },
    include: {
      dealerNotifications: {
        include: {
          dealer: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!recall) return null;

  return {
    ...recall,
    affectedProducts: recall.affectedProducts
      ? JSON.parse(recall.affectedProducts)
      : [],
  };
}

/**
 * List recalls
 */
export async function listRecalls(options: {
  status?: string;
  severity?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { status, severity, page = 1, limit = 20 } = options;

  const where: Prisma.RecallNoticeWhereInput = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;

  const [recalls, total] = await Promise.all([
    prisma.recallNotice.findMany({
      where,
      include: {
        _count: { select: { dealerNotifications: true } },
      },
      orderBy: [{ severity: 'desc' }, { announcedDate: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recallNotice.count({ where }),
  ]);

  return {
    recalls: recalls.map((r) => ({
      ...r,
      affectedProducts: r.affectedProducts ? JSON.parse(r.affectedProducts) : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Notify dealers about a recall
 */
export async function notifyDealersOfRecall(
  recallId: string,
  dealerIds: string[],
  affectedUnitsPerDealer?: Record<string, number>
) {
  const notifications = dealerIds.map((dealerId) => ({
    recallId,
    dealerId,
    affectedUnits: affectedUnitsPerDealer?.[dealerId] || 0,
    status: 'notified',
  }));

  await prisma.recallDealerNotification.createMany({
    data: notifications,
    skipDuplicates: true,
  });

  return prisma.recallDealerNotification.findMany({
    where: { recallId },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Update dealer recall status
 */
export async function updateRecallDealerStatus(
  recallId: string,
  dealerId: string,
  status: string,
  unitsRemedied?: number
) {
  const updateData: Prisma.RecallDealerNotificationUpdateInput = { status };

  if (status === 'acknowledged') {
    updateData.acknowledgedAt = new Date();
  } else if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  if (unitsRemedied !== undefined) {
    updateData.unitsRemedied = unitsRemedied;
  }

  return prisma.recallDealerNotification.update({
    where: { recallId_dealerId: { recallId, dealerId } },
    data: updateData,
  });
}

/**
 * Get dealer's recalls
 */
export async function getDealerRecalls(dealerId: string) {
  return prisma.recallDealerNotification.findMany({
    where: { dealerId },
    include: {
      recall: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
