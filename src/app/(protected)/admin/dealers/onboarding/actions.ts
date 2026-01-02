'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { fullOnboardingSchema, type FullOnboardingInput } from '@/lib/validations/dealer'

export type OnboardingState = {
  success: boolean
  error?: string
  dealerId?: string
}

export async function submitDealerOnboarding(data: FullOnboardingInput): Promise<OnboardingState> {
  const result = fullOnboardingSchema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || 'Validation failed',
    }
  }

  const { code, name, tier, parentDealerId, ein, licenseNumber, insurancePolicy, contacts, addresses } = result.data

  try {
    // Check if dealer code already exists
    const existingDealer = await prisma.dealer.findUnique({
      where: { code },
    })

    if (existingDealer) {
      return {
        success: false,
        error: `Dealer code "${code}" already exists`,
      }
    }

    // Create dealer with contacts and addresses in a transaction
    const dealer = await prisma.$transaction(async (tx) => {
      // Create the dealer
      const newDealer = await tx.dealer.create({
        data: {
          code,
          name,
          tier,
          status: 'pending',
          parentDealerId: parentDealerId || null,
          ein: ein || null,
          licenseNumber: licenseNumber || null,
          insurancePolicy: insurancePolicy || null,
        },
      })

      // Create contacts
      if (contacts.length > 0) {
        await tx.dealerContact.createMany({
          data: contacts.map((contact) => ({
            dealerId: newDealer.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            type: contact.type,
            isPrimary: contact.isPrimary,
          })),
        })
      }

      // Create addresses
      if (addresses.length > 0) {
        await tx.dealerAddress.createMany({
          data: addresses.map((address) => ({
            dealerId: newDealer.id,
            type: address.type,
            street: address.street,
            street2: address.street2 || null,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            isPrimary: address.isPrimary,
          })),
        })
      }

      return newDealer
    })

    revalidatePath('/admin/dealers')

    return {
      success: true,
      dealerId: dealer.id,
    }
  } catch (error) {
    console.error('Dealer onboarding error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create dealer',
    }
  }
}
