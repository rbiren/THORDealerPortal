'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  userFilterSchema,
  bulkActionSchema,
  type UserFilterInput,
  type BulkActionInput,
} from '@/lib/validations/user'

export type UserListItem = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  phone: string | null
  createdAt: Date
  dealer: {
    id: string
    name: string
    code: string
  } | null
}

export type UserListResult = {
  users: UserListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getUsers(input: UserFilterInput): Promise<UserListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { users: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const validatedInput = userFilterSchema.parse(input)
  const { search, role, status, dealerId, page, pageSize, sortBy, sortOrder } = validatedInput

  // Build where clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }

  if (role && role !== 'all') {
    where.role = role
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (dealerId) {
    where.dealerId = dealerId
  }

  // Get total count
  const total = await prisma.user.count({ where })

  // Get users with pagination
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
      dealer: {
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
    users,
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

export async function bulkUserAction(input: BulkActionInput): Promise<BulkActionState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized', affected: 0 }
  }

  try {
    const validatedInput = bulkActionSchema.parse(input)
    const { userIds, action } = validatedInput

    // Prevent modifying own account
    if (userIds.includes(session.user.id)) {
      return { success: false, message: 'Cannot modify your own account', affected: 0 }
    }

    let affected = 0

    switch (action) {
      case 'activate':
        const activateResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: 'active' },
        })
        affected = activateResult.count
        break

      case 'deactivate':
        const deactivateResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: 'inactive' },
        })
        affected = deactivateResult.count
        break

      case 'suspend':
        const suspendResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: 'suspended' },
        })
        affected = suspendResult.count
        break

      case 'delete':
        // Only super_admin can delete users
        if (session.user.role !== 'super_admin') {
          return { success: false, message: 'Only super admins can delete users', affected: 0 }
        }
        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        })
        affected = deleteResult.count
        break

      default:
        return { success: false, message: 'Invalid action', affected: 0 }
    }

    revalidatePath('/admin/users')
    return {
      success: true,
      message: `Successfully ${action}d ${affected} user(s)`,
      affected,
    }
  } catch (error) {
    console.error('Bulk action error:', error)
    return { success: false, message: 'An error occurred', affected: 0 }
  }
}

export async function getDealers() {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.dealer.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })
}
