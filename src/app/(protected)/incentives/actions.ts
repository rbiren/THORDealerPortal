'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  enrollDealer,
  withdrawEnrollment,
  getDealerEnrollments,
  getDealerIncentivesDashboard,
  getDealerAccrualSummary,
} from '@/lib/services/incentives'

// Types

export type AvailableProgram = {
  id: string
  name: string
  code: string
  description: string | null
  type: string
  subtype: string | null
  startDate: Date
  endDate: Date | null
  enrollmentDeadline: Date | null
  eligibleTiers: string[]
  rules: {
    tiers?: Array<{ name: string; minVolume: number; rate: number }>
    flatRate?: number
    maxPayoutPerDealer?: number
  }
  isEnrolled: boolean
  enrollmentStatus: string | null
}

export type DealerEnrollment = {
  id: string
  programId: string
  program: {
    id: string
    name: string
    code: string
    type: string
    startDate: Date
    endDate: Date | null
    rules: string
  }
  status: string
  enrolledAt: Date
  approvedAt: Date | null
  accruedAmount: number
  paidAmount: number
  pendingAmount: number
  tierAchieved: string | null
  tierProgress: number
}

export type IncentivesDashboardData = {
  activePrograms: number
  totalAccrued: number
  totalPaid: number
  pendingAmount: number
  ytdPaid: number
  recentClaims: Array<{
    id: string
    claimNumber: string
    status: string
    requestedAmount: number
    createdAt: Date
    program: { name: string }
  }>
  recentPayouts: Array<{
    id: string
    amount: number
    paidDate: Date | null
    program: { name: string }
  }>
  enrollments: DealerEnrollment[]
}

// Get available programs for dealer

export async function getAvailablePrograms(): Promise<AvailableProgram[]> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return []
  }

  const dealerId = session.user.dealerId

  // Get dealer info for tier check
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: { tier: true },
  })

  // Get active programs
  const programs = await prisma.incentiveProgram.findMany({
    where: {
      status: 'active',
      OR: [
        { enrollmentDeadline: null },
        { enrollmentDeadline: { gte: new Date() } },
      ],
    },
    orderBy: { startDate: 'desc' },
  })

  // Get dealer's enrollments
  const enrollments = await prisma.dealerProgramEnrollment.findMany({
    where: { dealerId },
    select: { programId: true, status: true },
  })

  const enrollmentMap = new Map(enrollments.map((e) => [e.programId, e.status]))

  // Filter by eligible tier and map to result
  return programs
    .filter((p) => {
      if (!p.eligibleTiers) return true
      const tiers = JSON.parse(p.eligibleTiers)
      return tiers.length === 0 || tiers.includes(dealer?.tier || '')
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      type: p.type,
      subtype: p.subtype,
      startDate: p.startDate,
      endDate: p.endDate,
      enrollmentDeadline: p.enrollmentDeadline,
      eligibleTiers: p.eligibleTiers ? JSON.parse(p.eligibleTiers) : [],
      rules: JSON.parse(p.rules),
      isEnrolled: enrollmentMap.has(p.id),
      enrollmentStatus: enrollmentMap.get(p.id) || null,
    }))
}

// Get program detail for dealer

export async function getProgramDetail(programId: string): Promise<{
  program: AvailableProgram | null
  enrollment: DealerEnrollment | null
  accrualHistory: Array<{
    id: string
    periodType: string
    periodStart: Date
    periodEnd: Date
    qualifyingVolume: number
    rebateRate: number
    accruedAmount: number
    finalAmount: number
    tierAchieved: string | null
    status: string
  }>
}> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return { program: null, enrollment: null, accrualHistory: [] }
  }

  const dealerId = session.user.dealerId

  const program = await prisma.incentiveProgram.findUnique({
    where: { id: programId },
  })

  if (!program) {
    return { program: null, enrollment: null, accrualHistory: [] }
  }

  const enrollment = await prisma.dealerProgramEnrollment.findUnique({
    where: { dealerId_programId: { dealerId, programId } },
    include: {
      program: true,
    },
  })

  const accrualHistory = await prisma.rebateAccrual.findMany({
    where: { dealerId, programId },
    orderBy: { periodStart: 'desc' },
    take: 12,
  })

  return {
    program: {
      id: program.id,
      name: program.name,
      code: program.code,
      description: program.description,
      type: program.type,
      subtype: program.subtype,
      startDate: program.startDate,
      endDate: program.endDate,
      enrollmentDeadline: program.enrollmentDeadline,
      eligibleTiers: program.eligibleTiers ? JSON.parse(program.eligibleTiers) : [],
      rules: JSON.parse(program.rules),
      isEnrolled: !!enrollment,
      enrollmentStatus: enrollment?.status || null,
    },
    enrollment: enrollment
      ? {
          id: enrollment.id,
          programId: enrollment.programId,
          program: enrollment.program,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          approvedAt: enrollment.approvedAt,
          accruedAmount: enrollment.accruedAmount,
          paidAmount: enrollment.paidAmount,
          pendingAmount: enrollment.pendingAmount,
          tierAchieved: enrollment.tierAchieved,
          tierProgress: enrollment.tierProgress,
        }
      : null,
    accrualHistory: accrualHistory.map((a) => ({
      id: a.id,
      periodType: a.periodType,
      periodStart: a.periodStart,
      periodEnd: a.periodEnd,
      qualifyingVolume: a.qualifyingVolume,
      rebateRate: a.rebateRate,
      accruedAmount: a.accruedAmount,
      finalAmount: a.finalAmount,
      tierAchieved: a.tierAchieved,
      status: a.status,
    })),
  }
}

// Get dealer's enrollments

export async function getMyEnrollments(): Promise<DealerEnrollment[]> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return []
  }

  const enrollments = await prisma.dealerProgramEnrollment.findMany({
    where: { dealerId: session.user.dealerId },
    include: {
      program: true,
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return enrollments.map((e) => ({
    id: e.id,
    programId: e.programId,
    program: e.program,
    status: e.status,
    enrolledAt: e.enrolledAt,
    approvedAt: e.approvedAt,
    accruedAmount: e.accruedAmount,
    paidAmount: e.paidAmount,
    pendingAmount: e.pendingAmount,
    tierAchieved: e.tierAchieved,
    tierProgress: e.tierProgress,
  }))
}

// Enroll in a program

export type EnrollResult = {
  success: boolean
  message: string
  requiresApproval?: boolean
}

export async function enrollInProgram(programId: string, acceptTerms: boolean): Promise<EnrollResult> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return { success: false, message: 'Not authenticated' }
  }

  if (!acceptTerms) {
    return { success: false, message: 'You must accept the program terms to enroll' }
  }

  try {
    const enrollment = await enrollDealer(programId, session.user.dealerId, 'v1.0')

    revalidatePath('/incentives')
    revalidatePath(`/incentives/${programId}`)

    return {
      success: true,
      message: enrollment.status === 'pending'
        ? 'Enrollment submitted! Your application is pending approval.'
        : 'Successfully enrolled in the program!',
      requiresApproval: enrollment.status === 'pending',
    }
  } catch (error) {
    console.error('Enrollment error:', error)
    const message = error instanceof Error ? error.message : 'Failed to enroll in program'
    return { success: false, message }
  }
}

// Withdraw from a program

export async function withdrawFromProgram(enrollmentId: string, reason?: string): Promise<EnrollResult> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return { success: false, message: 'Not authenticated' }
  }

  try {
    // Verify enrollment belongs to dealer
    const enrollment = await prisma.dealerProgramEnrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (!enrollment || enrollment.dealerId !== session.user.dealerId) {
      return { success: false, message: 'Enrollment not found' }
    }

    await withdrawEnrollment(enrollmentId, reason)

    revalidatePath('/incentives')
    revalidatePath(`/incentives/${enrollment.programId}`)

    return { success: true, message: 'Successfully withdrawn from the program' }
  } catch (error) {
    console.error('Withdraw error:', error)
    return { success: false, message: 'Failed to withdraw from program' }
  }
}

// Get dashboard data

export async function getDashboardData(): Promise<IncentivesDashboardData | null> {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return null
  }

  try {
    const data = await getDealerIncentivesDashboard(session.user.dealerId)

    return {
      activePrograms: data.activePrograms,
      totalAccrued: data.totalAccrued,
      totalPaid: data.totalPaid,
      pendingAmount: data.pendingAmount,
      ytdPaid: data.ytdPaid,
      recentClaims: data.recentClaims,
      recentPayouts: data.recentPayouts,
      enrollments: data.enrollments.map((e: DealerEnrollment) => ({
        id: e.id,
        programId: e.programId,
        program: e.program,
        status: e.status,
        enrolledAt: e.enrolledAt,
        approvedAt: e.approvedAt,
        accruedAmount: e.accruedAmount,
        paidAmount: e.paidAmount,
        pendingAmount: e.pendingAmount,
        tierAchieved: e.tierAchieved,
        tierProgress: e.tierProgress,
      })),
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return null
  }
}

// Get claims for dealer

export async function getMyClaims() {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return []
  }

  return prisma.incentiveClaim.findMany({
    where: { dealerId: session.user.dealerId },
    include: {
      program: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

// Get payouts for dealer

export async function getMyPayouts() {
  const session = await auth()

  if (!session?.user?.dealerId) {
    return []
  }

  return prisma.incentivePayout.findMany({
    where: { dealerId: session.user.dealerId },
    include: {
      program: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
