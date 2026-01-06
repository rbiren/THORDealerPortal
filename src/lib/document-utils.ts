// Document utility functions (non-server)

// File type icons
export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'document-pdf'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'document-excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'document-ppt'
  if (mimeType.includes('word') || mimeType.includes('wordprocessing')) return 'document-word'
  if (mimeType.includes('image')) return 'photograph'
  if (mimeType.includes('video')) return 'video-camera'
  if (mimeType.includes('audio')) return 'music-note'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive-box'
  return 'document'
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Get file extension
export function getFileExtension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
}

// Check if document is expired or expiring soon
export function checkExpiration(expiresAt: Date | null): { isExpired: boolean; isExpiringSoon: boolean } {
  if (!expiresAt) return { isExpired: false, isExpiringSoon: false }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return {
    isExpired: expiresAt < now,
    isExpiringSoon: expiresAt >= now && expiresAt <= thirtyDaysFromNow,
  }
}
