import { LoginForm } from './LoginForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Sign In - THOR Dealer Portal',
  description: 'Sign in to your THOR Dealer Portal account',
}

export default async function LoginPage() {
  // Redirect if already authenticated
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-thor relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-olive rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-burnt-orange rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-off-white">
          {/* Logo */}
          <div>
            <div className="font-heading text-3xl font-extrabold tracking-tight">
              <span className="text-off-white">THOR</span>
              <span className="text-burnt-orange ml-2">DEALER</span>
            </div>
            <p className="mt-2 text-medium-gray text-sm">Portal</p>
          </div>

          {/* Tagline */}
          <div className="max-w-md">
            <h1 className="text-4xl font-heading font-bold leading-tight">
              Empowering Dealers
              <br />
              <span className="text-burnt-orange">Nationwide</span>
            </h1>
            <p className="mt-4 text-lg text-light-gray leading-relaxed">
              Access inventory, manage orders, and grow your business with the Thor Industries dealer network.
            </p>
          </div>

          {/* Footer */}
          <div className="text-medium-gray text-sm">
            <p>&copy; {new Date().getFullYear()} Thor Industries. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center bg-light-beige py-12 px-6 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <div className="font-heading text-2xl font-extrabold tracking-tight text-center">
              <span className="text-charcoal">THOR</span>
              <span className="text-burnt-orange ml-1">DEALER</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold text-charcoal">
              Welcome back
            </h2>
            <p className="mt-2 text-medium-gray">
              Sign in to your dealer account
            </p>
          </div>

          {/* Login Card */}
          <div className="card">
            <div className="card-body p-8">
              <LoginForm />
            </div>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-center text-sm text-medium-gray">
            Need help accessing your account?{' '}
            <a
              href="mailto:support@thorindustries.com"
              className="font-semibold text-olive hover:text-olive-800"
            >
              Contact support
            </a>
          </p>

          {/* Mobile Footer */}
          <p className="lg:hidden mt-8 text-center text-xs text-medium-gray">
            &copy; {new Date().getFullYear()} Thor Industries. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
