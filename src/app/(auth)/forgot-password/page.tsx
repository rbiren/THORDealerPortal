import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata = {
  title: 'Forgot Password - THOR Dealer Portal',
  description: 'Reset your THOR Dealer Portal password',
}

export default function ForgotPasswordPage() {
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-medium-gray">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="card">
          <div className="card-body">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
