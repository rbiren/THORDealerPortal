'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type EnrollmentListItem, approveEnrollmentAction } from '../actions'

type Props = {
  enrollments: EnrollmentListItem[]
  programId: string
}

export function EnrollmentsTab({ enrollments, programId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'badge-warning',
      active: 'badge-success',
      suspended: 'badge-danger',
      withdrawn: 'badge-gray',
    }
    return styles[status] || 'badge-gray'
  }

  const getTierBadge = (tier: string) => {
    const styles: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-100 text-gray-800',
      bronze: 'bg-orange-100 text-orange-800',
    }
    return styles[tier] || 'bg-gray-100 text-gray-800'
  }

  const handleApprove = async (enrollmentId: string) => {
    startTransition(async () => {
      const result = await approveEnrollmentAction(enrollmentId)
      if (!result.success) {
        alert(result.message)
      } else {
        router.refresh()
      }
    })
  }

  const pendingCount = enrollments.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="card-body flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-yellow-800">
              {pendingCount} enrollment{pendingCount > 1 ? 's' : ''} pending approval
            </span>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Accrued</th>
                <th>Paid</th>
                <th>Pending</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={isPending ? 'opacity-50' : ''}>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-medium-gray">
                    No dealers enrolled in this program yet
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      <div className="font-medium">{enrollment.dealer.name}</div>
                      <div className="text-sm text-medium-gray">{enrollment.dealer.code}</div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTierBadge(enrollment.dealer.tier)}`}>
                        {enrollment.dealer.tier}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td>{formatDate(enrollment.enrolledAt)}</td>
                    <td className="font-medium text-green-600">
                      {formatCurrency(enrollment.accruedAmount)}
                    </td>
                    <td>{formatCurrency(enrollment.paidAmount)}</td>
                    <td className="text-orange-600">
                      {formatCurrency(enrollment.pendingAmount)}
                    </td>
                    <td className="text-right">
                      {enrollment.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(enrollment.id)}
                          className="btn-sm btn-primary"
                          disabled={isPending}
                        >
                          Approve
                        </button>
                      )}
                      {enrollment.status === 'active' && (
                        <button className="btn-sm btn-outline">
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
