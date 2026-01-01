'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import {
  userFilterSchema,
  bulkActionSchema,
  createUserSchema,
  updateUserSchema,
  type UserFilterInput,
  type BulkActionInput,
  type CreateUserInput,
  type UpdateUserInput,
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

// User CRUD Operations

export type UserDetail = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  status: string
  mfaEnabled: boolean
  dealerId: string | null
  createdAt: Date
  updatedAt: Date
  dealer: {
    id: string
    name: string
    code: string
  } | null
}

export async function getUser(id: string): Promise<UserDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      mfaEnabled: true,
      dealerId: true,
      createdAt: true,
      updatedAt: true,
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  })
}

export type CreateUserState = {
  success: boolean
  message: string
  userId?: string
  errors?: Record<string, string[]>
}

export async function createUser(input: CreateUserInput): Promise<CreateUserState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = createUserSchema.parse(input)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { email: ['Email is already in use'] },
      }
    }

    // Only super_admin can create super_admin users
    if (validatedData.role === 'super_admin' && session.user.role !== 'super_admin') {
      return {
        success: false,
        message: 'Only super admins can create super admin users',
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        role: validatedData.role,
        status: validatedData.status,
        dealerId: validatedData.dealerId || null,
      },
    })

    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User created successfully',
      userId: user.id,
    }
  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while creating the user' }
  }
}

export type UpdateUserState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function updateUser(input: UpdateUserInput): Promise<UpdateUserState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = updateUserSchema.parse(input)
    const { id, ...updateData } = validatedData

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return { success: false, message: 'User not found' }
    }

    // Prevent modifying own role/status
    if (id === session.user.id && (updateData.role || updateData.status)) {
      return { success: false, message: 'Cannot modify your own role or status' }
    }

    // Only super_admin can modify super_admin users
    if (existingUser.role === 'super_admin' && session.user.role !== 'super_admin') {
      return { success: false, message: 'Only super admins can modify super admin users' }
    }

    // Only super_admin can promote to super_admin
    if (updateData.role === 'super_admin' && session.user.role !== 'super_admin') {
      return { success: false, message: 'Only super admins can assign super admin role' }
    }

    // Check email uniqueness if changing
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      })
      if (emailExists) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { email: ['Email is already in use'] },
        }
      }
    }

    // Build update data, filtering out undefined values
    const cleanUpdateData: Record<string, unknown> = {}
    if (updateData.email !== undefined) cleanUpdateData.email = updateData.email
    if (updateData.firstName !== undefined) cleanUpdateData.firstName = updateData.firstName
    if (updateData.lastName !== undefined) cleanUpdateData.lastName = updateData.lastName
    if (updateData.phone !== undefined) cleanUpdateData.phone = updateData.phone
    if (updateData.role !== undefined) cleanUpdateData.role = updateData.role
    if (updateData.status !== undefined) cleanUpdateData.status = updateData.status
    if (updateData.dealerId !== undefined) cleanUpdateData.dealerId = updateData.dealerId

    await prisma.user.update({
      where: { id },
      data: cleanUpdateData,
    })

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${id}`)
    return { success: true, message: 'User updated successfully' }
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while updating the user' }
  }
}

export type DeleteUserState = {
  success: boolean
  message: string
}

export async function deleteUser(id: string): Promise<DeleteUserState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  // Only super_admin can delete users
  if (session.user.role !== 'super_admin') {
    return { success: false, message: 'Only super admins can delete users' }
  }

  // Prevent deleting own account
  if (id === session.user.id) {
    return { success: false, message: 'Cannot delete your own account' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    await prisma.user.delete({ where: { id } })

    revalidatePath('/admin/users')
    return { success: true, message: 'User deleted successfully' }
  } catch (error) {
    console.error('Delete user error:', error)
    return { success: false, message: 'An error occurred while deleting the user' }
  }
}
