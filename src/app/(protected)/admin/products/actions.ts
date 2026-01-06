'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/lib/validations/product'

// Types

export type AdminProductListItem = {
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
  } | null
  primaryImage: {
    url: string
    altText: string | null
  } | null
  totalStock: number
  createdAt: Date
  updatedAt: Date
}

export type AdminProductListResult = {
  products: AdminProductListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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
  images: {
    id: string
    url: string
    altText: string | null
    sortOrder: number
    isPrimary: boolean
  }[]
  inventory: {
    id: string
    quantity: number
    reserved: number
    location: {
      id: string
      name: string
      code: string
    }
  }[]
  createdAt: Date
  updatedAt: Date
}

// List products for admin

export type AdminProductFilterInput = {
  search?: string
  categoryId?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getAdminProducts(input: AdminProductFilterInput): Promise<AdminProductListResult> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { products: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const {
    search,
    categoryId,
    status,
    page = 1,
    pageSize = 20,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = input

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
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])

  type ProductQueryResult = {
    id: string
    sku: string
    name: string
    description: string | null
    price: number
    costPrice: number | null
    status: string
    createdAt: Date
    updatedAt: Date
    category: { id: string; name: string } | null
    images: Array<{ url: string; altText: string | null }>
    inventory: Array<{ quantity: number; reserved: number }>
  }

  // Map to final structure
  const result: AdminProductListItem[] = products.map((p: ProductQueryResult) => ({
    ...p,
    primaryImage: p.images[0] || null,
    totalStock: p.inventory.reduce((sum: number, inv: { quantity: number; reserved: number }) => sum + (inv.quantity - inv.reserved), 0),
  }))

  return {
    products: result,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// Get single product for editing

export async function getAdminProduct(id: string): Promise<ProductDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      price: true,
      costPrice: true,
      status: true,
      specifications: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: {
          id: true,
          url: true,
          altText: true,
          sortOrder: true,
          isPrimary: true,
        },
      },
      inventory: {
        select: {
          id: true,
          quantity: true,
          reserved: true,
          location: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  })
}

// Get categories for dropdown

export async function getAdminCategories() {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  return prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
    orderBy: { name: 'asc' },
  })
}

// Create product

export type CreateProductState = {
  success: boolean
  message: string
  productId?: string
  errors?: Record<string, string[]>
}

export async function createProduct(input: CreateProductInput): Promise<CreateProductState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = createProductSchema.parse(input)

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    })

    if (existingSku) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { sku: ['SKU is already in use'] },
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sku: validatedData.sku,
        name: validatedData.name,
        description: validatedData.description || null,
        categoryId: validatedData.categoryId || null,
        price: validatedData.price,
        costPrice: validatedData.costPrice || null,
        status: validatedData.status,
        specifications: validatedData.specifications
          ? JSON.stringify(validatedData.specifications)
          : null,
      },
    })

    revalidatePath('/admin/products')
    revalidatePath('/products')
    return {
      success: true,
      message: 'Product created successfully',
      productId: product.id,
    }
  } catch (error) {
    console.error('Create product error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while creating the product' }
  }
}

// Update product

export type UpdateProductState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function updateProduct(input: UpdateProductInput): Promise<UpdateProductState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = updateProductSchema.parse(input)
    const { id, ...updateData } = validatedData

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return { success: false, message: 'Product not found' }
    }

    // Check SKU uniqueness if changing
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: updateData.sku },
      })
      if (skuExists) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { sku: ['SKU is already in use'] },
        }
      }
    }

    // Build update data
    const cleanUpdateData: Record<string, unknown> = {}
    if (updateData.sku !== undefined) cleanUpdateData.sku = updateData.sku
    if (updateData.name !== undefined) cleanUpdateData.name = updateData.name
    if (updateData.description !== undefined) cleanUpdateData.description = updateData.description
    if (updateData.categoryId !== undefined) cleanUpdateData.categoryId = updateData.categoryId
    if (updateData.price !== undefined) cleanUpdateData.price = updateData.price
    if (updateData.costPrice !== undefined) cleanUpdateData.costPrice = updateData.costPrice
    if (updateData.status !== undefined) cleanUpdateData.status = updateData.status
    if (updateData.specifications !== undefined) {
      cleanUpdateData.specifications = updateData.specifications
        ? JSON.stringify(updateData.specifications)
        : null
    }

    await prisma.product.update({
      where: { id },
      data: cleanUpdateData,
    })

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, message: 'Product updated successfully' }
  } catch (error) {
    console.error('Update product error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while updating the product' }
  }
}

// Delete product

export type DeleteProductState = {
  success: boolean
  message: string
}

export async function deleteProduct(id: string): Promise<DeleteProductState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true,
            images: true,
          },
        },
      },
    })

    if (!product) {
      return { success: false, message: 'Product not found' }
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.inventory.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])

    revalidatePath('/admin/products')
    revalidatePath('/products')
    return { success: true, message: 'Product deleted successfully' }
  } catch (error) {
    console.error('Delete product error:', error)
    return { success: false, message: 'An error occurred while deleting the product' }
  }
}

// Image management

export type AddImageState = {
  success: boolean
  message: string
  imageId?: string
}

export async function addProductImage(
  productId: string,
  url: string,
  altText?: string,
  isPrimary?: boolean
): Promise<AddImageState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: 'desc' }, take: 1 } },
    })

    if (!product) {
      return { success: false, message: 'Product not found' }
    }

    // Get next sort order
    const nextSortOrder = (product.images[0]?.sortOrder || 0) + 1

    // If this should be primary, unset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.productImage.create({
      data: {
        productId,
        url,
        altText: altText || null,
        sortOrder: nextSortOrder,
        isPrimary: isPrimary ?? (product.images.length === 0),
      },
    })

    revalidatePath(`/admin/products/${productId}`)
    revalidatePath(`/products/${productId}`)
    return { success: true, message: 'Image added successfully', imageId: image.id }
  } catch (error) {
    console.error('Add image error:', error)
    return { success: false, message: 'An error occurred while adding the image' }
  }
}

export async function deleteProductImage(imageId: string): Promise<DeleteProductState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return { success: false, message: 'Image not found' }
    }

    await prisma.productImage.delete({ where: { id: imageId } })

    // If deleted image was primary, set another as primary
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: 'asc' },
      })
      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        })
      }
    }

    revalidatePath(`/admin/products/${image.productId}`)
    revalidatePath(`/products/${image.productId}`)
    return { success: true, message: 'Image deleted successfully' }
  } catch (error) {
    console.error('Delete image error:', error)
    return { success: false, message: 'An error occurred while deleting the image' }
  }
}

export async function setImagePrimary(imageId: string): Promise<UpdateProductState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return { success: false, message: 'Image not found' }
    }

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: image.productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ])

    revalidatePath(`/admin/products/${image.productId}`)
    revalidatePath(`/products/${image.productId}`)
    return { success: true, message: 'Primary image updated' }
  } catch (error) {
    console.error('Set primary image error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

// Bulk actions

export type BulkProductActionInput = {
  productIds: string[]
  action: 'activate' | 'draft' | 'discontinue' | 'delete'
}

export type BulkProductActionState = {
  success: boolean
  message: string
  affected: number
}

export async function bulkProductAction(input: BulkProductActionInput): Promise<BulkProductActionState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized', affected: 0 }
  }

  try {
    const { productIds, action } = input
    let affected = 0

    switch (action) {
      case 'activate':
        const activateResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: 'active' },
        })
        affected = activateResult.count
        break

      case 'draft':
        const draftResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: 'draft' },
        })
        affected = draftResult.count
        break

      case 'discontinue':
        const discontinueResult = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: 'discontinued' },
        })
        affected = discontinueResult.count
        break

      case 'delete':
        // Delete related records first
        await prisma.productImage.deleteMany({
          where: { productId: { in: productIds } },
        })
        await prisma.inventory.deleteMany({
          where: { productId: { in: productIds } },
        })
        const deleteResult = await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        })
        affected = deleteResult.count
        break

      default:
        return { success: false, message: 'Invalid action', affected: 0 }
    }

    revalidatePath('/admin/products')
    revalidatePath('/products')
    return {
      success: true,
      message: `Successfully processed ${affected} product(s)`,
      affected,
    }
  } catch (error) {
    console.error('Bulk action error:', error)
    return { success: false, message: 'An error occurred', affected: 0 }
  }
}
