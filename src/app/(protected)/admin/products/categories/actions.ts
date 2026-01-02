'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { categorySchema, type CategoryInput } from '@/lib/validations/product'

// Types

export type CategoryListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  productCount: number
  children?: CategoryListItem[]
}

export type CategoryDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  parent: {
    id: string
    name: string
  } | null
  _count: {
    products: number
    children: number
  }
}

// Get all categories as a flat list

export async function getCategoriesFlat(): Promise<CategoryListItem[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      sortOrder: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return categories.map((c) => ({
    ...c,
    productCount: c._count.products,
  }))
}

// Get categories as a tree structure

export async function getCategoriesTree(): Promise<CategoryListItem[]> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return []
  }

  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      sortOrder: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  // Build tree
  const categoryMap = new Map<string, CategoryListItem>()
  const rootCategories: CategoryListItem[] = []

  // First pass: create map
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      productCount: cat._count.products,
      children: [],
    })
  })

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      rootCategories.push(node)
    }
  })

  return rootCategories
}

// Get single category

export async function getCategory(id: string): Promise<CategoryDetail | null> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return null
  }

  return prisma.productCategory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  })
}

// Create category

export type CreateCategoryState = {
  success: boolean
  message: string
  categoryId?: string
  errors?: Record<string, string[]>
}

export async function createCategory(input: CategoryInput): Promise<CreateCategoryState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const validatedData = categorySchema.parse(input)

    // Check if slug already exists
    const existingSlug = await prisma.productCategory.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingSlug) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { slug: ['Slug is already in use'] },
      }
    }

    // If parent is specified, verify it exists and check nesting depth
    if (validatedData.parentId) {
      const parent = await prisma.productCategory.findUnique({
        where: { id: validatedData.parentId },
        include: { parent: true },
      })

      if (!parent) {
        return {
          success: false,
          message: 'Parent category not found',
        }
      }

      // Check depth (max 3 levels)
      if (parent.parentId) {
        const grandparent = await prisma.productCategory.findUnique({
          where: { id: parent.parentId },
        })
        if (grandparent?.parentId) {
          return {
            success: false,
            message: 'Maximum category depth is 3 levels',
          }
        }
      }
    }

    // Get next sort order for this parent
    const lastCategory = await prisma.productCategory.findFirst({
      where: { parentId: validatedData.parentId || null },
      orderBy: { sortOrder: 'desc' },
    })
    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.productCategory.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        parentId: validatedData.parentId || null,
        sortOrder: validatedData.sortOrder ?? nextSortOrder,
      },
    })

    revalidatePath('/admin/products/categories')
    revalidatePath('/products')
    return {
      success: true,
      message: 'Category created successfully',
      categoryId: category.id,
    }
  } catch (error) {
    console.error('Create category error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        message: 'Validation failed',
        errors: { _form: ['Invalid input data'] },
      }
    }
    return { success: false, message: 'An error occurred while creating the category' }
  }
}

// Update category

export type UpdateCategoryState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<UpdateCategoryState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: { children: true },
    })

    if (!existingCategory) {
      return { success: false, message: 'Category not found' }
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== existingCategory.slug) {
      const slugExists = await prisma.productCategory.findUnique({
        where: { slug: input.slug },
      })
      if (slugExists) {
        return {
          success: false,
          message: 'Validation failed',
          errors: { slug: ['Slug is already in use'] },
        }
      }
    }

    // If changing parent, validate the move
    if (input.parentId !== undefined && input.parentId !== existingCategory.parentId) {
      // Can't make a category its own parent
      if (input.parentId === id) {
        return { success: false, message: 'Cannot set category as its own parent' }
      }

      // Can't set a child as parent (would create a cycle)
      if (input.parentId) {
        const isDescendant = await checkIsDescendant(input.parentId, id)
        if (isDescendant) {
          return { success: false, message: 'Cannot move category to its own descendant' }
        }

        // Check depth
        const newParentDepth = await getCategoryDepth(input.parentId)
        const childrenDepth = await getMaxChildrenDepth(id)
        if (newParentDepth + 1 + childrenDepth > 3) {
          return { success: false, message: 'Maximum category depth is 3 levels' }
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.description !== undefined) updateData.description = input.description
    if (input.parentId !== undefined) updateData.parentId = input.parentId
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder

    await prisma.productCategory.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/products/categories')
    revalidatePath(`/admin/products/categories/${id}`)
    revalidatePath('/products')
    return { success: true, message: 'Category updated successfully' }
  } catch (error) {
    console.error('Update category error:', error)
    return { success: false, message: 'An error occurred while updating the category' }
  }
}

// Delete category

export type DeleteCategoryState = {
  success: boolean
  message: string
}

export async function deleteCategory(id: string): Promise<DeleteCategoryState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return { success: false, message: 'Category not found' }
    }

    // Check if category has products
    if (category._count.products > 0) {
      return {
        success: false,
        message: `Cannot delete category with ${category._count.products} products. Move or delete products first.`,
      }
    }

    // Check if category has children
    if (category._count.children > 0) {
      return {
        success: false,
        message: `Cannot delete category with ${category._count.children} subcategories. Delete or move subcategories first.`,
      }
    }

    await prisma.productCategory.delete({ where: { id } })

    revalidatePath('/admin/products/categories')
    revalidatePath('/products')
    return { success: true, message: 'Category deleted successfully' }
  } catch (error) {
    console.error('Delete category error:', error)
    return { success: false, message: 'An error occurred while deleting the category' }
  }
}

// Reorder categories

export async function reorderCategories(
  categoryId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<UpdateCategoryState> {
  const session = await auth()

  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return { success: false, message: 'Category not found' }
    }

    // Validate the move if changing parent
    if (newParentId !== category.parentId) {
      if (newParentId) {
        // Can't set as its own parent
        if (newParentId === categoryId) {
          return { success: false, message: 'Cannot set category as its own parent' }
        }

        // Check for cycles
        const isDescendant = await checkIsDescendant(newParentId, categoryId)
        if (isDescendant) {
          return { success: false, message: 'Cannot move category to its own descendant' }
        }

        // Check depth
        const newParentDepth = await getCategoryDepth(newParentId)
        const childrenDepth = await getMaxChildrenDepth(categoryId)
        if (newParentDepth + 1 + childrenDepth > 3) {
          return { success: false, message: 'Maximum category depth is 3 levels' }
        }
      }
    }

    // Get all siblings at the new location
    const siblings = await prisma.productCategory.findMany({
      where: {
        parentId: newParentId,
        id: { not: categoryId },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Recalculate sort orders
    const updates: { id: string; sortOrder: number }[] = []
    let order = 0

    for (const sibling of siblings) {
      if (order === newSortOrder) {
        order++
      }
      if (sibling.sortOrder !== order) {
        updates.push({ id: sibling.id, sortOrder: order })
      }
      order++
    }

    // Update all in a transaction
    await prisma.$transaction([
      ...updates.map((u) =>
        prisma.productCategory.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder },
        })
      ),
      prisma.productCategory.update({
        where: { id: categoryId },
        data: {
          parentId: newParentId,
          sortOrder: newSortOrder,
        },
      }),
    ])

    revalidatePath('/admin/products/categories')
    revalidatePath('/products')
    return { success: true, message: 'Categories reordered successfully' }
  } catch (error) {
    console.error('Reorder categories error:', error)
    return { success: false, message: 'An error occurred while reordering categories' }
  }
}

// Helper functions

async function checkIsDescendant(categoryId: string, potentialAncestorId: string): Promise<boolean> {
  const category = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  })

  if (!category || !category.parentId) {
    return false
  }

  if (category.parentId === potentialAncestorId) {
    return true
  }

  return checkIsDescendant(category.parentId, potentialAncestorId)
}

async function getCategoryDepth(categoryId: string): Promise<number> {
  const category = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  })

  if (!category || !category.parentId) {
    return 1
  }

  return 1 + (await getCategoryDepth(category.parentId))
}

async function getMaxChildrenDepth(categoryId: string): Promise<number> {
  const children = await prisma.productCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  })

  if (children.length === 0) {
    return 0
  }

  const depths = await Promise.all(children.map((c) => getMaxChildrenDepth(c.id)))
  return 1 + Math.max(...depths)
}
