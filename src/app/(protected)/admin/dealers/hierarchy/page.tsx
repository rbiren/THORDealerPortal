import Link from 'next/link'
import { getDealerHierarchy } from '../actions'
import { DealerTree } from './DealerTree'

export const metadata = {
  title: 'Dealer Hierarchy - THOR Dealer Portal Admin',
  description: 'View dealer hierarchy and parent/child relationships',
}

export default async function DealerHierarchyPage() {
  const hierarchy = await getDealerHierarchy()

  return (
    <div className="space-y-6">
      <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dealer Hierarchy</h1>
              <p className="mt-1 text-sm text-gray-600">
                Visualize parent/child relationships between dealers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dealers"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                List View
              </Link>
              <Link
                href="/admin/dealers/onboarding"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Onboard Dealer
              </Link>
            </div>
          </div>
        </div>

      <DealerTree dealers={hierarchy} />
    </div>
  )
}
