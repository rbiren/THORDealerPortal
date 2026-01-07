'use server'

import { prisma } from '@/lib/prisma'
import { createDocument, type DocumentCategory } from '../actions'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/document-constants'

// Note: Client components should import ALLOWED_MIME_TYPES, MAX_FILE_SIZE from '@/lib/document-constants'

// Types
export interface UploadMetadata {
  name: string
  category: DocumentCategory
  dealerId?: string
  isPublic?: boolean
  expiresAt?: Date
  uploadedBy?: string
}

export interface UploadResult {
  success: boolean
  documentId?: string
  error?: string
}

export interface PresignedUrlResult {
  uploadUrl: string
  downloadUrl: string
  key: string
  expiresIn: number
}

// Validate file before upload
export function validateUpload(
  file: { name: string; size: number; type: string }
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    }
  }

  // Check filename
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'Filename too long',
    }
  }

  // Check for dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.vbs']
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'File type not allowed for security reasons',
    }
  }

  return { valid: true }
}

// Generate presigned URL for direct S3 upload (stub for now)
export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string
): Promise<PresignedUrlResult> {
  // In a real implementation, this would use AWS SDK to generate presigned URLs
  // For now, we'll return a mock URL for local development
  const key = `documents/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  return {
    uploadUrl: `/api/upload?key=${encodeURIComponent(key)}`,
    downloadUrl: `/uploads/${key}`,
    key,
    expiresIn: 3600, // 1 hour
  }
}

// Create document record after successful upload
export async function registerUploadedDocument(
  metadata: UploadMetadata & { url: string; size: number; mimeType: string }
): Promise<UploadResult> {
  try {
    const document = await createDocument({
      name: metadata.name,
      category: metadata.category,
      mimeType: metadata.mimeType,
      size: metadata.size,
      url: metadata.url,
      dealerId: metadata.dealerId,
      isPublic: metadata.isPublic,
      expiresAt: metadata.expiresAt,
      uploadedBy: metadata.uploadedBy,
    })

    return {
      success: true,
      documentId: document.id,
    }
  } catch (error) {
    console.error('Failed to register document:', error)
    return {
      success: false,
      error: 'Failed to save document record',
    }
  }
}

// Get upload quota for a dealer
export async function getUploadQuota(dealerId: string): Promise<{
  used: number
  limit: number
  remaining: number
  documentCount: number
}> {
  // Default quota: 1GB per dealer
  const quotaLimit = 1024 * 1024 * 1024 // 1GB

  const documents = await prisma.document.findMany({
    where: { dealerId },
    select: { size: true },
  })

  const usedSpace = documents.reduce((sum: number, doc: { size: number }) => sum + doc.size, 0)

  return {
    used: usedSpace,
    limit: quotaLimit,
    remaining: Math.max(0, quotaLimit - usedSpace),
    documentCount: documents.length,
  }
}

// Check if upload is allowed based on quota
export async function canUpload(
  dealerId: string,
  fileSize: number
): Promise<{ allowed: boolean; error?: string }> {
  const quota = await getUploadQuota(dealerId)

  if (fileSize > quota.remaining) {
    return {
      allowed: false,
      error: `Insufficient storage space. ${formatBytes(quota.remaining)} remaining.`,
    }
  }

  return { allowed: true }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Batch upload multiple documents
export async function batchRegisterDocuments(
  documents: Array<UploadMetadata & { url: string; size: number; mimeType: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const doc of documents) {
    const result = await registerUploadedDocument(doc)
    if (result.success) {
      results.success++
    } else {
      results.failed++
      if (result.error) {
        results.errors.push(`${doc.name}: ${result.error}`)
      }
    }
  }

  return results
}

// Delete uploaded file (cleanup)
export async function deleteUploadedFile(documentId: string): Promise<{ success: boolean }> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return { success: false }
    }

    // In a real implementation, this would also delete from S3
    await prisma.document.delete({
      where: { id: documentId },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to delete document:', error)
    return { success: false }
  }
}
