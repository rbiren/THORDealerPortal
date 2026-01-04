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
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/profile">Profile</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Change Password</span>
        </nav>
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">
          Update your password to keep your account secure
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="card">
          <div className="card-body">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
