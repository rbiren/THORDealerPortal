import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminProgram, getDealerTiers } from '../../actions'
import { ProgramForm } from '../../ProgramForm'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const program = await getAdminProgram(id)

  if (!program) {
    return { title: 'Program Not Found' }
  }

  return {
    title: `Edit ${program.name} - Incentive Programs`,
  }
}

export default async function EditProgramPage({ params }: Props) {
  const { id } = await params

  const [program, tiers] = await Promise.all([
    getAdminProgram(id),
    getDealerTiers(),
  ])

  if (!program) {
    notFound()
  }

  // Only allow editing of draft or active programs
  if (['completed', 'cancelled'].includes(program.status)) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/admin/incentives">Incentives</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href={`/admin/incentives/${id}`}>{program.name}</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Edit</span>
          </nav>
        </div>
        <div className="card">
          <div className="card-body text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-medium-gray"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">Program Cannot Be Edited</h3>
            <p className="mt-2 text-medium-gray">
              This program has been {program.status} and cannot be modified.
            </p>
            <Link href={`/admin/incentives/${id}`} className="btn-primary mt-6">
              Back to Program
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/admin/incentives/${id}`}>{program.name}</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Edit</span>
        </nav>
        <h1 className="page-title">Edit Program</h1>
        <p className="page-subtitle">
          Update program settings and rules. Some fields cannot be changed after creation.
        </p>
      </div>

      <ProgramForm program={program} tiers={tiers} />
    </div>
  )
}
