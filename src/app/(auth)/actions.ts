'use server'

import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

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
