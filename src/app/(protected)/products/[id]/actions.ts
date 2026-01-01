'use server'

import { prisma } from '@/lib/prisma'

export type ProductImage = {
  id: string
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}

export type ProductInventory = {
  quantity: number
  reserved: number
  location: {
    id: string
    name: string
    code: string
    type: string
  }
}

export type ProductDetail = {
  id: string
  sku: string
  name: string
  description: string | null
  price: number
  costPrice: number | null
  status: string
  specifications: string | null
  categoryId: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  images: ProductImage[]
  inventory: ProductInventory[]
  createdAt: Date
  updatedAt: Date
}

export type RelatedProduct = {
  id: string
  name: string
  price: number
  imageUrl: string | null
}

/**
 * Get full product details by ID
 */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        orderBy: [
          { isPrimary: 'desc' },
          { sortOrder: 'asc' },
        ],
      },
      inventory: {
        include: {
          location: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      },
    },
  })

  return product
}

/**
 * Get related products in the same category
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<RelatedProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: productId },
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.images[0]?.url || null,
  }))
}
