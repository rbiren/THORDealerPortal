// Inventory utility functions (non-server)

export const adjustmentReasons = [
  'received',
  'returned',
  'damaged',
  'lost',
  'correction',
  'transfer_in',
  'transfer_out',
  'cycle_count',
  'other',
] as const

export type AdjustmentReason = (typeof adjustmentReasons)[number]

export function getAdjustmentReasons(): { value: AdjustmentReason; label: string }[] {
  return [
    { value: 'received', label: 'Stock Received' },
    { value: 'returned', label: 'Customer Return' },
    { value: 'damaged', label: 'Damaged Goods' },
    { value: 'lost', label: 'Lost/Missing' },
    { value: 'correction', label: 'Count Correction' },
    { value: 'transfer_in', label: 'Transfer In' },
    { value: 'transfer_out', label: 'Transfer Out' },
    { value: 'cycle_count', label: 'Cycle Count' },
    { value: 'other', label: 'Other' },
  ]
}
