'use server'

import { auth } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations/profile'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type ProfileState = {
  error?: string
  success?: boolean
}

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'You must be logged in to update your profile' }
  }

  const rawFormData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone') || '',
  }

  // Validate input
  const validatedFields = updateProfileSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input' }
  }

  const { firstName, lastName, phone } = validatedFields.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'Failed to update profile. Please try again.' }
  }
}

export async function getProfileData() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
          tier: true,
        },
      },
    },
  })

  return user
}
