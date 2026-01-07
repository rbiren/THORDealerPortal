'use server'

import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import type {
  CreateWarrantyClaimInput,
  UpdateWarrantyClaimInput,
  ReviewWarrantyClaimInput,
  AddWarrantyNoteInput,
  RespondToInfoRequestInput,
  WarrantyFilterInput,
  WarrantyStatus,
} from '@/lib/validations/warranty'

// Result types
export type WarrantyResult = {
  success: boolean
  claimId?: string
  claimNumber?: string
  error?: string
}

export type WarrantyClaimWithRelations = {
  id: string
  claimNumber: string
  dealerId: string
  submittedById: string
  assignedToId: string | null
  status: string
  claimType: string
  productId: string | null
  productName: string
  serialNumber: string | null
  modelNumber: string | null
  purchaseDate: Date | null
  installDate: Date | null
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  customerAddress: string | null
  issueDescription: string
  failureDate: Date | null
  isUnderWarranty: boolean
  resolutionType: string | null
  resolutionNotes: string | null
  laborHours: number | null
  laborRate: number | null
  partsAmount: number
  laborAmount: number
  shippingAmount: number
  totalRequested: number
  totalApproved: number | null
  priority: string
  submittedAt: Date | null
  reviewedAt: Date | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  dealer: {
    id: string
    name: string
    code: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  product: {
    id: string
    name: string
    sku: string
  } | null
  items: Array<{
    id: string
    partNumber: string | null
    partName: string
    quantity: number
    unitCost: number
    totalCost: number
    issueType: string
    issueDescription: string | null
    approved: boolean | null
    approvedQty: number | null
    approvedAmount: number | null
    denialReason: string | null
  }>
  attachments: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    category: string
    description: string | null
    createdAt: Date
  }>
  notes: Array<{
    id: string
    userId: string
    content: string
    isInternal: boolean
    isSystemNote: boolean
    createdAt: Date
    user: {
      id: string
      firstName: string
      lastName: string
      role: string
    }
  }>
  statusHistory: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    changedById: string | null
    note: string | null
    createdAt: Date
  }>
}

// Generate unique claim number (e.g., WC-2026-00001)
async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `WC-${year}-`

  // Get the highest claim number for this year
  const lastClaim = await prisma.warrantyClaim.findFirst({
    where: {
      claimNumber: { startsWith: prefix },
    },
    orderBy: { claimNumber: 'desc' },
    select: { claimNumber: true },
  })

  let sequence = 1
  if (lastClaim) {
    const lastSequence = parseInt(lastClaim.claimNumber.split('-')[2], 10)
    sequence = lastSequence + 1
  }

  return `${prefix}${String(sequence).padStart(5, '0')}`
}

// Calculate totals from items and labor
function calculateTotals(input: {
  laborHours?: number | null
  laborRate?: number | null
  partsAmount?: number
  shippingAmount?: number
  items?: Array<{ quantity: number; unitCost: number }>
}) {
  const laborAmount = (input.laborHours || 0) * (input.laborRate || 0)

  // Calculate parts total from items if provided
  let partsAmount = input.partsAmount || 0
  if (input.items && input.items.length > 0) {
    partsAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
  }

  const shippingAmount = input.shippingAmount || 0
  const totalRequested = laborAmount + partsAmount + shippingAmount

  return {
    laborAmount: Math.round(laborAmount * 100) / 100,
    partsAmount: Math.round(partsAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    totalRequested: Math.round(totalRequested * 100) / 100,
  }
}

// Create a new warranty claim
export async function createWarrantyClaim(
  input: CreateWarrantyClaimInput,
  userId: string,
  dealerId: string
): Promise<WarrantyResult> {
  try {
    const totals = calculateTotals({
      laborHours: input.laborHours,
      laborRate: input.laborRate,
      partsAmount: input.partsAmount,
      shippingAmount: input.shippingAmount,
      items: input.items,
    })

    const claimNumber = await generateClaimNumber()
    const status = input.submitNow ? 'submitted' : 'draft'

    const claim = await prisma.warrantyClaim.create({
      data: {
        claimNumber,
        dealerId,
        submittedById: userId,
        status,
        claimType: input.claimType,
        productId: input.productId || null,
        productName: input.productName,
        serialNumber: input.serialNumber || null,
        modelNumber: input.modelNumber || null,
        purchaseDate: input.purchaseDate || null,
        installDate: input.installDate || null,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        customerEmail: input.customerEmail || null,
        customerAddress: input.customerAddress || null,
        issueDescription: input.issueDescription,
        failureDate: input.failureDate || null,
        isUnderWarranty: input.isUnderWarranty,
        laborHours: input.laborHours || null,
        laborRate: input.laborRate || null,
        ...totals,
        priority: input.priority,
        submittedAt: input.submitNow ? new Date() : null,
        // RV Unit reference
        rvUnitId: input.rvUnitId || null,
        vin: input.vin || null,
        items: input.items
          ? {
              create: input.items.map((item) => ({
                partNumber: item.partNumber || null,
                partName: item.partName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.quantity * item.unitCost,
                issueType: item.issueType,
                issueDescription: item.issueDescription || null,
              })),
            }
          : undefined,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: status,
            changedById: userId,
            note: status === 'submitted' ? 'Warranty claim submitted' : 'Warranty claim created as draft',
          },
        },
      },
    })

    return {
      success: true,
      claimId: claim.id,
      claimNumber: claim.claimNumber,
    }
  } catch (error) {
    console.error('Failed to create warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create warranty claim',
    }
  }
}

// Update a warranty claim (dealer side - only for draft/info_requested)
export async function updateWarrantyClaim(
  input: UpdateWarrantyClaimInput,
  userId: string
): Promise<WarrantyResult> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: input.id },
      include: { items: true },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    // Only allow editing if draft or info_requested
    if (!['draft', 'info_requested'].includes(claim.status)) {
      return {
        success: false,
        error: 'Cannot edit claim in current status',
      }
    }

    const totals = calculateTotals({
      laborHours: input.laborHours ?? claim.laborHours,
      laborRate: input.laborRate ?? claim.laborRate,
      partsAmount: input.partsAmount ?? claim.partsAmount,
      shippingAmount: input.shippingAmount ?? claim.shippingAmount,
      items: input.items,
    })

    // Delete existing items if new ones are provided
    if (input.items) {
      await prisma.warrantyClaimItem.deleteMany({
        where: { claimId: input.id },
      })
    }

    await prisma.warrantyClaim.update({
      where: { id: input.id },
      data: {
        claimType: input.claimType,
        productId: input.productId,
        productName: input.productName,
        serialNumber: input.serialNumber,
        modelNumber: input.modelNumber,
        purchaseDate: input.purchaseDate,
        installDate: input.installDate,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress,
        issueDescription: input.issueDescription,
        failureDate: input.failureDate,
        isUnderWarranty: input.isUnderWarranty,
        laborHours: input.laborHours,
        laborRate: input.laborRate,
        ...totals,
        priority: input.priority,
        items: input.items
          ? {
              create: input.items.map((item) => ({
                partNumber: item.partNumber || null,
                partName: item.partName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.quantity * item.unitCost,
                issueType: item.issueType,
                issueDescription: item.issueDescription || null,
              })),
            }
          : undefined,
      },
    })

    return { success: true, claimId: input.id }
  } catch (error) {
    console.error('Failed to update warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update warranty claim',
    }
  }
}

// Submit a draft claim
export async function submitWarrantyClaim(
  claimId: string,
  userId: string
): Promise<WarrantyResult> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    if (claim.status !== 'draft') {
      return { success: false, error: 'Only draft claims can be submitted' }
    }

    await prisma.$transaction([
      prisma.warrantyClaim.update({
        where: { id: claimId },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
        },
      }),
      prisma.warrantyClaimStatusHistory.create({
        data: {
          claimId,
          fromStatus: 'draft',
          toStatus: 'submitted',
          changedById: userId,
          note: 'Warranty claim submitted for review',
        },
      }),
    ])

    return { success: true, claimId, claimNumber: claim.claimNumber }
  } catch (error) {
    console.error('Failed to submit warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit warranty claim',
    }
  }
}

// Review a warranty claim (manufacturer side)
export async function reviewWarrantyClaim(
  input: ReviewWarrantyClaimInput,
  userId: string
): Promise<WarrantyResult> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: input.claimId },
      include: { items: true },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    // Determine new status based on action
    let newStatus: WarrantyStatus
    let resolutionType: string | null = null

    switch (input.action) {
      case 'approve':
        newStatus = 'approved'
        resolutionType = input.resolutionType || 'credit'
        break
      case 'deny':
        newStatus = 'denied'
        resolutionType = 'denial'
        break
      case 'partial':
        newStatus = 'partial'
        resolutionType = input.resolutionType || 'partial_credit'
        break
      case 'request_info':
        newStatus = 'info_requested'
        break
      default:
        return { success: false, error: 'Invalid action' }
    }

    // Update item decisions if provided
    if (input.itemDecisions && input.itemDecisions.length > 0) {
      for (const decision of input.itemDecisions) {
        await prisma.warrantyClaimItem.update({
          where: { id: decision.itemId },
          data: {
            approved: decision.approved,
            approvedQty: decision.approvedQty,
            approvedAmount: decision.approvedAmount,
            denialReason: decision.denialReason,
          },
        })
      }
    }

    // Calculate total approved if approving/partial
    let totalApproved = input.totalApproved
    if ((input.action === 'approve' || input.action === 'partial') && !totalApproved) {
      // Auto-calculate from item decisions if not provided
      if (input.itemDecisions) {
        totalApproved = input.itemDecisions.reduce(
          (sum, d) => sum + (d.approvedAmount || 0),
          0
        )
      } else if (input.action === 'approve') {
        totalApproved = claim.totalRequested
      }
    }

    await prisma.$transaction([
      prisma.warrantyClaim.update({
        where: { id: input.claimId },
        data: {
          status: newStatus,
          resolutionType,
          resolutionNotes: input.resolutionNotes,
          totalApproved: totalApproved ?? null,
          assignedToId: userId,
          reviewedAt: new Date(),
          resolvedAt: ['approved', 'denied', 'partial'].includes(newStatus)
            ? new Date()
            : null,
        },
      }),
      prisma.warrantyClaimStatusHistory.create({
        data: {
          claimId: input.claimId,
          fromStatus: claim.status,
          toStatus: newStatus,
          changedById: userId,
          note: input.note || getDefaultStatusNote(input.action),
        },
      }),
      // Add system note
      prisma.warrantyClaimNote.create({
        data: {
          claimId: input.claimId,
          userId,
          content: input.note || getDefaultStatusNote(input.action),
          isInternal: false,
          isSystemNote: true,
        },
      }),
    ])

    return { success: true, claimId: input.claimId }
  } catch (error) {
    console.error('Failed to review warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review warranty claim',
    }
  }
}

function getDefaultStatusNote(action: string): string {
  switch (action) {
    case 'approve':
      return 'Warranty claim approved'
    case 'deny':
      return 'Warranty claim denied'
    case 'partial':
      return 'Warranty claim partially approved'
    case 'request_info':
      return 'Additional information requested'
    default:
      return 'Status updated'
  }
}

// Add a note to a warranty claim
export async function addWarrantyNote(
  input: AddWarrantyNoteInput,
  userId: string
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  try {
    const note = await prisma.warrantyClaimNote.create({
      data: {
        claimId: input.claimId,
        userId,
        content: input.content,
        isInternal: input.isInternal,
        isSystemNote: false,
      },
    })

    return { success: true, noteId: note.id }
  } catch (error) {
    console.error('Failed to add warranty note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    }
  }
}

// Respond to info request (dealer side)
export async function respondToInfoRequest(
  input: RespondToInfoRequestInput,
  userId: string
): Promise<WarrantyResult> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: input.claimId },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    if (claim.status !== 'info_requested') {
      return {
        success: false,
        error: 'Can only respond when info is requested',
      }
    }

    const newStatus = input.resubmit ? 'submitted' : 'info_requested'

    await prisma.$transaction([
      // Add the response as a note
      prisma.warrantyClaimNote.create({
        data: {
          claimId: input.claimId,
          userId,
          content: input.response,
          isInternal: false,
          isSystemNote: false,
        },
      }),
      // Update status if resubmitting
      ...(input.resubmit
        ? [
            prisma.warrantyClaim.update({
              where: { id: input.claimId },
              data: { status: 'submitted' },
            }),
            prisma.warrantyClaimStatusHistory.create({
              data: {
                claimId: input.claimId,
                fromStatus: 'info_requested',
                toStatus: 'submitted',
                changedById: userId,
                note: 'Information provided and resubmitted for review',
              },
            }),
          ]
        : []),
    ])

    return { success: true, claimId: input.claimId, claimNumber: claim.claimNumber }
  } catch (error) {
    console.error('Failed to respond to info request:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to respond',
    }
  }
}

// Get a single warranty claim by ID
export async function getWarrantyClaimById(
  claimId: string,
  userId: string,
  userRole: string,
  userDealerId: string | null
): Promise<WarrantyClaimWithRelations | null> {
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id: claimId },
    include: {
      dealer: {
        select: { id: true, name: true, code: true },
      },
      submittedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      product: {
        select: { id: true, name: true, sku: true },
      },
      items: true,
      attachments: true,
      notes: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!claim) return null

  // Check access rights
  const isAdmin = ['super_admin', 'admin'].includes(userRole)
  if (!isAdmin && claim.dealerId !== userDealerId) {
    return null
  }

  // Filter internal notes for dealers
  if (!isAdmin) {
    claim.notes = claim.notes.filter((note: { isInternal: boolean }) => !note.isInternal)
  }

  return claim as WarrantyClaimWithRelations
}

// List warranty claims with filters
export async function listWarrantyClaims(
  filters: WarrantyFilterInput,
  userId: string,
  userRole: string,
  userDealerId: string | null
): Promise<{
  claims: Array<{
    id: string
    claimNumber: string
    status: string
    claimType: string
    productName: string
    totalRequested: number
    totalApproved: number | null
    priority: string
    createdAt: Date
    updatedAt: Date
    dealer: { id: string; name: string; code: string }
    submittedBy: { firstName: string; lastName: string }
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  // Build where clause
  const where: Record<string, unknown> = {}

  // Dealers can only see their own claims
  if (!isAdmin) {
    where.dealerId = userDealerId
  } else if (filters.dealerId) {
    where.dealerId = filters.dealerId
  }

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters.claimType && filters.claimType !== 'all') {
    where.claimType = filters.claimType
  }

  if (filters.priority && filters.priority !== 'all') {
    where.priority = filters.priority
  }

  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId
  }

  if (filters.search) {
    where.OR = [
      { claimNumber: { contains: filters.search } },
      { productName: { contains: filters.search } },
      { serialNumber: { contains: filters.search } },
      { customerName: { contains: filters.search } },
    ]
  }

  if (filters.dateFrom) {
    where.createdAt = { gte: filters.dateFrom }
  }

  if (filters.dateTo) {
    where.createdAt = { ...(where.createdAt as Record<string, unknown> || {}), lte: filters.dateTo }
  }

  const [claims, total] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where,
      include: {
        dealer: {
          select: { id: true, name: true, code: true },
        },
        submittedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { [filters.sortBy]: filters.sortOrder },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.warrantyClaim.count({ where }),
  ])

  return {
    claims: claims.map((claim: {
      id: string
      claimNumber: string
      status: string
      claimType: string
      productName: string
      totalRequested: number
      totalApproved: number | null
      priority: string
      createdAt: Date
      updatedAt: Date
      dealer: { id: string; name: string; code: string }
      submittedBy: { firstName: string; lastName: string }
    }) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      claimType: claim.claimType,
      productName: claim.productName,
      totalRequested: claim.totalRequested,
      totalApproved: claim.totalApproved,
      priority: claim.priority,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      dealer: claim.dealer,
      submittedBy: claim.submittedBy,
    })),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  }
}

// Get warranty stats
export async function getWarrantyStats(
  userRole: string,
  userDealerId: string | null
): Promise<{
  total: number
  pending: number
  inReview: number
  approved: number
  denied: number
  totalRequested: number
  totalApproved: number
}> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)
  const where = isAdmin ? {} : { dealerId: userDealerId }

  const [total, pending, inReview, approved, denied, amounts] = await Promise.all([
    prisma.warrantyClaim.count({ where }),
    prisma.warrantyClaim.count({
      where: { ...where, status: { in: ['draft', 'submitted'] } },
    }),
    prisma.warrantyClaim.count({
      where: { ...where, status: { in: ['under_review', 'info_requested'] } },
    }),
    prisma.warrantyClaim.count({
      where: { ...where, status: { in: ['approved', 'partial'] } },
    }),
    prisma.warrantyClaim.count({
      where: { ...where, status: 'denied' },
    }),
    prisma.warrantyClaim.aggregate({
      where: { ...where, status: { not: 'draft' } },
      _sum: {
        totalRequested: true,
        totalApproved: true,
      },
    }),
  ])

  return {
    total,
    pending,
    inReview,
    approved,
    denied,
    totalRequested: amounts._sum.totalRequested || 0,
    totalApproved: amounts._sum.totalApproved || 0,
  }
}

// Delete a draft warranty claim
export async function deleteWarrantyClaim(
  claimId: string,
  userId: string,
  userDealerId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    // Only allow deleting drafts
    if (claim.status !== 'draft') {
      return { success: false, error: 'Only draft claims can be deleted' }
    }

    // Check ownership
    if (claim.dealerId !== userDealerId) {
      return { success: false, error: 'Not authorized to delete this claim' }
    }

    await prisma.warrantyClaim.delete({
      where: { id: claimId },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to delete warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete claim',
    }
  }
}

// Assign a claim to a manufacturer user
export async function assignWarrantyClaim(
  claimId: string,
  assigneeId: string,
  userId: string
): Promise<WarrantyResult> {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return { success: false, error: 'Warranty claim not found' }
    }

    await prisma.$transaction([
      prisma.warrantyClaim.update({
        where: { id: claimId },
        data: {
          assignedToId: assigneeId,
          status: claim.status === 'submitted' ? 'under_review' : claim.status,
        },
      }),
      prisma.warrantyClaimStatusHistory.create({
        data: {
          claimId,
          fromStatus: claim.status,
          toStatus: claim.status === 'submitted' ? 'under_review' : claim.status,
          changedById: userId,
          note: 'Claim assigned for review',
        },
      }),
    ])

    return { success: true, claimId }
  } catch (error) {
    console.error('Failed to assign warranty claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign claim',
    }
  }
}
