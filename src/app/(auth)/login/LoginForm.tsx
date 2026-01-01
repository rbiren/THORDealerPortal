'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '../actions'
import Link from 'next/link'

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="alert-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-error"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            className="input disabled:bg-light-beige disabled:text-medium-gray disabled:cursor-not-allowed"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-semibold text-olive hover:text-olive-800"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            className="input disabled:bg-light-beige disabled:text-medium-gray disabled:cursor-not-allowed"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-off-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  )
}
