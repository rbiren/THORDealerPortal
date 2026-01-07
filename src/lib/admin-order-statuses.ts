// Order status configuration for admin
export const ADMIN_ORDER_STATUSES = {
  draft: { label: 'Draft', color: 'gray', adminActions: ['confirm', 'cancel'] },
  submitted: { label: 'Submitted', color: 'blue', adminActions: ['confirm', 'cancel'] },
  confirmed: { label: 'Confirmed', color: 'olive', adminActions: ['process', 'cancel'] },
  processing: { label: 'Processing', color: 'yellow', adminActions: ['ship'] },
  shipped: { label: 'Shipped', color: 'purple', adminActions: ['deliver'] },
  delivered: { label: 'Delivered', color: 'green', adminActions: [] },
  cancelled: { label: 'Cancelled', color: 'red', adminActions: [] },
} as const

export type AdminOrderStatus = keyof typeof ADMIN_ORDER_STATUSES
