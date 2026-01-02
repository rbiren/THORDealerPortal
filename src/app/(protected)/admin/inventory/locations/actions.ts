'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SCHEMAS
// ============================================================================

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20).regex(/^[A-Z0-9-]+$/i, 'Code can only contain letters, numbers, and hyphens'),
  type: z.enum(['warehouse', 'store', 'distribution_center']),
  address: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
})

type LocationInput = z.infer<typeof locationSchema>

// ============================================================================
// TYPES
// ============================================================================

export type LocationDetail = {
  id: string
  name: string
  code: string
  type: string
  address: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    inventory: number
  }
}

export type LocationListItem = {
  id: string
  name: string
  code: string
  type: string
  address: string | null
  isActive: boolean
  inventoryCount: number
  totalStock: number
  totalValue: number
}

type CreateLocationState = {
  success: boolean
  message: string
  location?: LocationDetail
  errors?: Record<string, string[]>
}

type UpdateLocationState = {
  success: boolean
  message: string
  location?: LocationDetail
  errors?: Record<string, string[]>
}

type DeleteLocationState = {
  success: boolean
  message: string
}

// ============================================================================
// CREATE
// ============================================================================

export async function createLocation(input: LocationInput): Promise<CreateLocationState> {
  try {
    const validated = locationSchema.safeParse(input)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { name, code, type, address, isActive } = validated.data

    // Check for duplicate code
    const existing = await prisma.inventoryLocation.findUnique({
      where: { code },
    })

    if (existing) {
      return {
        success: false,
        message: 'Location code already exists',
        errors: { code: ['A location with this code already exists'] },
      }
    }

    const location = await prisma.inventoryLocation.create({
      data: {
        name,
        code: code.toUpperCase(),
        type,
        address: address || null,
        isActive,
      },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    })

    revalidatePath('/admin/inventory/locations')
    revalidatePath('/admin/inventory')

    return {
      success: true,
      message: 'Location created successfully',
      location,
    }
  } catch (error) {
    console.error('Failed to create location:', error)
    return {
      success: false,
      message: 'Failed to create location',
    }
  }
}

// ============================================================================
// READ
// ============================================================================

export async function getLocations(): Promise<LocationListItem[]> {
  const locations = await prisma.inventoryLocation.findMany({
    include: {
      inventory: {
        include: {
          product: {
            select: { costPrice: true, price: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return locations.map((location) => {
    let totalStock = 0
    let totalValue = 0

    for (const item of location.inventory) {
      totalStock += item.quantity
      const unitValue = item.product.costPrice ?? item.product.price
      totalValue += item.quantity * unitValue
    }

    return {
      id: location.id,
      name: location.name,
      code: location.code,
      type: location.type,
      address: location.address,
      isActive: location.isActive,
      inventoryCount: location.inventory.length,
      totalStock,
      totalValue,
    }
  })
}

export async function getLocation(id: string): Promise<LocationDetail | null> {
  const location = await prisma.inventoryLocation.findUnique({
    where: { id },
    include: {
      _count: {
        select: { inventory: true },
      },
    },
  })

  return location
}

export async function getLocationByCode(code: string): Promise<LocationDetail | null> {
  const location = await prisma.inventoryLocation.findUnique({
    where: { code },
    include: {
      _count: {
        select: { inventory: true },
      },
    },
  })

  return location
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateLocation(
  id: string,
  input: Partial<LocationInput>
): Promise<UpdateLocationState> {
  try {
    const existing = await prisma.inventoryLocation.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        message: 'Location not found',
      }
    }

    // Validate partial input
    const partialSchema = locationSchema.partial()
    const validated = partialSchema.safeParse(input)

    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { name, code, type, address, isActive } = validated.data

    // Check for duplicate code if changing
    if (code && code.toUpperCase() !== existing.code) {
      const duplicateCode = await prisma.inventoryLocation.findUnique({
        where: { code: code.toUpperCase() },
      })

      if (duplicateCode) {
        return {
          success: false,
          message: 'Location code already exists',
          errors: { code: ['A location with this code already exists'] },
        }
      }
    }

    const location = await prisma.inventoryLocation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(type !== undefined && { type }),
        ...(address !== undefined && { address: address || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    })

    revalidatePath('/admin/inventory/locations')
    revalidatePath(`/admin/inventory/locations/${id}`)
    revalidatePath('/admin/inventory')

    return {
      success: true,
      message: 'Location updated successfully',
      location,
    }
  } catch (error) {
    console.error('Failed to update location:', error)
    return {
      success: false,
      message: 'Failed to update location',
    }
  }
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteLocation(id: string): Promise<DeleteLocationState> {
  try {
    const location = await prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    })

    if (!location) {
      return {
        success: false,
        message: 'Location not found',
      }
    }

    // Check if location has inventory
    if (location._count.inventory > 0) {
      return {
        success: false,
        message: `Cannot delete location with ${location._count.inventory} inventory items. Please move or remove inventory first.`,
      }
    }

    await prisma.inventoryLocation.delete({
      where: { id },
    })

    revalidatePath('/admin/inventory/locations')
    revalidatePath('/admin/inventory')

    return {
      success: true,
      message: 'Location deleted successfully',
    }
  } catch (error) {
    console.error('Failed to delete location:', error)
    return {
      success: false,
      message: 'Failed to delete location',
    }
  }
}

// ============================================================================
// TOGGLE STATUS
// ============================================================================

export async function toggleLocationStatus(id: string): Promise<UpdateLocationState> {
  try {
    const location = await prisma.inventoryLocation.findUnique({
      where: { id },
    })

    if (!location) {
      return {
        success: false,
        message: 'Location not found',
      }
    }

    const updated = await prisma.inventoryLocation.update({
      where: { id },
      data: { isActive: !location.isActive },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    })

    revalidatePath('/admin/inventory/locations')
    revalidatePath('/admin/inventory')

    return {
      success: true,
      message: `Location ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      location: updated,
    }
  } catch (error) {
    console.error('Failed to toggle location status:', error)
    return {
      success: false,
      message: 'Failed to update location status',
    }
  }
}
