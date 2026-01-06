import Link from 'next/link'
import { ProgramForm } from '../ProgramForm'
import { getDealerTiers } from '../actions'

export const metadata = {
  title: 'New Incentive Program - Admin',
  description: 'Create a new dealer incentive program',
}

export default async function NewProgramPage() {
  const tiers = await getDealerTiers()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <span>New Program</span>
        </nav>
        <h1 className="page-title">Create Incentive Program</h1>
        <p className="page-subtitle">Set up a new rebate, co-op, contest, or spiff program for dealers</p>
      </div>

      <ProgramForm tiers={tiers} />
    </div>
  )
}
