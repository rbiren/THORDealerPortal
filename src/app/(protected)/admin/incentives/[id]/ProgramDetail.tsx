'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type ProgramDetail as ProgramDetailType, changeProgramStatus } from '../actions'

type Props = {
  program: ProgramDetailType
  tiers: Array<{ value: string; label: string }>
}

export function ProgramDetail({ program, tiers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'Unlimited'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTierLabel = (value: string) => {
    const tier = tiers.find((t) => t.value === value)
    return tier?.label || value
  }

  const handleStatusChange = async (action: 'activate' | 'pause' | 'complete' | 'cancel') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this program?')) return

    startTransition(async () => {
      const result = await changeProgramStatus(program.id, action)
      if (!result.success) {
        alert(result.message)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Status Actions */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Program Status</h3>
              <p className="text-sm text-medium-gray">
                {program.status === 'draft' && 'This program is in draft mode and not yet active'}
                {program.status === 'active' && 'This program is currently active and accepting enrollments'}
                {program.status === 'paused' && 'This program is temporarily paused'}
                {program.status === 'completed' && 'This program has been completed'}
                {program.status === 'cancelled' && 'This program has been cancelled'}
              </p>
            </div>
            <div className="flex gap-2">
              {program.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('activate')}
                  className="btn-primary"
                  disabled={isPending}
                >
                  Activate Program
                </button>
              )}
              {program.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('pause')}
                    className="btn-warning"
                    disabled={isPending}
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => handleStatusChange('complete')}
                    className="btn-outline"
                    disabled={isPending}
                  >
                    Complete
                  </button>
                </>
              )}
              {program.status === 'paused' && (
                <>
                  <button
                    onClick={() => handleStatusChange('activate')}
                    className="btn-primary"
                    disabled={isPending}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancel')}
                    className="btn-danger"
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Program Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-medium-gray">Type</p>
                <p className="font-medium capitalize">{program.type}</p>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Subtype</p>
                <p className="font-medium">{program.subtype || '-'}</p>
              </div>
            </div>
            {program.description && (
              <div>
                <p className="text-sm text-medium-gray">Description</p>
                <p>{program.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Program Dates</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-medium-gray">Start Date</p>
              <p className="font-medium">{formatDate(program.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-medium-gray">End Date</p>
              <p className="font-medium">{formatDate(program.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-medium-gray">Enrollment Deadline</p>
              <p className="font-medium">{formatDate(program.enrollmentDeadline)}</p>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Eligibility</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-medium-gray">Eligible Tiers</p>
              {program.eligibleTiers.length === 0 ? (
                <p className="font-medium">All tiers</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {program.eligibleTiers.map((tier) => (
                    <span key={tier} className="badge badge-info">
                      {getTierLabel(tier)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-medium-gray">Minimum Order Volume</p>
              <p className="font-medium">
                {program.minOrderVolume ? formatCurrency(program.minOrderVolume) : 'No minimum'}
              </p>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Budget</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-medium-gray">Total Budget</p>
              <p className="font-medium">{formatCurrency(program.budgetAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-medium-gray">Amount Spent</p>
              <p className="font-medium text-green-600">{formatCurrency(program.spentAmount)}</p>
            </div>
            {program.budgetAmount && (
              <div>
                <p className="text-sm text-medium-gray">Remaining</p>
                <p className="font-medium">
                  {formatCurrency(program.budgetAmount - program.spentAmount)}
                </p>
                <div className="mt-2 h-2 bg-light-gray rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min((program.spentAmount / program.budgetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Program Rules</h2>
        </div>
        <div className="card-body">
          {program.rules.tiers && program.rules.tiers.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-medium-gray">Tiered Rate Structure</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-light-gray">
                      <th className="text-left py-2 pr-4">Tier</th>
                      <th className="text-left py-2 pr-4">Min Volume</th>
                      <th className="text-left py-2 pr-4">Max Volume</th>
                      <th className="text-left py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {program.rules.tiers.map((tier, index) => (
                      <tr key={index} className="border-b border-light-gray">
                        <td className="py-2 pr-4 font-medium">{tier.name}</td>
                        <td className="py-2 pr-4">{formatCurrency(tier.minVolume)}</td>
                        <td className="py-2 pr-4">
                          {tier.maxVolume ? formatCurrency(tier.maxVolume) : 'No limit'}
                        </td>
                        <td className="py-2">{(tier.rate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-medium-gray">Flat Rate</p>
              <p className="text-2xl font-bold text-primary">
                {program.rules.flatRate ? `${(program.rules.flatRate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-light-gray grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-medium-gray">Max Total Payout</p>
              <p className="font-medium">{formatCurrency(program.rules.maxPayout)}</p>
            </div>
            <div>
              <p className="text-sm text-medium-gray">Max Per Dealer</p>
              <p className="font-medium">{formatCurrency(program.rules.maxPayoutPerDealer)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Settings</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${program.autoEnroll ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="font-medium">Auto-enrollment</p>
                <p className="text-sm text-medium-gray">
                  {program.autoEnroll ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${program.requiresApproval ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="font-medium">Requires Approval</p>
                <p className="text-sm text-medium-gray">
                  {program.requiresApproval ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
