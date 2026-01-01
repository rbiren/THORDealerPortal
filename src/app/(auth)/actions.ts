'use server'

import { signIn } from '@/lib/auth'
import { loginSchema, forgotPasswordSchema } from '@/lib/validations/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { createPasswordResetRequest, completePasswordReset } from '@/lib/services/password-reset'
import { sendPasswordResetEmail } from '@/lib/services/email'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export type LoginState = {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawFormData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // Validate input
  const validatedFields = loginSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input' }
  }

  const { email, password } = validatedFields.data

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' }
        default:
          return { error: 'An error occurred. Please try again.' }
      }
    }
    throw error
  }

  redirect('/dashboard')
}

// Forgot password action
export type ForgotPasswordState = {
  error?: string
  success?: boolean
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const rawFormData = {
    email: formData.get('email'),
  }

  // Validate input
  const validatedFields = forgotPasswordSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input' }
  }

  const { email } = validatedFields.data

  try {
    // Create reset request (returns null if user doesn't exist, but we don't reveal that)
    const result = await createPasswordResetRequest(email)

    if (result) {
      // Send email with reset link
      await sendPasswordResetEmail(email, result.token, result.expiresAt)
    }

    // Always return success to prevent email enumeration
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: 'An error occurred. Please try again.' }
  }
}

// Reset password action
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ResetPasswordState = {
  error?: string
  success?: boolean
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const rawFormData = {
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  // Validate input
  const validatedFields = resetPasswordSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input' }
  }

  const { token, password } = validatedFields.data

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Complete the reset
    const result = await completePasswordReset(token, hashedPassword)

    if (!result.success) {
      return { error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Password reset completion error:', error)
    return { error: 'An error occurred. Please try again.' }
  }
}
