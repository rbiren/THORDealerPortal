'use server'

import { auth } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validations/password'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export type ChangePasswordState = {
  error?: string
  success?: boolean
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: 'You must be logged in to change your password' }
  }

  const rawFormData = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  }

  // Validate input
  const validatedFields = changePasswordSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input' }
  }

  const { currentPassword, newPassword } = validatedFields.data

  try {
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user) {
      return { error: 'User not found' }
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    )

    if (!isValidPassword) {
      return { error: 'Current password is incorrect' }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  } catch (error) {
    console.error('Password change error:', error)
    return { error: 'Failed to change password. Please try again.' }
  }
}
