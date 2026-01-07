// Document Types
export type DocumentCategory =
  | 'contract'
  | 'marketing'
  | 'compliance'
  | 'training'
  | 'product_spec'
  | 'invoice'
  | 'report'
  | 'other'

// Category configuration
export const DOCUMENT_CATEGORIES: Record<
  DocumentCategory,
  { label: string; icon: string; color: string }
> = {
  contract: { label: 'Contracts', icon: 'document-text', color: 'blue' },
  marketing: { label: 'Marketing', icon: 'presentation-chart-bar', color: 'purple' },
  compliance: { label: 'Compliance', icon: 'shield-check', color: 'green' },
  training: { label: 'Training', icon: 'academic-cap', color: 'yellow' },
  product_spec: { label: 'Product Specs', icon: 'clipboard-list', color: 'orange' },
  invoice: { label: 'Invoices', icon: 'receipt-refund', color: 'gray' },
  report: { label: 'Reports', icon: 'chart-bar', color: 'indigo' },
  other: { label: 'Other', icon: 'folder', color: 'gray' },
}

// Allowed MIME types for document upload
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]

// Max file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024
