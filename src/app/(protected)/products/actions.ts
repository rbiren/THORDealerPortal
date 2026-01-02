'use server'

import { prisma } from '@/lib/prisma'
import type { ProductFilterInput } from '@/lib/validations/product'

export type ProductListItem = {
  id: string
  sku: string
  name: string
  description: string | null
  price: number
  costPrice: number | null
  status: string
  category: {
    id: string
    name: string
    slug: string
  } | null
  primaryImage: {
    url: string
    altText: string | null
  } | null
  totalStock: number
  createdAt: Date
}

export type ProductListResult = {
  products: ProductListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type CategoryWithCount = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  _count: {
    products: number
  }
  children?: CategoryWithCount[]
}

/**
 * Get products with filtering and pagination
 */
export async function getProducts(filters: ProductFilterInput): Promise<ProductListResult> {
  const {
    search,
    categoryId,
    status,
    minPrice,
    maxPrice,
    inStock,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = filters

  // Build where clause
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) {
      (where.price as Record<string, number>).gte = minPrice
    }
    if (maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = maxPrice
    }
  }

  // Get products
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        costPrice: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            url: true,
            altText: true,
          },
          where: { isPrimary: true },
          take: 1,
        },
        inventory: {
          select: {
            quantity: true,
            reserved: true,
          },
        },
        createdAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])

  // Filter by stock if needed
  let filteredProducts = products.map((p) => ({
    ...p,
    primaryImage: p.images[0] || null,
    totalStock: p.inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reserved), 0),
  }))

  if (inStock === 'yes') {
    filteredProducts = filteredProducts.filter((p) => p.totalStock > 0)
  } else if (inStock === 'no') {
    filteredProducts = filteredProducts.filter((p) => p.totalStock <= 0)
  }

  // Map to final structure
  const result: ProductListItem[] = filteredProducts.map(({ images, inventory, ...p }) => ({
    ...p,
    primaryImage: p.primaryImage,
    totalStock: p.totalStock,
  }))

  return {
    products: result,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get product categories as a hierarchical tree
 */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      sortOrder: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  // Build tree structure
  const categoryMap = new Map<string, CategoryWithCount & { children: CategoryWithCount[] }>()
  const rootCategories: CategoryWithCount[] = []

  // First pass: create map
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        rootCategories.push(node)
      }
    } else {
      rootCategories.push(node)
    }
  })

  return rootCategories
}

/**
 * Get flat list of categories for filter dropdown
 */
export async function getCategoriesFlat(): Promise<{ id: string; name: string; slug: string; parentId: string | null }[]> {
  return prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
    orderBy: [{ name: 'asc' }],
  })
}

/**
 * Get product statistics
 */
export async function getProductStats(): Promise<{
  total: number
  active: number
  draft: number
  discontinued: number
  lowStock: number
  outOfStock: number
}> {
  const [total, active, draft, discontinued] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'active' } }),
    prisma.product.count({ where: { status: 'draft' } }),
    prisma.product.count({ where: { status: 'discontinued' } }),
  ])

  // Calculate low stock and out of stock
  const productsWithInventory = await prisma.product.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      inventory: {
        select: {
          quantity: true,
          reserved: true,
        },
      },
    },
  })

  let lowStock = 0
  let outOfStock = 0

  productsWithInventory.forEach((product) => {
    const available = product.inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reserved), 0)
    if (available <= 0) {
      outOfStock++
    } else if (available <= 10) {
      lowStock++
    }
  })

  return {
    total,
    active,
    draft,
    discontinued,
    lowStock,
    outOfStock,
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      inventory: {
        include: {
          location: true,
        },
      },
    },
  })
}
