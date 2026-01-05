import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChangePasswordForm } from './ChangePasswordForm'
import Link from 'next/link'

export const metadata = {
  title: 'Change Password - THOR Dealer Portal',
  description: 'Change your THOR Dealer Portal password',
}

export default async function ChangePasswordPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/profile"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your password to keep your account secure
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
