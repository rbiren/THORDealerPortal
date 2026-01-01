'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  dealerFilterSchema,
  bulkDealerActionSchema,
  type DealerFilterInput,
  type BulkDealerActionInput,
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
