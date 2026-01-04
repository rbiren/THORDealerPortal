'use server'

import { auth } from '@/lib/auth'
import {
  listWarrantyClaims,
  getWarrantyStats,
  createWarrantyClaim,
  submitWarrantyClaim,
  deleteWarrantyClaim,
} from '@/lib/services/warranty'
import {
  warrantyFilterSchema,
  createWarrantyClaimSchema,
  warrantyStatusLabels,
  warrantyStatusColors,
  warrantyClaimTypeLabels,
  warrantyPriorityLabels,
  warrantyPriorityColors,
  type WarrantyFilterInput,
  type CreateWarrantyClaimInput,
  type WarrantyStatus,
} from '@/lib/validations/warranty'

// Re-export for use in components
export {
  warrantyStatusLabels,
  warrantyStatusColors,
  warrantyClaimTypeLabels,
  warrantyPriorityLabels,
  warrantyPriorityColors,
}

export type WarrantyClaimListItem = {
  id: string
  claimNumber: string
  status: WarrantyStatus
  statusLabel: string
  statusColor: { bg: string; text: string }
  claimType: string
  claimTypeLabel: string
  productName: string
  totalRequested: number
  totalApproved: number | null
  priority: string
  priorityLabel: string
  priorityColor: { bg: string; text: string }
  createdAt: string
  updatedAt: string
  dealerName: string
  dealerCode: string
  submittedByName: string
}

export type WarrantyStatsResult = {
  total: number
  pending: number
  inReview: number
  approved: number
  denied: number
  totalRequested: number
  totalApproved: number
}

// Get warranty claims list
export async function getWarrantyClaims(filters?: {
  status?: string
  claimType?: string
  priority?: string
  search?: string
  dealerId?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const session = await auth()
  if (!session?.user) {
    return { claims: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  const validatedFilters = warrantyFilterSchema.parse({
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    sortBy: filters?.sortBy || 'createdAt',
    sortOrder: filters?.sortOrder || 'desc',
    status: filters?.status || 'all',
    claimType: filters?.claimType || 'all',
    priority: filters?.priority || 'all',
    search: filters?.search,
    dealerId: filters?.dealerId,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  })

  const result = await listWarrantyClaims(
    validatedFilters,
    session.user.id,
    session.user.role,
    session.user.dealerId || null
  )

  // Transform for UI
  const claims: WarrantyClaimListItem[] = result.claims.map((claim) => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status as WarrantyStatus,
    statusLabel: warrantyStatusLabels[claim.status as WarrantyStatus] || claim.status,
    statusColor: warrantyStatusColors[claim.status as WarrantyStatus] || { bg: 'bg-gray-100', text: 'text-gray-700' },
    claimType: claim.claimType,
    claimTypeLabel: warrantyClaimTypeLabels[claim.claimType as keyof typeof warrantyClaimTypeLabels] || claim.claimType,
    productName: claim.productName,
    totalRequested: claim.totalRequested,
    totalApproved: claim.totalApproved,
    priority: claim.priority,
    priorityLabel: warrantyPriorityLabels[claim.priority as keyof typeof warrantyPriorityLabels] || claim.priority,
    priorityColor: warrantyPriorityColors[claim.priority as keyof typeof warrantyPriorityColors] || { bg: 'bg-gray-100', text: 'text-gray-600' },
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    dealerName: claim.dealer.name,
    dealerCode: claim.dealer.code,
    submittedByName: `${claim.submittedBy.firstName} ${claim.submittedBy.lastName}`,
  }))

  return {
    claims,
    pagination: result.pagination,
  }
}

// Get warranty stats
export async function getWarrantyStatsAction(): Promise<WarrantyStatsResult> {
  const session = await auth()
  if (!session?.user) {
    return {
      total: 0,
      pending: 0,
      inReview: 0,
      approved: 0,
      denied: 0,
      totalRequested: 0,
      totalApproved: 0,
    }
  }

  return getWarrantyStats(session.user.role, session.user.dealerId || null)
}

// Create a new warranty claim
export async function createWarrantyClaimAction(
  formData: FormData
): Promise<{ success: boolean; claimId?: string; claimNumber?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!session.user.dealerId) {
    return { success: false, error: 'No dealer associated with this account' }
  }

  try {
    // Parse form data
    const rawData = {
      claimType: formData.get('claimType') as string,
      productId: formData.get('productId') as string || undefined,
      productName: formData.get('productName') as string,
      serialNumber: formData.get('serialNumber') as string || undefined,
      modelNumber: formData.get('modelNumber') as string || undefined,
      purchaseDate: formData.get('purchaseDate') as string || undefined,
      installDate: formData.get('installDate') as string || undefined,
      customerName: formData.get('customerName') as string || undefined,
      customerPhone: formData.get('customerPhone') as string || undefined,
      customerEmail: formData.get('customerEmail') as string || undefined,
      customerAddress: formData.get('customerAddress') as string || undefined,
      issueDescription: formData.get('issueDescription') as string,
      failureDate: formData.get('failureDate') as string || undefined,
      isUnderWarranty: formData.get('isUnderWarranty') === 'true',
      laborHours: formData.get('laborHours') ? parseFloat(formData.get('laborHours') as string) : undefined,
      laborRate: formData.get('laborRate') ? parseFloat(formData.get('laborRate') as string) : undefined,
      partsAmount: formData.get('partsAmount') ? parseFloat(formData.get('partsAmount') as string) : 0,
      shippingAmount: formData.get('shippingAmount') ? parseFloat(formData.get('shippingAmount') as string) : 0,
      priority: (formData.get('priority') as string) || 'normal',
      submitNow: formData.get('submitNow') === 'true',
    }

    // Parse items if provided as JSON
    const itemsJson = formData.get('items') as string
    let items: unknown[] | undefined
    if (itemsJson) {
      try {
        items = JSON.parse(itemsJson)
      } catch (e) {
        // Ignore parse errors
      }
    }

    const rawDataWithItems = items ? { ...rawData, items } : rawData

    const validated = createWarrantyClaimSchema.parse(rawDataWithItems)

    const result = await createWarrantyClaim(
      validated,
      session.user.id,
      session.user.dealerId
    )

    return result
  } catch (error) {
    console.error('Create warranty claim error:', error)
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return { success: false, error: 'Validation error: Please check your input' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create warranty claim',
    }
  }
}

// Submit a draft claim
export async function submitWarrantyClaimAction(
  claimId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  return submitWarrantyClaim(claimId, session.user.id)
}

// Delete a draft claim
export async function deleteWarrantyClaimAction(
  claimId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  return deleteWarrantyClaim(claimId, session.user.id, session.user.dealerId || null)
}

// Check if user is admin
export async function isUserAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return ['super_admin', 'admin'].includes(session.user.role)
}
