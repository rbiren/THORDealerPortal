'use server'

import { prisma } from '@/lib/prisma'
import { formatFileSize, getFileExtension, checkExpiration } from '@/lib/document-utils'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/document-constants'

// Note: Client components should import DOCUMENT_CATEGORIES from '@/lib/document-constants'

export type DocumentSortBy = 'name' | 'createdAt' | 'size' | 'category'

export interface Document {
  id: string
  dealerId: string | null
  name: string
  category: string
  mimeType: string
  size: number
  url: string
  version: number
  isPublic: boolean
  expiresAt: Date | null
  uploadedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DocumentWithDetails extends Document {
  dealerName?: string
  uploaderName?: string
  isExpired: boolean
  isExpiringSoon: boolean
  formattedSize: string
  fileExtension: string
}

export type { DocumentCategory }

// Get documents list
export async function getDocuments(options?: {
  dealerId?: string
  category?: DocumentCategory
  search?: string
  isPublic?: boolean
  sortBy?: DocumentSortBy
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}): Promise<{ documents: DocumentWithDetails[]; total: number }> {
  const where = {
    ...(options?.dealerId ? { dealerId: options.dealerId } : {}),
    ...(options?.category ? { category: options.category } : {}),
    ...(options?.isPublic !== undefined ? { isPublic: options.isPublic } : {}),
    ...(options?.search
      ? {
          OR: [
            { name: { contains: options.search } },
            { category: { contains: options.search } },
          ],
        }
      : {}),
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        dealer: { select: { companyName: true } },
      },
      orderBy: {
        [options?.sortBy || 'createdAt']: options?.sortOrder || 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.document.count({ where }),
  ])

  type DocumentQueryResult = {
    id: string
    name: string
    size: number
    expiresAt: Date | null
    dealer: { companyName: string } | null
    [key: string]: unknown
  }

  return {
    documents: documents.map((doc: DocumentQueryResult) => {
      const expiration = checkExpiration(doc.expiresAt)
      return {
        ...doc,
        dealerName: doc.dealer?.companyName,
        isExpired: expiration.isExpired,
        isExpiringSoon: expiration.isExpiringSoon,
        formattedSize: formatFileSize(doc.size),
        fileExtension: getFileExtension(doc.name),
      }
    }),
    total,
  }
}

// Get single document
export async function getDocument(id: string): Promise<DocumentWithDetails | null> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      dealer: { select: { companyName: true } },
    },
  })

  if (!doc) return null

  const expiration = checkExpiration(doc.expiresAt)
  return {
    ...doc,
    dealerName: doc.dealer?.companyName,
    isExpired: expiration.isExpired,
    isExpiringSoon: expiration.isExpiringSoon,
    formattedSize: formatFileSize(doc.size),
    fileExtension: getFileExtension(doc.name),
  }
}

// Create document
export async function createDocument(data: {
  name: string
  category: DocumentCategory
  mimeType: string
  size: number
  url: string
  dealerId?: string
  isPublic?: boolean
  expiresAt?: Date
  uploadedBy?: string
}): Promise<Document> {
  return prisma.document.create({
    data: {
      name: data.name,
      category: data.category,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      dealerId: data.dealerId,
      isPublic: data.isPublic ?? false,
      expiresAt: data.expiresAt,
      uploadedBy: data.uploadedBy,
    },
  })
}

// Update document
export async function updateDocument(
  id: string,
  data: {
    name?: string
    category?: DocumentCategory
    isPublic?: boolean
    expiresAt?: Date | null
  }
): Promise<Document> {
  return prisma.document.update({
    where: { id },
    data,
  })
}

// Delete document
export async function deleteDocument(id: string): Promise<void> {
  await prisma.document.delete({
    where: { id },
  })
}

// Get documents by category
export async function getDocumentsByCategory(): Promise<
  { category: string; count: number; totalSize: number }[]
> {
  const documents = await prisma.document.findMany({
    select: {
      category: true,
      size: true,
    },
  })

  const categoryMap = new Map<string, { count: number; totalSize: number }>()

  for (const doc of documents) {
    const existing = categoryMap.get(doc.category) || { count: 0, totalSize: 0 }
    existing.count++
    existing.totalSize += doc.size
    categoryMap.set(doc.category, existing)
  }

  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    ...stats,
  }))
}

// Get expiring documents
export async function getExpiringDocuments(
  daysAhead: number = 30
): Promise<DocumentWithDetails[]> {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const documents = await prisma.document.findMany({
    where: {
      expiresAt: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      dealer: { select: { companyName: true } },
    },
    orderBy: { expiresAt: 'asc' },
  })

  type ExpiringDocQueryResult = {
    id: string
    name: string
    size: number
    expiresAt: Date | null
    dealer: { companyName: string } | null
    [key: string]: unknown
  }

  return documents.map((doc: ExpiringDocQueryResult) => ({
    ...doc,
    dealerName: doc.dealer?.companyName,
    isExpired: false,
    isExpiringSoon: true,
    formattedSize: formatFileSize(doc.size),
    fileExtension: getFileExtension(doc.name),
  }))
}

// Get document statistics
export async function getDocumentStats(): Promise<{
  totalDocuments: number
  totalSize: number
  formattedTotalSize: string
  publicCount: number
  privateCount: number
  expiringCount: number
  expiredCount: number
}> {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [documents, publicCount, expiringCount, expiredCount] = await Promise.all([
    prisma.document.findMany({
      select: { size: true },
    }),
    prisma.document.count({ where: { isPublic: true } }),
    prisma.document.count({
      where: {
        expiresAt: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    prisma.document.count({
      where: {
        expiresAt: { lt: now },
      },
    }),
  ])

  const totalSize = documents.reduce((sum: number, doc: { size: number }) => sum + doc.size, 0)

  return {
    totalDocuments: documents.length,
    totalSize,
    formattedTotalSize: formatFileSize(totalSize),
    publicCount,
    privateCount: documents.length - publicCount,
    expiringCount,
    expiredCount,
  }
}

// Search documents
export async function searchDocuments(query: string): Promise<DocumentWithDetails[]> {
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { category: { contains: query } },
      ],
    },
    include: {
      dealer: { select: { companyName: true } },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  type SearchDocQueryResult = {
    id: string
    name: string
    size: number
    expiresAt: Date | null
    dealer: { companyName: string } | null
    [key: string]: unknown
  }

  return documents.map((doc: SearchDocQueryResult) => {
    const expiration = checkExpiration(doc.expiresAt)
    return {
      ...doc,
      dealerName: doc.dealer?.companyName,
      isExpired: expiration.isExpired,
      isExpiringSoon: expiration.isExpiringSoon,
      formattedSize: formatFileSize(doc.size),
      fileExtension: getFileExtension(doc.name),
    }
  })
}

// Get recent documents
export async function getRecentDocuments(limit: number = 10): Promise<DocumentWithDetails[]> {
  const documents = await prisma.document.findMany({
    include: {
      dealer: { select: { companyName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  type RecentDocQueryResult = {
    id: string
    name: string
    size: number
    expiresAt: Date | null
    dealer: { companyName: string } | null
    [key: string]: unknown
  }

  return documents.map((doc: RecentDocQueryResult) => {
    const expiration = checkExpiration(doc.expiresAt)
    return {
      ...doc,
      dealerName: doc.dealer?.companyName,
      isExpired: expiration.isExpired,
      isExpiringSoon: expiration.isExpiringSoon,
      formattedSize: formatFileSize(doc.size),
      fileExtension: getFileExtension(doc.name),
    }
  })
}
