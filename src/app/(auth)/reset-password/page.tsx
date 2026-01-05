import { ResetPasswordForm } from './ResetPasswordForm'
import { getResetRequestInfo } from '@/lib/services/password-reset'
import Link from 'next/link'

export const metadata = {
  title: 'Reset Password - THOR Dealer Portal',
  description: 'Set a new password for your THOR Dealer Portal account',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams

  // No token provided
  if (!token) {
    return (
      <ResetPasswordLayout>
        <InvalidTokenMessage message="No reset token provided. Please request a new password reset link." />
      </ResetPasswordLayout>
    )
  }

  // Validate token
  const tokenInfo = await getResetRequestInfo(token)

  if (!tokenInfo.valid) {
    return (
      <ResetPasswordLayout>
        <InvalidTokenMessage message={tokenInfo.error || 'Invalid reset link'} />
      </ResetPasswordLayout>
    )
  }

  return (
    <ResetPasswordLayout>
      <ResetPasswordForm token={token} email={tokenInfo.email!} />
    </ResetPasswordLayout>
  )
}

function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-light-beige py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-olive">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-charcoal">
          Create new password
        </h2>
        <p className="mt-2 text-center text-sm text-medium-gray">
          Enter your new password below
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="card">
          <div className="card-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function InvalidTokenMessage({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Invalid Reset Link
            </h3>
            <p className="mt-2 text-sm text-red-700">{message}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/forgot-password"
          className="btn-primary w-full text-center"
        >
          Request new reset link
        </Link>
        <Link
          href="/login"
          className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-charcoal shadow-sm ring-1 ring-inset ring-medium-gray hover:bg-light-beige"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
