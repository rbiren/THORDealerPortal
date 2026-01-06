'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  createProgram,
  updateProgram,
  getProgram,
  listPrograms,
  activateProgram,
  pauseProgram,
  getProgramStats,
  type CreateProgramInput,
  type UpdateProgramInput,
  type ProgramRules,
} from '@/lib/services/incentives'

// Types

export type ProgramListItem = {
  id: string
  name: string
  code: string
  type: string
  subtype: string | null
  status: string
  startDate: Date
  endDate: Date | null
  enrollmentDeadline: Date | null
  eligibleTiers: string[]
  budgetAmount: number | null
  spentAmount: number
  activeEnrollments: number
  createdAt: Date
}

export type ProgramListResult = {
  programs: ProgramListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ProgramDetail = {
  id: string
  name: string
  code: string
  description: string | null
  type: string
  subtype: string | null
  status: string
  startDate: Date
  endDate: Date | null
  enrollmentDeadline: Date | null
  eligibleTiers: string[]
  eligibleRegions: string[]
  minOrderVolume: number | null
  rules: ProgramRules
  budgetAmount: number | null
  spentAmount: number
  autoEnroll: boolean
  requiresApproval: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  stats: {
    enrollmentCount: number
    activeEnrollments: number
    totalAccrued: number
    totalPaid: number
    claims: Record<string, number>
  }
}

// List programs for admin

export type ProgramFilterInput = {
  search?: string
  type?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function getAdminPrograms(input: ProgramFilterInput): Promise<ProgramListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { programs: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const { search, type, status, page = 1, pageSize = 20 } = input

  // Build where clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (type && type !== 'all') {
    where.type = type
  }

  if (status && status !== 'all') {
    where.status = status
  }

  const [programs, total] = await Promise.all([
    prisma.incentiveProgram.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: { where: { status: 'active' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incentiveProgram.count({ where }),
  ])

  const result: ProgramListItem[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    type: p.type,
    subtype: p.subtype,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    enrollmentDeadline: p.enrollmentDeadline,
    eligibleTiers: p.eligibleTiers ? JSON.parse(p.eligibleTiers) : [],
    budgetAmount: p.budgetAmount,
    spentAmount: p.spentAmount,
    activeEnrollments: p._count.enrollments,
    createdAt: p.createdAt,
  }))

  return {
    programs: result,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// Get single program for editing

export async function getAdminProgram(id: string): Promise<ProgramDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  const [program, stats] = await Promise.all([
    getProgram(id),
    getProgramStats(id),
  ])

  if (!program) return null

  return {
    id: program.id,
    name: program.name,
    code: program.code,
    description: program.description,
    type: program.type,
    subtype: program.subtype,
    status: program.status,
    startDate: program.startDate,
    endDate: program.endDate,
    enrollmentDeadline: program.enrollmentDeadline,
    eligibleTiers: program.eligibleTiers,
    eligibleRegions: program.eligibleRegions,
    minOrderVolume: program.minOrderVolume,
    rules: program.rules,
    budgetAmount: program.budgetAmount,
    spentAmount: program.spentAmount,
    autoEnroll: program.autoEnroll,
    requiresApproval: program.requiresApproval,
    createdBy: program.createdBy,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    stats,
  }
}

// Create program

export type CreateProgramState = {
  success: boolean
  message: string
  programId?: string
  errors?: Record<string, string[]>
}

export async function createIncentiveProgram(input: {
  name: string
  code: string
  description?: string
  type: 'rebate' | 'coop' | 'contest' | 'spiff'
  subtype?: string
  startDate: string
  endDate?: string
  enrollmentDeadline?: string
  eligibleTiers?: string[]
  eligibleRegions?: string[]
  minOrderVolume?: number
  rules: ProgramRules
  budgetAmount?: number
  autoEnroll?: boolean
  requiresApproval?: boolean
}): Promise<CreateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    // Validate required fields
    if (!input.name?.trim()) {
      return { success: false, message: 'Validation failed', errors: { name: ['Name is required'] } }
    }
    if (!input.code?.trim()) {
      return { success: false, message: 'Validation failed', errors: { code: ['Code is required'] } }
    }
    if (!input.type) {
      return { success: false, message: 'Validation failed', errors: { type: ['Type is required'] } }
    }
    if (!input.startDate) {
      return { success: false, message: 'Validation failed', errors: { startDate: ['Start date is required'] } }
    }

    // Check if code already exists
    const existingCode = await prisma.incentiveProgram.findUnique({
      where: { code: input.code },
    })

    if (existingCode) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { code: ['Program code is already in use'] },
      }
    }

    const programInput: CreateProgramInput = {
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      description: input.description?.trim(),
      type: input.type,
      subtype: input.subtype,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      enrollmentDeadline: input.enrollmentDeadline ? new Date(input.enrollmentDeadline) : undefined,
      eligibleTiers: input.eligibleTiers,
      eligibleRegions: input.eligibleRegions,
      minOrderVolume: input.minOrderVolume,
      rules: input.rules || { tiers: [], flatRate: 0 },
      budgetAmount: input.budgetAmount,
      autoEnroll: input.autoEnroll,
      requiresApproval: input.requiresApproval,
      createdBy: session.user.id,
    }

    const program = await createProgram(programInput)

    revalidatePath('/admin/incentives')
    return {
      success: true,
      message: 'Program created successfully',
      programId: program.id,
    }
  } catch (error) {
    console.error('Create program error:', error)
    return { success: false, message: 'An error occurred while creating the program' }
  }
}

// Update program

export type UpdateProgramState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function updateIncentiveProgram(
  id: string,
  input: Partial<{
    name: string
    description: string
    endDate: string
    enrollmentDeadline: string
    eligibleTiers: string[]
    eligibleRegions: string[]
    minOrderVolume: number
    rules: ProgramRules
    budgetAmount: number
    status: string
  }>
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const existingProgram = await prisma.incentiveProgram.findUnique({
      where: { id },
    })

    if (!existingProgram) {
      return { success: false, message: 'Program not found' }
    }

    const updateInput: UpdateProgramInput = {}
    if (input.name !== undefined) updateInput.name = input.name
    if (input.description !== undefined) updateInput.description = input.description
    if (input.endDate !== undefined) updateInput.endDate = input.endDate ? new Date(input.endDate) : undefined
    if (input.enrollmentDeadline !== undefined) {
      updateInput.enrollmentDeadline = input.enrollmentDeadline ? new Date(input.enrollmentDeadline) : undefined
    }
    if (input.eligibleTiers !== undefined) updateInput.eligibleTiers = input.eligibleTiers
    if (input.eligibleRegions !== undefined) updateInput.eligibleRegions = input.eligibleRegions
    if (input.minOrderVolume !== undefined) updateInput.minOrderVolume = input.minOrderVolume
    if (input.rules !== undefined) updateInput.rules = input.rules
    if (input.budgetAmount !== undefined) updateInput.budgetAmount = input.budgetAmount
    if (input.status !== undefined) updateInput.status = input.status

    await updateProgram(id, updateInput)

    revalidatePath('/admin/incentives')
    revalidatePath(`/admin/incentives/${id}`)
    return { success: true, message: 'Program updated successfully' }
  } catch (error) {
    console.error('Update program error:', error)
    return { success: false, message: 'An error occurred while updating the program' }
  }
}

// Activate/Pause program

export async function changeProgramStatus(
  id: string,
  action: 'activate' | 'pause' | 'complete' | 'cancel'
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    switch (action) {
      case 'activate':
        await activateProgram(id)
        break
      case 'pause':
        await pauseProgram(id)
        break
      case 'complete':
        await updateProgram(id, { status: 'completed' })
        break
      case 'cancel':
        await updateProgram(id, { status: 'cancelled' })
        break
    }

    revalidatePath('/admin/incentives')
    revalidatePath(`/admin/incentives/${id}`)
    return { success: true, message: `Program ${action}d successfully` }
  } catch (error) {
    console.error('Change status error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

// Delete program

export type DeleteProgramState = {
  success: boolean
  message: string
}

export async function deleteIncentiveProgram(id: string): Promise<DeleteProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const program = await prisma.incentiveProgram.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            claims: true,
            payouts: true,
          },
        },
      },
    })

    if (!program) {
      return { success: false, message: 'Program not found' }
    }

    // Only allow deletion of draft programs with no enrollments
    if (program.status !== 'draft') {
      return { success: false, message: 'Only draft programs can be deleted' }
    }

    if (program._count.enrollments > 0 || program._count.claims > 0 || program._count.payouts > 0) {
      return { success: false, message: 'Cannot delete program with existing enrollments, claims, or payouts' }
    }

    await prisma.incentiveProgram.delete({ where: { id } })

    revalidatePath('/admin/incentives')
    return { success: true, message: 'Program deleted successfully' }
  } catch (error) {
    console.error('Delete program error:', error)
    return { success: false, message: 'An error occurred while deleting the program' }
  }
}

// Get program enrollments

export type EnrollmentListItem = {
  id: string
  dealer: {
    id: string
    name: string
    code: string
    tier: string
  }
  status: string
  enrolledAt: Date
  approvedAt: Date | null
  accruedAmount: number
  paidAmount: number
  pendingAmount: number
}

export async function getProgramEnrollments(programId: string): Promise<EnrollmentListItem[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const enrollments = await prisma.dealerProgramEnrollment.findMany({
    where: { programId },
    include: {
      dealer: {
        select: { id: true, name: true, code: true, tier: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return enrollments.map((e) => ({
    id: e.id,
    dealer: e.dealer,
    status: e.status,
    enrolledAt: e.enrolledAt,
    approvedAt: e.approvedAt,
    accruedAmount: e.accruedAmount,
    paidAmount: e.paidAmount,
    pendingAmount: e.pendingAmount,
  }))
}

// Approve enrollment

export async function approveEnrollmentAction(enrollmentId: string): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await prisma.dealerProgramEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'active',
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
    })

    revalidatePath('/admin/incentives')
    return { success: true, message: 'Enrollment approved' }
  } catch (error) {
    console.error('Approve enrollment error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

// Get program types for filter dropdown
export function getProgramTypes() {
  return [
    { value: 'rebate', label: 'Rebate' },
    { value: 'coop', label: 'Co-op Fund' },
    { value: 'contest', label: 'Contest' },
    { value: 'spiff', label: 'Spiff' },
  ]
}

// Get status options for filter dropdown
export function getStatusOptions() {
  return [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]
}

// Get dealer tiers for eligibility selection
export async function getDealerTiers() {
  return [
    { value: 'platinum', label: 'Platinum' },
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'bronze', label: 'Bronze' },
  ]
}
