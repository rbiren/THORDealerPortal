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
  runBatchAccrual,
  finalizeAccruals,
  getProgramAccrualSummary,
  calculatePeriodDates,
  getPendingClaims,
  reviewClaimAction as reviewClaimService,
  markClaimUnderReview,
  batchApproveClaims,
  createPayoutFromClaim,
  processPayoutAction as processPayoutService,
  getPayoutReport,
  getScheduledPayouts,
  runCoopAccrualBatch,
  type CreateProgramInput,
  type UpdateProgramInput,
  type ProgramRules,
  type AccrualRunResult,
  type ReviewClaimInput,
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

  type ProgramQueryResult = {
    id: string
    name: string
    code: string
    type: string
    subtype: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    enrollmentDeadline: Date | null
    eligibleTiers: string | null
    budgetAmount: number | null
    spentAmount: number
    createdAt: Date
    _count: { enrollments: number }
  }

  const result: ProgramListItem[] = programs.map((p: ProgramQueryResult) => ({
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

  type EnrollmentQueryResult = {
    id: string
    dealer: { id: string; name: string; code: string; tier: string }
    status: string
    enrolledAt: Date
    approvedAt: Date | null
    accruedAmount: number
    paidAmount: number
    pendingAmount: number
  }

  return enrollments.map((e: EnrollmentQueryResult) => ({
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
export async function getProgramTypes() {
  return [
    { value: 'rebate', label: 'Rebate' },
    { value: 'coop', label: 'Co-op Fund' },
    { value: 'contest', label: 'Contest' },
    { value: 'spiff', label: 'Spiff' },
  ]
}

// Get status options for filter dropdown
export async function getStatusOptions() {
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

// ============================================================================
// REBATE CALCULATION ACTIONS
// ============================================================================

export type RunAccrualState = {
  success: boolean
  message: string
  result?: AccrualRunResult
}

export type AccrualSummary = {
  totalCalculated: number
  totalFinalized: number
  totalPaid: number
  calculatedAmount: number
  finalizedAmount: number
  paidAmount: number
  periods: Array<{
    periodStart: Date
    periodEnd: Date
    periodType: string
    dealerCount: number
    totalAmount: number
    status: string
  }>
}

// Run batch accrual calculation for a program
export async function runAccrualCalculation(
  programId: string,
  options: {
    periodType?: 'monthly' | 'quarterly' | 'annual'
    periodStart?: string
    periodEnd?: string
    recalculate?: boolean
  } = {}
): Promise<RunAccrualState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const program = await prisma.incentiveProgram.findUnique({
      where: { id: programId },
    })

    if (!program) {
      return { success: false, message: 'Program not found' }
    }

    if (program.type !== 'rebate') {
      return { success: false, message: 'Accrual calculations only apply to rebate programs' }
    }

    if (program.status !== 'active') {
      return { success: false, message: 'Program must be active to run calculations' }
    }

    const result = await runBatchAccrual(programId, {
      periodType: options.periodType,
      periodStart: options.periodStart ? new Date(options.periodStart) : undefined,
      periodEnd: options.periodEnd ? new Date(options.periodEnd) : undefined,
      recalculate: options.recalculate,
    })

    revalidatePath(`/admin/incentives/${programId}`)
    return {
      success: true,
      message: `Calculated accruals for ${result.processedCount} dealers. Total: $${result.totalAccrued.toFixed(2)}`,
      result,
    }
  } catch (error) {
    console.error('Run accrual error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, message: errorMessage }
  }
}

// Finalize accruals for payout
export async function finalizeAccrualsAction(
  programId: string,
  periodStart: string,
  periodEnd: string
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const result = await finalizeAccruals(
      programId,
      new Date(periodStart),
      new Date(periodEnd)
    )

    revalidatePath(`/admin/incentives/${programId}`)
    return {
      success: true,
      message: `Finalized ${result.count} accruals totaling $${result.totalAmount.toFixed(2)}`,
    }
  } catch (error) {
    console.error('Finalize accruals error:', error)
    return { success: false, message: 'An error occurred while finalizing accruals' }
  }
}

// Get accrual summary for a program
export async function getAccrualSummaryAction(programId: string): Promise<AccrualSummary | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  try {
    return await getProgramAccrualSummary(programId)
  } catch (error) {
    console.error('Get accrual summary error:', error)
    return null
  }
}

// Get available periods for calculation
export async function getAvailablePeriods() {
  const now = new Date()
  const periods: Array<{
    label: string
    periodType: 'monthly' | 'quarterly' | 'annual'
    periodStart: string
    periodEnd: string
  }> = []

  // Current month
  const { periodStart: monthStart, periodEnd: monthEnd } = calculatePeriodDates('monthly', now)
  periods.push({
    label: `Current Month (${monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
    periodType: 'monthly',
    periodStart: monthStart.toISOString(),
    periodEnd: monthEnd.toISOString(),
  })

  // Previous month
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const { periodStart: prevMonthStart, periodEnd: prevMonthEnd } = calculatePeriodDates('monthly', prevMonth)
  periods.push({
    label: `Previous Month (${prevMonthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
    periodType: 'monthly',
    periodStart: prevMonthStart.toISOString(),
    periodEnd: prevMonthEnd.toISOString(),
  })

  // Current quarter
  const { periodStart: qtrStart, periodEnd: qtrEnd } = calculatePeriodDates('quarterly', now)
  const qtrLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
  periods.push({
    label: `Current Quarter (${qtrLabel})`,
    periodType: 'quarterly',
    periodStart: qtrStart.toISOString(),
    periodEnd: qtrEnd.toISOString(),
  })

  // Previous quarter
  const prevQtr = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const { periodStart: prevQtrStart, periodEnd: prevQtrEnd } = calculatePeriodDates('quarterly', prevQtr)
  const prevQtrLabel = `Q${Math.floor(prevQtr.getMonth() / 3) + 1} ${prevQtr.getFullYear()}`
  periods.push({
    label: `Previous Quarter (${prevQtrLabel})`,
    periodType: 'quarterly',
    periodStart: prevQtrStart.toISOString(),
    periodEnd: prevQtrEnd.toISOString(),
  })

  // Current year
  const { periodStart: yearStart, periodEnd: yearEnd } = calculatePeriodDates('annual', now)
  periods.push({
    label: `Current Year (${now.getFullYear()})`,
    periodType: 'annual',
    periodStart: yearStart.toISOString(),
    periodEnd: yearEnd.toISOString(),
  })

  return periods
}

// Get accrual details for a specific period
export async function getPeriodAccruals(
  programId: string,
  periodStart: string,
  periodEnd: string
): Promise<Array<{
  id: string
  dealer: { id: string; name: string; code: string }
  qualifyingVolume: number
  rebateRate: number
  accruedAmount: number
  finalAmount: number
  tierAchieved: string | null
  status: string
}>> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const accruals = await prisma.rebateAccrual.findMany({
    where: {
      programId,
      periodStart: new Date(periodStart),
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
    },
    orderBy: { finalAmount: 'desc' },
  })

  type AccrualQueryResult = {
    id: string
    dealer: { id: string; name: string; code: string }
    qualifyingVolume: number
    rebateRate: number
    accruedAmount: number
    finalAmount: number
    tierAchieved: string | null
    status: string
  }

  return accruals.map((a: AccrualQueryResult) => ({
    id: a.id,
    dealer: a.dealer,
    qualifyingVolume: a.qualifyingVolume,
    rebateRate: a.rebateRate,
    accruedAmount: a.accruedAmount,
    finalAmount: a.finalAmount,
    tierAchieved: a.tierAchieved,
    status: a.status,
  }))
}

// ============================================================================
// CO-OP FUND MANAGEMENT (8.2.6)
// ============================================================================

export async function runCoopAccrualAction(
  programId: string,
  periodStart: string,
  periodEnd: string
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const result = await runCoopAccrualBatch(
      programId,
      new Date(periodStart),
      new Date(periodEnd)
    )

    revalidatePath(`/admin/incentives/${programId}`)
    return {
      success: true,
      message: `Processed ${result.processed} dealers. Total accrued: $${result.totalAccrued.toFixed(2)}`,
    }
  } catch (error) {
    console.error('Co-op accrual error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, message: errorMessage }
  }
}

// ============================================================================
// CLAIM APPROVAL WORKFLOW (8.2.8)
// ============================================================================

export type ClaimListItem = {
  id: string
  claimNumber: string
  program: { id: string; name: string; type: string }
  dealer: { id: string; name: string; code: string }
  submittedBy: { id: string; firstName: string; lastName: string } | null
  claimType: string
  requestedAmount: number
  status: string
  submittedAt: Date | null
  documents: Array<{ id: string; fileName: string; documentType: string }>
}

export type ClaimListResult = {
  claims: ClaimListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getAdminClaims(options: {
  programId?: string
  status?: string[]
  page?: number
  pageSize?: number
} = {}): Promise<ClaimListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { claims: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
  }

  const { programId, status, page = 1, pageSize = 20 } = options

  const result = await getPendingClaims({
    programId,
    status: status || ['submitted', 'under_review'],
    page,
    limit: pageSize,
  })

  type ClaimQueryResult = {
    id: string
    claimNumber: string
    program: { id: string; name: string }
    dealer: { id: string; name: string; code: string }
    submittedBy: { id: string; firstName: string | null; lastName: string | null } | null
    claimType: string
    requestedAmount: number
    status: string
    submittedAt: Date | null
    documents: Array<{ id: string; fileName: string }>
  }

  return {
    claims: result.claims.map((c: ClaimQueryResult) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      program: c.program,
      dealer: c.dealer,
      submittedBy: c.submittedBy,
      claimType: c.claimType,
      requestedAmount: c.requestedAmount,
      status: c.status,
      submittedAt: c.submittedAt,
      documents: c.documents,
    })),
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.limit,
    totalPages: result.pagination.totalPages,
  }
}

export type ClaimDetail = {
  id: string
  claimNumber: string
  programId: string
  program: { id: string; name: string; type: string }
  dealer: { id: string; name: string; code: string }
  submittedBy: { id: string; firstName: string; lastName: string } | null
  reviewedBy: { id: string; firstName: string; lastName: string } | null
  claimType: string
  requestedAmount: number
  approvedAmount: number | null
  status: string
  description: string | null
  supportingInfo: string | null
  submittedAt: Date | null
  reviewedAt: Date | null
  approvedAt: Date | null
  reviewNotes: string | null
  denialReason: string | null
  documents: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
    documentType: string
    uploadedAt: Date
  }>
}

export async function getClaimDetail(claimId: string): Promise<ClaimDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  const claim = await prisma.incentiveClaim.findUnique({
    where: { id: claimId },
    include: {
      program: { select: { id: true, name: true, type: true } },
      dealer: { select: { id: true, name: true, code: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      documents: true,
    },
  })

  if (!claim) return null

  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    programId: claim.programId,
    program: claim.program,
    dealer: claim.dealer,
    submittedBy: claim.submittedBy,
    reviewedBy: claim.reviewedBy,
    claimType: claim.claimType,
    requestedAmount: claim.requestedAmount,
    approvedAmount: claim.approvedAmount,
    status: claim.status,
    description: claim.description,
    supportingInfo: claim.supportingInfo,
    submittedAt: claim.submittedAt,
    reviewedAt: claim.reviewedAt,
    approvedAt: claim.approvedAt,
    reviewNotes: claim.reviewNotes,
    denialReason: claim.denialReason,
    documents: claim.documents.map((d: { id: string; fileName: string; fileType: string; fileSize: number; documentType: string | null; uploadedAt: Date }) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      documentType: d.documentType,
      uploadedAt: d.uploadedAt,
    })),
  }
}

export type ReviewClaimState = {
  success: boolean
  message: string
}

export async function reviewClaimAction(
  claimId: string,
  input: ReviewClaimInput
): Promise<ReviewClaimState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await reviewClaimService(claimId, session.user.id, input)

    revalidatePath('/admin/incentives/claims')
    return {
      success: true,
      message: input.decision === 'approved' ? 'Claim approved successfully' : 'Claim denied',
    }
  } catch (error) {
    console.error('Review claim error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, message: errorMessage }
  }
}

export async function startClaimReview(claimId: string): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await markClaimUnderReview(claimId, session.user.id)

    revalidatePath('/admin/incentives/claims')
    return { success: true, message: 'Claim marked for review' }
  } catch (error) {
    console.error('Start claim review error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

export async function batchApproveClaimsAction(
  claimIds: string[],
  reviewNotes?: string
): Promise<{ success: boolean; message: string; approved: number; errors: string[] }> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized', approved: 0, errors: [] }
  }

  try {
    const result = await batchApproveClaims(claimIds, session.user.id, reviewNotes)

    revalidatePath('/admin/incentives/claims')
    return {
      success: result.errors.length === 0,
      message: `Approved ${result.approved} claims`,
      approved: result.approved,
      errors: result.errors,
    }
  } catch (error) {
    console.error('Batch approve error:', error)
    return { success: false, message: 'An error occurred', approved: 0, errors: [] }
  }
}

// Get claim statistics for dashboard
export async function getClaimStats(): Promise<{
  pending: number
  underReview: number
  approvedToday: number
  deniedToday: number
  totalPendingAmount: number
}> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { pending: 0, underReview: 0, approvedToday: 0, deniedToday: 0, totalPendingAmount: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [pending, underReview, approvedToday, deniedToday, pendingAmount] = await Promise.all([
    prisma.incentiveClaim.count({ where: { status: 'submitted' } }),
    prisma.incentiveClaim.count({ where: { status: 'under_review' } }),
    prisma.incentiveClaim.count({
      where: { status: 'approved', approvedAt: { gte: today } },
    }),
    prisma.incentiveClaim.count({
      where: { status: 'denied', reviewedAt: { gte: today } },
    }),
    prisma.incentiveClaim.aggregate({
      where: { status: { in: ['submitted', 'under_review'] } },
      _sum: { requestedAmount: true },
    }),
  ])

  return {
    pending,
    underReview,
    approvedToday,
    deniedToday,
    totalPendingAmount: pendingAmount._sum.requestedAmount || 0,
  }
}

// ============================================================================
// PAYOUT MANAGEMENT (8.2.9)
// ============================================================================

export type PayoutListItem = {
  id: string
  program: { id: string; name: string; type: string }
  dealer: { id: string; name: string; code: string }
  amount: number
  payoutType: string
  status: string
  scheduledDate: Date | null
  paidDate: Date | null
  referenceNumber: string | null
  createdAt: Date
}

export type PayoutListResult = {
  payouts: PayoutListItem[]
  totals: {
    totalAmount: number
    completedAmount: number
    pendingAmount: number
    count: number
    completedCount: number
    pendingCount: number
  }
}

export async function getAdminPayouts(options: {
  programId?: string
  dealerId?: string
  status?: string
  startDate?: string
  endDate?: string
} = {}): Promise<PayoutListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return {
      payouts: [],
      totals: { totalAmount: 0, completedAmount: 0, pendingAmount: 0, count: 0, completedCount: 0, pendingCount: 0 },
    }
  }

  const result = await getPayoutReport({
    programId: options.programId,
    dealerId: options.dealerId,
    status: options.status,
    startDate: options.startDate ? new Date(options.startDate) : undefined,
    endDate: options.endDate ? new Date(options.endDate) : undefined,
  })

  type PayoutQueryResult = {
    id: string
    program: { id: string; name: string }
    dealer: { id: string; name: string; code: string }
    amount: number
    payoutType: string
    status: string
    scheduledDate: Date | null
    paidDate: Date | null
    referenceNumber: string | null
    createdAt: Date
  }

  return {
    payouts: result.payouts.map((p: PayoutQueryResult) => ({
      id: p.id,
      program: p.program,
      dealer: p.dealer,
      amount: p.amount,
      payoutType: p.payoutType,
      status: p.status,
      scheduledDate: p.scheduledDate,
      paidDate: p.paidDate,
      referenceNumber: p.referenceNumber,
      createdAt: p.createdAt,
    })),
    totals: result.totals,
  }
}

export async function createPayoutFromApprovedClaim(
  claimId: string,
  scheduledDate?: string
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await createPayoutFromClaim(claimId, scheduledDate ? new Date(scheduledDate) : undefined)

    revalidatePath('/admin/incentives/claims')
    revalidatePath('/admin/incentives/payouts')
    return { success: true, message: 'Payout created successfully' }
  } catch (error) {
    console.error('Create payout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, message: errorMessage }
  }
}

export async function processPayoutAction(
  payoutId: string,
  referenceNumber: string
): Promise<UpdateProgramState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await processPayoutService(payoutId, session.user.id, referenceNumber)

    revalidatePath('/admin/incentives/payouts')
    return { success: true, message: 'Payout processed successfully' }
  } catch (error) {
    console.error('Process payout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, message: errorMessage }
  }
}

export async function getScheduledPayoutsAction(
  startDate?: string,
  endDate?: string
): Promise<PayoutListItem[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const payouts = await getScheduledPayouts(
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  type ScheduledPayoutResult = {
    id: string
    program: { id: string; name: string }
    dealer: { id: string; name: string; code: string }
    amount: number
    payoutType: string
    status: string
    scheduledDate: Date | null
    paidDate: Date | null
    referenceNumber: string | null
    createdAt: Date
  }

  return payouts.map((p: ScheduledPayoutResult) => ({
    id: p.id,
    program: p.program,
    dealer: p.dealer,
    amount: p.amount,
    payoutType: p.payoutType,
    status: p.status,
    scheduledDate: p.scheduledDate,
    paidDate: p.paidDate,
    referenceNumber: p.referenceNumber,
    createdAt: p.createdAt,
  }))
}

// Get payout summary by program
export async function getPayoutSummaryByProgram(): Promise<Array<{
  programId: string
  programName: string
  programType: string
  totalPaid: number
  pendingAmount: number
  payoutCount: number
}>> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const programs = await prisma.incentiveProgram.findMany({
    where: { status: 'active' },
    include: {
      payouts: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  })

  type ProgramPayoutSummary = {
    id: string
    name: string
    type: string
    payouts: Array<{ amount: number; status: string }>
  }

  return programs.map((p: ProgramPayoutSummary) => ({
    programId: p.id,
    programName: p.name,
    programType: p.type,
    totalPaid: p.payouts.filter((py: { amount: number; status: string }) => py.status === 'completed').reduce((sum: number, py: { amount: number }) => sum + py.amount, 0),
    pendingAmount: p.payouts.filter((py: { amount: number; status: string }) => py.status === 'pending').reduce((sum: number, py: { amount: number }) => sum + py.amount, 0),
    payoutCount: p.payouts.length,
  }))
}
