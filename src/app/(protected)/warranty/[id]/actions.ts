'use server'

import { auth } from '@/lib/auth'
import {
  getWarrantyClaimById,
  addWarrantyNote,
  reviewWarrantyClaim,
  respondToInfoRequest,
  assignWarrantyClaim,
  submitWarrantyClaim,
  updateWarrantyClaim,
} from '@/lib/services/warranty'
import {
  addWarrantyNoteSchema,
  reviewWarrantyClaimSchema,
  respondToInfoRequestSchema,
  warrantyStatusLabels,
  warrantyStatusColors,
  warrantyClaimTypeLabels,
  warrantyPriorityLabels,
  warrantyPriorityColors,
} from '@/lib/validations/warranty'

// Re-export UI helpers
export {
  warrantyStatusLabels,
  warrantyStatusColors,
  warrantyClaimTypeLabels,
  warrantyPriorityLabels,
  warrantyPriorityColors,
}

// Get warranty claim details
export async function getWarrantyClaimDetails(claimId: string) {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const claim = await getWarrantyClaimById(
    claimId,
    session.user.id,
    session.user.role,
    session.user.dealerId || null
  )

  if (!claim) return null

  // Add computed fields
  return {
    ...claim,
    isAdmin: ['super_admin', 'admin'].includes(session.user.role),
    currentUserId: session.user.id,
    canEdit: claim.status === 'draft' || (claim.status === 'info_requested' && claim.dealerId === session.user.dealerId),
    canReview: ['super_admin', 'admin'].includes(session.user.role) && ['submitted', 'under_review', 'info_requested'].includes(claim.status),
    canRespond: claim.status === 'info_requested' && claim.dealerId === session.user.dealerId,
    canSubmit: claim.status === 'draft' && claim.dealerId === session.user.dealerId,
  }
}

// Add a note/comment to the claim
export async function addNoteAction(
  claimId: string,
  content: string,
  isInternal: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Only admins can add internal notes
  const isAdmin = ['super_admin', 'admin'].includes(session.user.role)
  if (isInternal && !isAdmin) {
    return { success: false, error: 'Not authorized to add internal notes' }
  }

  try {
    const validated = addWarrantyNoteSchema.parse({
      claimId,
      content,
      isInternal: isAdmin ? isInternal : false,
    })

    return addWarrantyNote(validated, session.user.id)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    }
  }
}

// Review warranty claim (manufacturer actions)
export async function reviewClaimAction(
  claimId: string,
  action: 'approve' | 'deny' | 'partial' | 'request_info',
  note?: string,
  totalApproved?: number,
  resolutionType?: string,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const isAdmin = ['super_admin', 'admin'].includes(session.user.role)
  if (!isAdmin) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const validated = reviewWarrantyClaimSchema.parse({
      claimId,
      action,
      note,
      totalApproved,
      resolutionType,
      resolutionNotes,
    })

    return reviewWarrantyClaim(validated, session.user.id)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review claim',
    }
  }
}

// Respond to info request (dealer side)
export async function respondToRequestAction(
  claimId: string,
  response: string,
  resubmit: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const validated = respondToInfoRequestSchema.parse({
      claimId,
      response,
      resubmit,
    })

    return respondToInfoRequest(validated, session.user.id)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to respond',
    }
  }
}

// Assign claim to self or another admin
export async function assignClaimAction(
  claimId: string,
  assigneeId?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  const isAdmin = ['super_admin', 'admin'].includes(session.user.role)
  if (!isAdmin) {
    return { success: false, error: 'Not authorized' }
  }

  return assignWarrantyClaim(claimId, assigneeId || session.user.id, session.user.id)
}

// Submit a draft claim
export async function submitClaimAction(
  claimId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  return submitWarrantyClaim(claimId, session.user.id)
}

// Get list of admin users for assignment
export async function getAdminUsers(): Promise<Array<{ id: string; name: string; email: string }>> {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const isAdmin = ['super_admin', 'admin'].includes(session.user.role)
  if (!isAdmin) {
    return []
  }

  // In a real implementation, this would fetch from the database
  // For now, return empty array - can be implemented later
  return []
}
