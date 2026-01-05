import Link from 'next/link'
import { getParentDealers } from '../actions'
import { OnboardingWizard } from './OnboardingWizard'

export const metadata = {
  title: 'Onboard New Dealer - THOR Dealer Portal Admin',
  description: 'Complete the dealer onboarding wizard',
}

export default async function DealerOnboardingPage() {
  const parentDealers = await getParentDealers()

  return (
    <div className="space-y-6">
      <div>
          <Link
            href="/admin/dealers"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to dealers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Dealer Onboarding</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete the following steps to onboard a new dealer.
          </p>
        </div>

      <OnboardingWizard parentDealers={parentDealers} />
    </div>
  )
}
