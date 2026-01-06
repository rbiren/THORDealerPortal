/**
 * Incentives & Programs Service
 * Phase 8.2: Rebates, Co-op funds, Contests, Spiffs
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreateProgramInput {
  name: string;
  code: string;
  description?: string;
  type: 'rebate' | 'coop' | 'contest' | 'spiff';
  subtype?: string;
  startDate: Date;
  endDate?: Date;
  enrollmentDeadline?: Date;
  eligibleTiers?: string[];
  eligibleRegions?: string[];
  minOrderVolume?: number;
  rules: ProgramRules;
  budgetAmount?: number;
  autoEnroll?: boolean;
  requiresApproval?: boolean;
  createdBy?: string;
}

export interface ProgramRules {
  tiers?: Array<{
    name: string;
    minVolume: number;
    maxVolume?: number;
    rate: number; // Percentage as decimal (0.03 = 3%)
  }>;
  flatRate?: number;
  maxPayout?: number;
  maxPayoutPerDealer?: number;
  qualifyingProducts?: string[]; // Product category IDs
  excludedProducts?: string[];
}

export interface UpdateProgramInput {
  name?: string;
  description?: string;
  endDate?: Date;
  enrollmentDeadline?: Date;
  eligibleTiers?: string[];
  eligibleRegions?: string[];
  minOrderVolume?: number;
  rules?: ProgramRules;
  budgetAmount?: number;
  status?: string;
}

export interface CreateClaimInput {
  programId: string;
  dealerId: string;
  submittedById: string;
  claimType: string;
  requestedAmount: number;
  description?: string;
  supportingInfo?: Record<string, unknown>;
}

// ============================================================================
// PROGRAM MANAGEMENT
// ============================================================================

/**
 * Create a new incentive program
 */
export async function createProgram(input: CreateProgramInput) {
  return prisma.incentiveProgram.create({
    data: {
      name: input.name,
      code: input.code,
      description: input.description,
      type: input.type,
      subtype: input.subtype,
      startDate: input.startDate,
      endDate: input.endDate,
      enrollmentDeadline: input.enrollmentDeadline,
      status: 'draft',
      eligibleTiers: input.eligibleTiers ? JSON.stringify(input.eligibleTiers) : null,
      eligibleRegions: input.eligibleRegions ? JSON.stringify(input.eligibleRegions) : null,
      minOrderVolume: input.minOrderVolume,
      rules: JSON.stringify(input.rules),
      budgetAmount: input.budgetAmount,
      autoEnroll: input.autoEnroll || false,
      requiresApproval: input.requiresApproval !== false,
      createdBy: input.createdBy,
    },
  });
}

/**
 * Get a program by ID or code
 */
export async function getProgram(idOrCode: string) {
  const program = await prisma.incentiveProgram.findFirst({
    where: {
      OR: [{ id: idOrCode }, { code: idOrCode }],
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          claims: true,
          payouts: true,
        },
      },
    },
  });

  if (!program) return null;

  return {
    ...program,
    eligibleTiers: program.eligibleTiers ? JSON.parse(program.eligibleTiers) : [],
    eligibleRegions: program.eligibleRegions ? JSON.parse(program.eligibleRegions) : [],
    rules: JSON.parse(program.rules),
  };
}

/**
 * List programs with filtering
 */
export async function listPrograms(options: {
  type?: string;
  status?: string | string[];
  dealerTier?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { type, status, dealerTier, page = 1, limit = 20 } = options;

  const where: Prisma.IncentiveProgramWhereInput = {};

  if (type) where.type = type;
  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  const [programs, total] = await Promise.all([
    prisma.incentiveProgram.findMany({
      where,
      include: {
        _count: {
          select: { enrollments: { where: { status: 'active' } } },
        },
      },
      orderBy: { startDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.incentiveProgram.count({ where }),
  ]);

  // Filter by dealer tier eligibility if provided
  let filteredPrograms = programs;
  if (dealerTier) {
    filteredPrograms = programs.filter((p) => {
      if (!p.eligibleTiers) return true;
      const tiers = JSON.parse(p.eligibleTiers);
      return tiers.length === 0 || tiers.includes(dealerTier);
    });
  }

  return {
    programs: filteredPrograms.map((p) => ({
      ...p,
      eligibleTiers: p.eligibleTiers ? JSON.parse(p.eligibleTiers) : [],
      eligibleRegions: p.eligibleRegions ? JSON.parse(p.eligibleRegions) : [],
      rules: JSON.parse(p.rules),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a program
 */
export async function updateProgram(id: string, input: UpdateProgramInput) {
  const updateData: Prisma.IncentiveProgramUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.endDate !== undefined) updateData.endDate = input.endDate;
  if (input.enrollmentDeadline !== undefined) updateData.enrollmentDeadline = input.enrollmentDeadline;
  if (input.eligibleTiers !== undefined) updateData.eligibleTiers = JSON.stringify(input.eligibleTiers);
  if (input.eligibleRegions !== undefined) updateData.eligibleRegions = JSON.stringify(input.eligibleRegions);
  if (input.minOrderVolume !== undefined) updateData.minOrderVolume = input.minOrderVolume;
  if (input.rules !== undefined) updateData.rules = JSON.stringify(input.rules);
  if (input.budgetAmount !== undefined) updateData.budgetAmount = input.budgetAmount;
  if (input.status !== undefined) updateData.status = input.status;

  return prisma.incentiveProgram.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Activate a program
 */
export async function activateProgram(id: string) {
  return prisma.incentiveProgram.update({
    where: { id },
    data: { status: 'active' },
  });
}

/**
 * Pause a program
 */
export async function pauseProgram(id: string) {
  return prisma.incentiveProgram.update({
    where: { id },
    data: { status: 'paused' },
  });
}

// ============================================================================
// DEALER ENROLLMENT
// ============================================================================

/**
 * Enroll a dealer in a program
 */
export async function enrollDealer(programId: string, dealerId: string, termsVersion?: string) {
  const program = await prisma.incentiveProgram.findUnique({ where: { id: programId } });
  if (!program) throw new Error('Program not found');

  if (program.status !== 'active') {
    throw new Error('Program is not active');
  }

  if (program.enrollmentDeadline && new Date() > program.enrollmentDeadline) {
    throw new Error('Enrollment deadline has passed');
  }

  const existingEnrollment = await prisma.dealerProgramEnrollment.findUnique({
    where: { dealerId_programId: { dealerId, programId } },
  });

  if (existingEnrollment) {
    throw new Error('Dealer is already enrolled in this program');
  }

  return prisma.dealerProgramEnrollment.create({
    data: {
      dealerId,
      programId,
      status: program.requiresApproval ? 'pending' : 'active',
      termsAcceptedAt: termsVersion ? new Date() : null,
      termsVersion,
      approvedAt: program.requiresApproval ? null : new Date(),
    },
    include: {
      program: true,
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Approve a dealer enrollment
 */
export async function approveEnrollment(enrollmentId: string, approvedById: string) {
  return prisma.dealerProgramEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: 'active',
      approvedAt: new Date(),
      approvedById,
    },
    include: {
      program: true,
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Get dealer's enrollments
 */
export async function getDealerEnrollments(dealerId: string, status?: string) {
  const where: Prisma.DealerProgramEnrollmentWhereInput = { dealerId };
  if (status) where.status = status;

  return prisma.dealerProgramEnrollment.findMany({
    where,
    include: {
      program: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

/**
 * Withdraw from a program
 */
export async function withdrawEnrollment(enrollmentId: string, reason?: string) {
  return prisma.dealerProgramEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: 'withdrawn',
      withdrawnAt: new Date(),
      withdrawReason: reason,
    },
  });
}

// ============================================================================
// REBATE CALCULATION
// ============================================================================

/**
 * Calculate rebate accrual for a dealer/program/period
 */
export async function calculateRebateAccrual(
  programId: string,
  dealerId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const program = await getProgram(programId);
  if (!program) throw new Error('Program not found');

  // Get qualifying orders for the period
  const orders = await prisma.order.findMany({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped'] },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  // Calculate qualifying volume
  const qualifyingVolume = orders.reduce((sum, order) => {
    // Apply product filters if specified in rules
    const qualifyingItems = order.items.filter((item) => {
      if (program.rules.qualifyingProducts?.length) {
        return program.rules.qualifyingProducts.includes(item.product.categoryId || '');
      }
      if (program.rules.excludedProducts?.length) {
        return !program.rules.excludedProducts.includes(item.product.categoryId || '');
      }
      return true;
    });

    return sum + qualifyingItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
  }, 0);

  // Determine rebate rate based on tier structure
  let rebateRate = program.rules.flatRate || 0;
  let tierAchieved = '';

  if (program.rules.tiers?.length) {
    const sortedTiers = [...program.rules.tiers].sort((a, b) => b.minVolume - a.minVolume);
    for (const tier of sortedTiers) {
      if (qualifyingVolume >= tier.minVolume) {
        rebateRate = tier.rate;
        tierAchieved = tier.name;
        break;
      }
    }
  }

  const accruedAmount = qualifyingVolume * rebateRate;
  const finalAmount = Math.min(
    accruedAmount,
    program.rules.maxPayoutPerDealer || Infinity
  );

  // Calculate tier progress
  let tierProgress = 0;
  if (program.rules.tiers?.length && tierAchieved) {
    const currentTierIndex = program.rules.tiers.findIndex((t) => t.name === tierAchieved);
    const nextTier = program.rules.tiers[currentTierIndex - 1];
    if (nextTier) {
      const currentTier = program.rules.tiers[currentTierIndex];
      tierProgress = Math.min(
        100,
        ((qualifyingVolume - currentTier.minVolume) / (nextTier.minVolume - currentTier.minVolume)) * 100
      );
    } else {
      tierProgress = 100;
    }
  }

  // Get period type from program duration
  const periodType = getPeriodType(periodStart, periodEnd);

  // Create or update accrual record
  const existing = await prisma.rebateAccrual.findUnique({
    where: { programId_dealerId_periodStart: { programId, dealerId, periodStart } },
  });

  if (existing) {
    return prisma.rebateAccrual.update({
      where: { id: existing.id },
      data: {
        qualifyingVolume,
        rebateRate,
        accruedAmount,
        finalAmount,
        tierAchieved,
        tierProgress,
      },
      include: { program: true, dealer: true },
    });
  }

  return prisma.rebateAccrual.create({
    data: {
      programId,
      dealerId,
      periodType,
      periodStart,
      periodEnd,
      qualifyingVolume,
      rebateRate,
      accruedAmount,
      finalAmount,
      tierAchieved,
      tierProgress,
      status: 'calculated',
    },
    include: { program: true, dealer: true },
  });
}

function getPeriodType(start: Date, end: Date): string {
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 35) return 'monthly';
  if (days <= 95) return 'quarterly';
  return 'annual';
}

/**
 * Get dealer's accrual summary
 */
export async function getDealerAccrualSummary(dealerId: string, programId?: string) {
  const where: Prisma.RebateAccrualWhereInput = { dealerId };
  if (programId) where.programId = programId;

  const accruals = await prisma.rebateAccrual.findMany({
    where,
    include: { program: true },
    orderBy: { periodStart: 'desc' },
  });

  const summary = {
    totalAccrued: accruals.reduce((sum, a) => sum + a.finalAmount, 0),
    totalPaid: accruals.filter((a) => a.status === 'paid').reduce((sum, a) => sum + a.finalAmount, 0),
    pending: accruals.filter((a) => a.status === 'calculated').reduce((sum, a) => sum + a.finalAmount, 0),
    accruals,
  };

  return summary;
}

// ============================================================================
// CLAIMS MANAGEMENT
// ============================================================================

/**
 * Generate a unique claim number
 */
async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;

  const lastClaim = await prisma.incentiveClaim.findFirst({
    where: { claimNumber: { startsWith: prefix } },
    orderBy: { claimNumber: 'desc' },
  });

  let sequence = 1;
  if (lastClaim) {
    const lastSequence = parseInt(lastClaim.claimNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

/**
 * Create an incentive claim
 */
export async function createClaim(input: CreateClaimInput) {
  const claimNumber = await generateClaimNumber();

  return prisma.incentiveClaim.create({
    data: {
      claimNumber,
      programId: input.programId,
      dealerId: input.dealerId,
      submittedById: input.submittedById,
      claimType: input.claimType,
      requestedAmount: input.requestedAmount,
      description: input.description,
      supportingInfo: input.supportingInfo ? JSON.stringify(input.supportingInfo) : null,
      status: 'draft',
    },
    include: {
      program: true,
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Submit a claim for review
 */
export async function submitClaim(claimId: string) {
  return prisma.incentiveClaim.update({
    where: { id: claimId },
    data: {
      status: 'submitted',
      submittedAt: new Date(),
    },
  });
}

/**
 * Review and approve/deny a claim
 */
export async function reviewClaim(
  claimId: string,
  reviewedById: string,
  decision: 'approved' | 'denied',
  options: { approvedAmount?: number; reviewNotes?: string; denialReason?: string }
) {
  const updateData: Prisma.IncentiveClaimUpdateInput = {
    status: decision,
    reviewedById,
    reviewedAt: new Date(),
    reviewNotes: options.reviewNotes,
  };

  if (decision === 'approved') {
    updateData.approvedAmount = options.approvedAmount;
    updateData.approvedAt = new Date();
  } else {
    updateData.denialReason = options.denialReason;
  }

  return prisma.incentiveClaim.update({
    where: { id: claimId },
    data: updateData,
    include: {
      program: true,
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * List claims with filtering
 */
export async function listClaims(options: {
  dealerId?: string;
  programId?: string;
  status?: string | string[];
  page?: number;
  limit?: number;
} = {}) {
  const { dealerId, programId, status, page = 1, limit = 20 } = options;

  const where: Prisma.IncentiveClaimWhereInput = {};
  if (dealerId) where.dealerId = dealerId;
  if (programId) where.programId = programId;
  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  const [claims, total] = await Promise.all([
    prisma.incentiveClaim.findMany({
      where,
      include: {
        program: { select: { id: true, name: true, type: true } },
        dealer: { select: { id: true, name: true, code: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.incentiveClaim.count({ where }),
  ]);

  return {
    claims,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============================================================================
// PAYOUTS
// ============================================================================

/**
 * Create a payout record
 */
export async function createPayout(options: {
  programId: string;
  dealerId: string;
  amount: number;
  payoutType: string;
  paymentMethod?: string;
  periodCovered?: string;
  scheduledDate?: Date;
  notes?: string;
}) {
  return prisma.incentivePayout.create({
    data: {
      programId: options.programId,
      dealerId: options.dealerId,
      amount: options.amount,
      payoutType: options.payoutType,
      paymentMethod: options.paymentMethod,
      periodCovered: options.periodCovered,
      scheduledDate: options.scheduledDate,
      notes: options.notes,
      status: 'pending',
    },
    include: {
      program: true,
      dealer: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Process a payout
 */
export async function processPayout(payoutId: string, referenceNumber: string, processedById: string) {
  return prisma.incentivePayout.update({
    where: { id: payoutId },
    data: {
      status: 'completed',
      paidDate: new Date(),
      referenceNumber,
      processedById,
    },
  });
}

/**
 * Get dealer's payout history
 */
export async function getDealerPayouts(dealerId: string) {
  return prisma.incentivePayout.findMany({
    where: { dealerId },
    include: {
      program: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// DASHBOARD & REPORTING
// ============================================================================

/**
 * Get dealer's incentives dashboard data
 */
export async function getDealerIncentivesDashboard(dealerId: string) {
  const [enrollments, accrualSummary, recentClaims, recentPayouts] = await Promise.all([
    getDealerEnrollments(dealerId, 'active'),
    getDealerAccrualSummary(dealerId),
    prisma.incentiveClaim.findMany({
      where: { dealerId },
      include: { program: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.incentivePayout.findMany({
      where: { dealerId, status: 'completed' },
      include: { program: { select: { name: true } } },
      orderBy: { paidDate: 'desc' },
      take: 5,
    }),
  ]);

  // Get YTD totals
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdPayouts = await prisma.incentivePayout.aggregate({
    where: {
      dealerId,
      status: 'completed',
      paidDate: { gte: yearStart },
    },
    _sum: { amount: true },
  });

  return {
    activePrograms: enrollments.length,
    totalAccrued: accrualSummary.totalAccrued,
    totalPaid: accrualSummary.totalPaid,
    pendingAmount: accrualSummary.pending,
    ytdPaid: ytdPayouts._sum.amount || 0,
    recentClaims,
    recentPayouts,
    enrollments: enrollments.map((e) => ({
      ...e,
      program: {
        ...e.program,
        rules: JSON.parse(e.program.rules),
      },
    })),
  };
}

/**
 * Get program performance stats
 */
export async function getProgramStats(programId: string) {
  const [
    enrollmentCount,
    activeEnrollments,
    totalAccrued,
    totalPaid,
    claimStats,
  ] = await Promise.all([
    prisma.dealerProgramEnrollment.count({ where: { programId } }),
    prisma.dealerProgramEnrollment.count({ where: { programId, status: 'active' } }),
    prisma.rebateAccrual.aggregate({
      where: { programId },
      _sum: { finalAmount: true },
    }),
    prisma.incentivePayout.aggregate({
      where: { programId, status: 'completed' },
      _sum: { amount: true },
    }),
    prisma.incentiveClaim.groupBy({
      by: ['status'],
      where: { programId },
      _count: { id: true },
    }),
  ]);

  return {
    enrollmentCount,
    activeEnrollments,
    totalAccrued: totalAccrued._sum.finalAmount || 0,
    totalPaid: totalPaid._sum.amount || 0,
    claims: Object.fromEntries(claimStats.map((c) => [c.status, c._count.id])),
  };
}

// ============================================================================
// BATCH ACCRUAL PROCESSING
// ============================================================================

export interface AccrualRunResult {
  runId: string;
  programId: string;
  periodType: string;
  periodStart: Date;
  periodEnd: Date;
  processedCount: number;
  totalAccrued: number;
  errors: Array<{ dealerId: string; error: string }>;
  startedAt: Date;
  completedAt: Date;
}

/**
 * Calculate period dates for a given period type
 */
export function calculatePeriodDates(periodType: 'monthly' | 'quarterly' | 'annual', targetDate?: Date): {
  periodStart: Date;
  periodEnd: Date;
} {
  const date = targetDate || new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (periodType) {
    case 'monthly':
      return {
        periodStart: new Date(year, month, 1),
        periodEnd: new Date(year, month + 1, 0, 23, 59, 59),
      };
    case 'quarterly':
      const quarter = Math.floor(month / 3);
      return {
        periodStart: new Date(year, quarter * 3, 1),
        periodEnd: new Date(year, (quarter + 1) * 3, 0, 23, 59, 59),
      };
    case 'annual':
      return {
        periodStart: new Date(year, 0, 1),
        periodEnd: new Date(year, 11, 31, 23, 59, 59),
      };
    default:
      return {
        periodStart: new Date(year, month, 1),
        periodEnd: new Date(year, month + 1, 0, 23, 59, 59),
      };
  }
}

/**
 * Run batch accrual calculation for all enrolled dealers in a program
 */
export async function runBatchAccrual(
  programId: string,
  options: {
    periodType?: 'monthly' | 'quarterly' | 'annual';
    periodStart?: Date;
    periodEnd?: Date;
    recalculate?: boolean;
  } = {}
): Promise<AccrualRunResult> {
  const startedAt = new Date();
  const runId = `RUN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const program = await getProgram(programId);
  if (!program) throw new Error('Program not found');
  if (program.type !== 'rebate') throw new Error('Batch accruals only apply to rebate programs');

  // Determine period dates
  let periodStart: Date;
  let periodEnd: Date;

  if (options.periodStart && options.periodEnd) {
    periodStart = options.periodStart;
    periodEnd = options.periodEnd;
  } else {
    const periodType = options.periodType || 'monthly';
    const dates = calculatePeriodDates(periodType);
    periodStart = dates.periodStart;
    periodEnd = dates.periodEnd;
  }

  // Get all active enrollments
  const enrollments = await prisma.dealerProgramEnrollment.findMany({
    where: { programId, status: 'active' },
    select: { dealerId: true },
  });

  const results: {
    dealerId: string;
    accrual?: Awaited<ReturnType<typeof calculateRebateAccrual>>;
    error?: string;
  }[] = [];

  // Process each dealer
  for (const enrollment of enrollments) {
    try {
      // Check if accrual already exists for this period
      if (!options.recalculate) {
        const existing = await prisma.rebateAccrual.findUnique({
          where: {
            programId_dealerId_periodStart: {
              programId,
              dealerId: enrollment.dealerId,
              periodStart,
            },
          },
        });
        if (existing && existing.status !== 'calculated') {
          results.push({ dealerId: enrollment.dealerId, error: 'Accrual already finalized' });
          continue;
        }
      }

      const accrual = await calculateRebateAccrual(
        programId,
        enrollment.dealerId,
        periodStart,
        periodEnd
      );
      results.push({ dealerId: enrollment.dealerId, accrual });

      // Update enrollment tier progress
      await prisma.dealerProgramEnrollment.update({
        where: { dealerId_programId: { dealerId: enrollment.dealerId, programId } },
        data: {
          tierAchieved: accrual.tierAchieved,
          tierProgress: accrual.tierProgress,
          accruedAmount: { increment: accrual.accruedAmount - (accrual.qualifyingVolume > 0 ? 0 : 0) },
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ dealerId: enrollment.dealerId, error: errorMessage });
    }
  }

  const completedAt = new Date();
  const successfulResults = results.filter((r) => r.accrual && !r.error);

  return {
    runId,
    programId,
    periodType: getPeriodType(periodStart, periodEnd),
    periodStart,
    periodEnd,
    processedCount: successfulResults.length,
    totalAccrued: successfulResults.reduce((sum, r) => sum + (r.accrual?.accruedAmount || 0), 0),
    errors: results.filter((r) => r.error).map((r) => ({ dealerId: r.dealerId, error: r.error! })),
    startedAt,
    completedAt,
  };
}

/**
 * Get projected rebate for a dealer based on current period purchases
 */
export async function getProjectedRebate(
  programId: string,
  dealerId: string,
  periodType: 'monthly' | 'quarterly' | 'annual' = 'monthly'
): Promise<{
  currentVolume: number;
  projectedVolume: number;
  currentRate: number;
  projectedRate: number;
  currentAccrual: number;
  projectedAccrual: number;
  currentTier: string | null;
  projectedTier: string | null;
  nextTier: { name: string; minVolume: number; rate: number } | null;
  volumeToNextTier: number | null;
  daysRemaining: number;
  averageDailyVolume: number;
}> {
  const program = await getProgram(programId);
  if (!program) throw new Error('Program not found');

  const { periodStart, periodEnd } = calculatePeriodDates(periodType);
  const now = new Date();

  // Get orders so far this period
  const orders = await prisma.order.findMany({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped', 'confirmed', 'processing'] },
      createdAt: { gte: periodStart, lte: now },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  // Calculate current qualifying volume
  const currentVolume = orders.reduce((sum, order) => {
    const qualifyingItems = order.items.filter((item) => {
      if (program.rules.qualifyingProducts?.length) {
        return program.rules.qualifyingProducts.includes(item.product.categoryId || '');
      }
      if (program.rules.excludedProducts?.length) {
        return !program.rules.excludedProducts.includes(item.product.categoryId || '');
      }
      return true;
    });
    return sum + qualifyingItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
  }, 0);

  // Calculate days elapsed and remaining
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Calculate average daily volume and projected volume
  const averageDailyVolume = currentVolume / daysElapsed;
  const projectedVolume = currentVolume + (averageDailyVolume * daysRemaining);

  // Determine current and projected tiers/rates
  const getCurrentTierInfo = (volume: number) => {
    let rate = program.rules.flatRate || 0;
    let tierName: string | null = null;

    if (program.rules.tiers?.length) {
      const sortedTiers = [...program.rules.tiers].sort((a, b) => b.minVolume - a.minVolume);
      for (const tier of sortedTiers) {
        if (volume >= tier.minVolume) {
          rate = tier.rate;
          tierName = tier.name;
          break;
        }
      }
    }

    return { rate, tierName };
  };

  const currentTierInfo = getCurrentTierInfo(currentVolume);
  const projectedTierInfo = getCurrentTierInfo(projectedVolume);

  const currentAccrual = currentVolume * currentTierInfo.rate;
  const projectedAccrual = projectedVolume * projectedTierInfo.rate;

  // Find next tier
  let nextTier: { name: string; minVolume: number; rate: number } | null = null;
  let volumeToNextTier: number | null = null;

  if (program.rules.tiers?.length) {
    const sortedTiers = [...program.rules.tiers].sort((a, b) => a.minVolume - b.minVolume);
    const currentTierIndex = sortedTiers.findIndex((t) => t.name === currentTierInfo.tierName);
    if (currentTierIndex < sortedTiers.length - 1) {
      nextTier = sortedTiers[currentTierIndex + 1] || sortedTiers[0];
      volumeToNextTier = nextTier.minVolume - currentVolume;
    }
  }

  return {
    currentVolume,
    projectedVolume,
    currentRate: currentTierInfo.rate,
    projectedRate: projectedTierInfo.rate,
    currentAccrual,
    projectedAccrual,
    currentTier: currentTierInfo.tierName,
    projectedTier: projectedTierInfo.tierName,
    nextTier,
    volumeToNextTier,
    daysRemaining,
    averageDailyVolume,
  };
}

/**
 * Finalize accruals for a period (locks them for payout)
 */
export async function finalizeAccruals(
  programId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ count: number; totalAmount: number }> {
  const result = await prisma.rebateAccrual.updateMany({
    where: {
      programId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
      status: 'calculated',
    },
    data: { status: 'finalized' },
  });

  const totals = await prisma.rebateAccrual.aggregate({
    where: {
      programId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
      status: 'finalized',
    },
    _sum: { finalAmount: true },
  });

  return {
    count: result.count,
    totalAmount: totals._sum.finalAmount || 0,
  };
}

/**
 * Get accrual summary for a program
 */
export async function getProgramAccrualSummary(programId: string): Promise<{
  totalCalculated: number;
  totalFinalized: number;
  totalPaid: number;
  calculatedAmount: number;
  finalizedAmount: number;
  paidAmount: number;
  periods: Array<{
    periodStart: Date;
    periodEnd: Date;
    periodType: string;
    dealerCount: number;
    totalAmount: number;
    status: string;
  }>;
}> {
  const [statusCounts, periods] = await Promise.all([
    prisma.rebateAccrual.groupBy({
      by: ['status'],
      where: { programId },
      _count: { id: true },
      _sum: { finalAmount: true },
    }),
    prisma.rebateAccrual.groupBy({
      by: ['periodStart', 'periodEnd', 'periodType', 'status'],
      where: { programId },
      _count: { dealerId: true },
      _sum: { finalAmount: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, { count: s._count.id, amount: s._sum.finalAmount || 0 }])
  );

  // Aggregate periods
  const periodMap = new Map<string, {
    periodStart: Date;
    periodEnd: Date;
    periodType: string;
    dealerCount: number;
    totalAmount: number;
    status: string;
  }>();

  for (const p of periods) {
    const key = `${p.periodStart.toISOString()}-${p.periodEnd.toISOString()}`;
    if (!periodMap.has(key)) {
      periodMap.set(key, {
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        periodType: p.periodType,
        dealerCount: p._count.dealerId,
        totalAmount: p._sum.finalAmount || 0,
        status: p.status,
      });
    } else {
      const existing = periodMap.get(key)!;
      existing.dealerCount += p._count.dealerId;
      existing.totalAmount += p._sum.finalAmount || 0;
    }
  }

  return {
    totalCalculated: statusMap['calculated']?.count || 0,
    totalFinalized: statusMap['finalized']?.count || 0,
    totalPaid: statusMap['paid']?.count || 0,
    calculatedAmount: statusMap['calculated']?.amount || 0,
    finalizedAmount: statusMap['finalized']?.amount || 0,
    paidAmount: statusMap['paid']?.amount || 0,
    periods: Array.from(periodMap.values()).sort((a, b) =>
      b.periodStart.getTime() - a.periodStart.getTime()
    ),
  };
}
