'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  dealerFilterSchema,
  bulkDealerActionSchema,
  createDealerSchema,
  updateDealerSchema,
  type DealerFilterInput,
  type BulkDealerActionInput,
  type CreateDealerInput,
  type UpdateDealerInput,
} from '@/lib/validations/dealer'

export type DealerListItem = {
  id: string
  code: string
  name: string
  status: string
  tier: string
  createdAt: Date
  _count: {
    users: number
    orders: number
  }
  parentDealer: {
    id: string
    name: string
    code: string
  } | null
}

export type DealerListResult = {
  dealers: DealerListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getDealers(input: DealerFilterInput): Promise<DealerListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { dealers: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const validatedInput = dealerFilterSchema.parse(input)
  const { search, status, tier, page, pageSize, sortBy, sortOrder } = validatedInput

  // Build where clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
    ]
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (tier && tier !== 'all') {
    where.tier = tier
  }

  // Get total count
  const total = await prisma.dealer.count({ where })

  // Get dealers with pagination
  const dealers = await prisma.dealer.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      tier: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
      parentDealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return {
    dealers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export type BulkActionState = {
  success: boolean
  message: string
  affected: number
}

export async function bulkDealerAction(input: BulkDealerActionInput): Promise<BulkActionState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized', affected: 0 }
  }

  try {
    const validatedInput = bulkDealerActionSchema.parse(input)
    const { dealerIds, action } = validatedInput

    let affected = 0
    let newStatus: string

    switch (action) {
      case 'activate':
        newStatus = 'active'
        break
      case 'suspend':
        newStatus = 'suspended'
        break
      case 'deactivate':
        newStatus = 'inactive'
        break
      default:
        return { success: false, message: 'Invalid action', affected: 0 }
    }

    const result = await prisma.dealer.updateMany({
      where: { id: { in: dealerIds } },
      data: { status: newStatus },
    })
    affected = result.count

    revalidatePath('/admin/dealers')
    return {
      success: true,
      message: `Successfully ${action}d ${affected} dealer(s)`,
      affected,
    }
  } catch (error) {
    console.error('Bulk dealer action error:', error)
    return { success: false, message: 'An error occurred', affected: 0 }
  }
}

export async function getDealerStats() {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  const [
    totalDealers,
    activeDealers,
    pendingDealers,
    tierCounts,
  ] = await Promise.all([
    prisma.dealer.count(),
    prisma.dealer.count({ where: { status: 'active' } }),
    prisma.dealer.count({ where: { status: 'pending' } }),
    prisma.dealer.groupBy({
      by: ['tier'],
      _count: { tier: true },
    }),
  ])

  const tierMap = Object.fromEntries(
    tierCounts.map((t) => [t.tier, t._count.tier])
  )

  return {
    total: totalDealers,
    active: activeDealers,
    pending: pendingDealers,
    byTier: {
      platinum: tierMap.platinum || 0,
      gold: tierMap.gold || 0,
      silver: tierMap.silver || 0,
      bronze: tierMap.bronze || 0,
    },
  }
}

export async function getParentDealers() {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.dealer.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })
}

// Dealer CRUD Operations

export type DealerDetail = {
  id: string
  code: string
  name: string
  status: string
  tier: string
  ein: string | null
  licenseNumber: string | null
  insurancePolicy: string | null
  parentDealerId: string | null
  createdAt: Date
  updatedAt: Date
  parentDealer: {
    id: string
    name: string
    code: string
  } | null
  _count: {
    users: number
    orders: number
    childDealers: number
  }
}

export async function getDealer(id: string): Promise<DealerDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  return prisma.dealer.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      tier: true,
      ein: true,
      licenseNumber: true,
      insurancePolicy: true,
      parentDealerId: true,
      createdAt: true,
      updatedAt: true,
      parentDealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          users: true,
          orders: true,
          childDealers: true,
        },
      },
    },
  })
}

export type CreateDealerState = {
  success: boolean
  message: string
  dealerId?: string
  errors?: Record<string, string[]>
}

export async function createDealer(input: CreateDealerInput): Promise<CreateDealerState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = createDealerSchema.parse(input)

    // Check if code already exists
    const existingDealer = await prisma.dealer.findUnique({
      where: { code: validatedData.code },
    })

    if (existingDealer) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { code: ['Dealer code is already in use'] },
      }
    }

    // Validate parent dealer if provided
    if (validatedData.parentDealerId) {
      const parentDealer = await prisma.dealer.findUnique({
        where: { id: validatedData.parentDealerId },
      })
      if (!parentDealer) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { parentDealerId: ['Parent dealer not found'] },
        }
      }
    }

    const dealer = await prisma.dealer.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        status: validatedData.status,
        tier: validatedData.tier,
        ein: validatedData.ein || null,
        licenseNumber: validatedData.licenseNumber || null,
        insurancePolicy: validatedData.insurancePolicy || null,
        parentDealerId: validatedData.parentDealerId || null,
      },
    })

    revalidatePath('/admin/dealers')
    return {
      success: true,
      message: 'Dealer created successfully',
      dealerId: dealer.id,
    }
  } catch (error) {
    console.error('Create dealer error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while creating the dealer' }
  }
}

export type UpdateDealerState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function updateDealer(input: UpdateDealerInput): Promise<UpdateDealerState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = updateDealerSchema.parse(input)
    const { id, ...updateData } = validatedData

    const existingDealer = await prisma.dealer.findUnique({
      where: { id },
    })

    if (!existingDealer) {
      return { success: false, message: 'Dealer not found' }
    }

    // Check code uniqueness if changing
    if (updateData.code && updateData.code !== existingDealer.code) {
      const codeExists = await prisma.dealer.findUnique({
        where: { code: updateData.code },
      })
      if (codeExists) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { code: ['Dealer code is already in use'] },
        }
      }
    }

    // Validate parent dealer if changing
    if (updateData.parentDealerId) {
      // Prevent circular reference
      if (updateData.parentDealerId === id) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { parentDealerId: ['Dealer cannot be its own parent'] },
        }
      }
      const parentDealer = await prisma.dealer.findUnique({
        where: { id: updateData.parentDealerId },
      })
      if (!parentDealer) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { parentDealerId: ['Parent dealer not found'] },
        }
      }
    }

    // Build update data, filtering out undefined values
    const cleanUpdateData: Record<string, unknown> = {}
    if (updateData.code !== undefined) cleanUpdateData.code = updateData.code
    if (updateData.name !== undefined) cleanUpdateData.name = updateData.name
    if (updateData.status !== undefined) cleanUpdateData.status = updateData.status
    if (updateData.tier !== undefined) cleanUpdateData.tier = updateData.tier
    if (updateData.ein !== undefined) cleanUpdateData.ein = updateData.ein
    if (updateData.licenseNumber !== undefined) cleanUpdateData.licenseNumber = updateData.licenseNumber
    if (updateData.insurancePolicy !== undefined) cleanUpdateData.insurancePolicy = updateData.insurancePolicy
    if (updateData.parentDealerId !== undefined) cleanUpdateData.parentDealerId = updateData.parentDealerId

    await prisma.dealer.update({
      where: { id },
      data: cleanUpdateData,
    })

    revalidatePath('/admin/dealers')
    revalidatePath(`/admin/dealers/${id}`)
    return { success: true, message: 'Dealer updated successfully' }
  } catch (error) {
    console.error('Update dealer error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while updating the dealer' }
  }
}

export type DeleteDealerState = {
  success: boolean
  message: string
}

export type DealerUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: Date
}

export async function getDealerUsers(dealerId: string): Promise<DealerUser[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.user.findMany({
    where: { dealerId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export type DealerOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: Date
}

export async function getDealerOrders(dealerId: string): Promise<DealerOrder[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.order.findMany({
    where: { dealerId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export type DealerContact = {
  id: string
  type: string
  name: string
  email: string
  phone: string | null
  isPrimary: boolean
}

export async function getDealerContacts(dealerId: string): Promise<DealerContact[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.dealerContact.findMany({
    where: { dealerId },
    select: {
      id: true,
      type: true,
      name: true,
      email: true,
      phone: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  })
}

export type DealerAddress = {
  id: string
  type: string
  street: string
  street2: string | null
  city: string
  state: string
  zipCode: string
  country: string
  isPrimary: boolean
}

export async function getDealerAddresses(dealerId: string): Promise<DealerAddress[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.dealerAddress.findMany({
    where: { dealerId },
    select: {
      id: true,
      type: true,
      street: true,
      street2: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }],
  })
}

// Hierarchy types and functions

export type DealerHierarchyNode = {
  id: string
  code: string
  name: string
  status: string
  tier: string
  _count: {
    users: number
    orders: number
  }
  children: DealerHierarchyNode[]
}

export async function getDealerHierarchy(): Promise<DealerHierarchyNode[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  // Fetch all dealers with counts
  const allDealers = await prisma.dealer.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      tier: true,
      parentDealerId: true,
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Build tree structure
  const dealerMap = new Map<string, DealerHierarchyNode>()
  const rootDealers: DealerHierarchyNode[] = []

  // First pass: create all nodes
  allDealers.forEach((dealer) => {
    dealerMap.set(dealer.id, {
      id: dealer.id,
      code: dealer.code,
      name: dealer.name,
      status: dealer.status,
      tier: dealer.tier,
      _count: dealer._count,
      children: [],
    })
  })

  // Second pass: build tree
  allDealers.forEach((dealer) => {
    const node = dealerMap.get(dealer.id)!
    if (dealer.parentDealerId) {
      const parent = dealerMap.get(dealer.parentDealerId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        rootDealers.push(node)
      }
    } else {
      rootDealers.push(node)
    }
  })

  return rootDealers
}

export type DealerSubtree = {
  dealer: DealerHierarchyNode
  ancestors: { id: string; code: string; name: string }[]
  descendants: DealerHierarchyNode[]
}

export async function getDealerSubtree(dealerId: string): Promise<DealerSubtree | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      tier: true,
      parentDealerId: true,
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
    },
  })

  if (!dealer) {
    return null
  }

  // Get ancestors (walk up the tree)
  const ancestors: { id: string; code: string; name: string }[] = []
  let currentParentId = dealer.parentDealerId

  while (currentParentId) {
    const parent = await prisma.dealer.findUnique({
      where: { id: currentParentId },
      select: {
        id: true,
        code: true,
        name: true,
        parentDealerId: true,
      },
    })
    if (parent) {
      ancestors.unshift({ id: parent.id, code: parent.code, name: parent.name })
      currentParentId = parent.parentDealerId
    } else {
      break
    }
  }

  // Get all descendants recursively
  async function getDescendants(parentId: string): Promise<DealerHierarchyNode[]> {
    const children = await prisma.dealer.findMany({
      where: { parentDealerId: parentId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        tier: true,
        _count: {
          select: {
            users: true,
            orders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const nodes: DealerHierarchyNode[] = []
    for (const child of children) {
      const descendants = await getDescendants(child.id)
      nodes.push({
        ...child,
        children: descendants,
      })
    }
    return nodes
  }

  const descendants = await getDescendants(dealerId)

  return {
    dealer: {
      id: dealer.id,
      code: dealer.code,
      name: dealer.name,
      status: dealer.status,
      tier: dealer.tier,
      _count: dealer._count,
      children: descendants,
    },
    ancestors,
    descendants,
  }
}

export async function deleteDealer(id: string): Promise<DeleteDealerState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  // Only super_admin can delete dealers
  if (session.user.role !== 'super_admin') {
    return { success: false, message: 'Only super admins can delete dealers' }
  }

  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            childDealers: true,
          },
        },
      },
    })

    if (!dealer) {
      return { success: false, message: 'Dealer not found' }
    }

    // Prevent deletion if dealer has users, orders, or child dealers
    if (dealer._count.users > 0) {
      return { success: false, message: 'Cannot delete dealer with associated users' }
    }
    if (dealer._count.orders > 0) {
      return { success: false, message: 'Cannot delete dealer with associated orders' }
    }
    if (dealer._count.childDealers > 0) {
      return { success: false, message: 'Cannot delete dealer with child dealers' }
    }

    await prisma.dealer.delete({ where: { id } })

    revalidatePath('/admin/dealers')
    return { success: true, message: 'Dealer deleted successfully' }
  } catch (error) {
    console.error('Delete dealer error:', error)
    return { success: false, message: 'An error occurred while deleting the dealer' }
  }
}
