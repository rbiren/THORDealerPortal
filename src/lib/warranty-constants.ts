// Warranty status, type, and priority labels/colors
// Separated from server actions to avoid "use server" export restrictions

export const warrantyStatusLabels = {
  draft: 'Draft',
  pending: 'Pending Review',
  in_review: 'In Review',
  approved: 'Approved',
  partially_approved: 'Partially Approved',
  denied: 'Denied',
  closed: 'Closed',
} as const

export const warrantyStatusColors = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  in_review: { bg: 'bg-blue-100', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  partially_approved: { bg: 'bg-orange-100', text: 'text-orange-800' },
  denied: { bg: 'bg-red-100', text: 'text-red-800' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
} as const

export const warrantyClaimTypeLabels = {
  parts: 'Parts Warranty',
  labor: 'Labor Warranty',
  parts_and_labor: 'Parts & Labor',
  goodwill: 'Goodwill Claim',
  recall: 'Recall/Campaign',
} as const

export const warrantyPriorityLabels = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
} as const

export const warrantyPriorityColors = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
} as const

export type WarrantyStatus = keyof typeof warrantyStatusLabels
export type WarrantyClaimType = keyof typeof warrantyClaimTypeLabels
export type WarrantyPriority = keyof typeof warrantyPriorityLabels
