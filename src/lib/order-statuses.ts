// Order status workflow configuration
export const ORDER_STATUSES = {
  draft: { label: 'Draft', color: 'gray', next: ['submitted'] },
  submitted: { label: 'Submitted', color: 'blue', next: ['confirmed', 'cancelled'] },
  confirmed: { label: 'Confirmed', color: 'olive', next: ['processing', 'cancelled'] },
  processing: { label: 'Processing', color: 'yellow', next: ['shipped'] },
  shipped: { label: 'Shipped', color: 'purple', next: ['delivered'] },
  delivered: { label: 'Delivered', color: 'green', next: [] },
  cancelled: { label: 'Cancelled', color: 'red', next: [] },
} as const

export type OrderStatus = keyof typeof ORDER_STATUSES
