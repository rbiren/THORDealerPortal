'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createIncentiveProgram, updateIncentiveProgram, type ProgramDetail } from './actions'
import { type ProgramRules } from '@/lib/services/incentives'

type Props = {
  program?: ProgramDetail | null
  tiers: Array<{ value: string; label: string }>
}

type RuleTier = {
  name: string
  minVolume: number
  maxVolume?: number
  rate: number
}

export function ProgramForm({ program, tiers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: program?.name || '',
    code: program?.code || '',
    description: program?.description || '',
    type: program?.type || 'rebate',
    subtype: program?.subtype || '',
    startDate: program?.startDate ? new Date(program.startDate).toISOString().split('T')[0] : '',
    endDate: program?.endDate ? new Date(program.endDate).toISOString().split('T')[0] : '',
    enrollmentDeadline: program?.enrollmentDeadline ? new Date(program.enrollmentDeadline).toISOString().split('T')[0] : '',
    eligibleTiers: program?.eligibleTiers || [] as string[],
    minOrderVolume: program?.minOrderVolume?.toString() || '',
    budgetAmount: program?.budgetAmount?.toString() || '',
    autoEnroll: program?.autoEnroll || false,
    requiresApproval: program?.requiresApproval ?? true,
  })

  // Rules state
  const [ruleType, setRuleType] = useState<'tiered' | 'flat'>(
    program?.rules?.tiers?.length ? 'tiered' : 'flat'
  )
  const [flatRate, setFlatRate] = useState(
    program?.rules?.flatRate ? (program.rules.flatRate * 100).toString() : ''
  )
  const [maxPayout, setMaxPayout] = useState(
    program?.rules?.maxPayout?.toString() || ''
  )
  const [maxPayoutPerDealer, setMaxPayoutPerDealer] = useState(
    program?.rules?.maxPayoutPerDealer?.toString() || ''
  )
  const [ruleTiers, setRuleTiers] = useState<RuleTier[]>(
    program?.rules?.tiers?.length
      ? program.rules.tiers.map((t) => ({
          ...t,
          rate: t.rate * 100, // Convert to percentage for display
        }))
      : [{ name: 'Base', minVolume: 0, rate: 1 }]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrors((prev) => ({ ...prev, [name]: [] }))
  }

  const handleTierToggle = (tier: string) => {
    setFormData((prev) => ({
      ...prev,
      eligibleTiers: prev.eligibleTiers.includes(tier)
        ? prev.eligibleTiers.filter((t) => t !== tier)
        : [...prev.eligibleTiers, tier],
    }))
  }

  const addRuleTier = () => {
    const lastTier = ruleTiers[ruleTiers.length - 1]
    setRuleTiers([
      ...ruleTiers,
      {
        name: `Tier ${ruleTiers.length + 1}`,
        minVolume: (lastTier?.minVolume || 0) + 10000,
        rate: (lastTier?.rate || 1) + 0.5,
      },
    ])
  }

  const updateRuleTier = (index: number, field: keyof RuleTier, value: string | number) => {
    setRuleTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    )
  }

  const removeRuleTier = (index: number) => {
    if (ruleTiers.length > 1) {
      setRuleTiers((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const buildRules = (): ProgramRules => {
    if (ruleType === 'flat') {
      return {
        flatRate: parseFloat(flatRate || '0') / 100,
        maxPayout: maxPayout ? parseFloat(maxPayout) : undefined,
        maxPayoutPerDealer: maxPayoutPerDealer ? parseFloat(maxPayoutPerDealer) : undefined,
      }
    }
    return {
      tiers: ruleTiers.map((t) => ({
        name: t.name,
        minVolume: Number(t.minVolume),
        maxVolume: t.maxVolume ? Number(t.maxVolume) : undefined,
        rate: Number(t.rate) / 100, // Convert back to decimal
      })),
      maxPayout: maxPayout ? parseFloat(maxPayout) : undefined,
      maxPayoutPerDealer: maxPayoutPerDealer ? parseFloat(maxPayoutPerDealer) : undefined,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      if (program) {
        // Update
        const result = await updateIncentiveProgram(program.id, {
          name: formData.name,
          description: formData.description,
          endDate: formData.endDate,
          enrollmentDeadline: formData.enrollmentDeadline,
          eligibleTiers: formData.eligibleTiers,
          minOrderVolume: formData.minOrderVolume ? parseFloat(formData.minOrderVolume) : undefined,
          rules: buildRules(),
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
        })

        if (result.success) {
          router.push(`/admin/incentives/${program.id}`)
        } else {
          setErrors(result.errors || { _form: [result.message] })
        }
      } else {
        // Create
        const result = await createIncentiveProgram({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          type: formData.type as 'rebate' | 'coop' | 'contest' | 'spiff',
          subtype: formData.subtype || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          enrollmentDeadline: formData.enrollmentDeadline || undefined,
          eligibleTiers: formData.eligibleTiers.length ? formData.eligibleTiers : undefined,
          minOrderVolume: formData.minOrderVolume ? parseFloat(formData.minOrderVolume) : undefined,
          rules: buildRules(),
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
          autoEnroll: formData.autoEnroll,
          requiresApproval: formData.requiresApproval,
        })

        if (result.success && result.programId) {
          router.push(`/admin/incentives/${result.programId}`)
        } else {
          setErrors(result.errors || { _form: [result.message] })
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._form && (
        <div className="alert alert-danger">
          {errors._form.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Basic Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Basic Information</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Program Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                className={`input w-full ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Q1 2026 Volume Rebate"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="label">
                Program Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                className={`input w-full uppercase ${errors.code ? 'input-error' : ''}`}
                value={formData.code}
                onChange={handleChange}
                placeholder="REBATE-2026-Q1"
                disabled={!!program}
              />
              {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code[0]}</p>}
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              className="input w-full"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the program terms and conditions..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Program Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                className="input w-full"
                value={formData.type}
                onChange={handleChange}
                disabled={!!program}
              >
                <option value="rebate">Rebate</option>
                <option value="coop">Co-op Fund</option>
                <option value="contest">Contest</option>
                <option value="spiff">Spiff</option>
              </select>
            </div>
            <div>
              <label className="label">Subtype</label>
              <input
                type="text"
                name="subtype"
                className="input w-full"
                value={formData.subtype}
                onChange={handleChange}
                placeholder="e.g., Volume-based, Tiered"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Program Dates</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                className={`input w-full ${errors.startDate ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
                disabled={!!program}
              />
              {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate[0]}</p>}
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                name="endDate"
                className="input w-full"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Enrollment Deadline</label>
              <input
                type="date"
                name="enrollmentDeadline"
                className="input w-full"
                value={formData.enrollmentDeadline}
                onChange={handleChange}
              />
            </div>
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
            <label className="label">Eligible Dealer Tiers</label>
            <p className="text-sm text-medium-gray mb-2">Leave empty to include all tiers</p>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => handleTierToggle(tier.value)}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    formData.eligibleTiers.includes(tier.value)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-dark-gray border-light-gray hover:border-primary'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Minimum Order Volume</label>
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
              <input
                type="number"
                name="minOrderVolume"
                className="input w-full pl-7"
                value={formData.minOrderVolume}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Program Rules</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Rate Structure</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ruleType"
                  checked={ruleType === 'flat'}
                  onChange={() => setRuleType('flat')}
                  className="radio"
                />
                <span>Flat Rate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ruleType"
                  checked={ruleType === 'tiered'}
                  onChange={() => setRuleType('tiered')}
                  className="radio"
                />
                <span>Tiered Rates</span>
              </label>
            </div>
          </div>

          {ruleType === 'flat' ? (
            <div>
              <label className="label">Rebate Rate</label>
              <div className="relative w-32">
                <input
                  type="number"
                  value={flatRate}
                  onChange={(e) => setFlatRate(e.target.value)}
                  className="input w-full pr-8"
                  placeholder="3"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-medium-gray">%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-light-gray">
                      <th className="text-left py-2 px-2">Tier Name</th>
                      <th className="text-left py-2 px-2">Min Volume ($)</th>
                      <th className="text-left py-2 px-2">Rate (%)</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ruleTiers.map((tier, index) => (
                      <tr key={index} className="border-b border-light-gray">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => updateRuleTier(index, 'name', e.target.value)}
                            className="input w-full"
                            placeholder="Tier name"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={tier.minVolume}
                            onChange={(e) => updateRuleTier(index, 'minVolume', parseInt(e.target.value) || 0)}
                            className="input w-full"
                            min="0"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={tier.rate}
                            onChange={(e) => updateRuleTier(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="input w-full"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </td>
                        <td className="py-2 px-2">
                          {ruleTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRuleTier(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addRuleTier}
                className="btn-outline text-sm"
              >
                + Add Tier
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-light-gray">
            <div>
              <label className="label">Max Total Payout</label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
                <input
                  type="number"
                  value={maxPayout}
                  onChange={(e) => setMaxPayout(e.target.value)}
                  className="input w-full pl-7"
                  placeholder="Unlimited"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="label">Max Per Dealer</label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
                <input
                  type="number"
                  value={maxPayoutPerDealer}
                  onChange={(e) => setMaxPayoutPerDealer(e.target.value)}
                  className="input w-full pl-7"
                  placeholder="Unlimited"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget & Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Budget & Settings</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Program Budget</label>
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
              <input
                type="number"
                name="budgetAmount"
                className="input w-full pl-7"
                value={formData.budgetAmount}
                onChange={handleChange}
                placeholder="No limit"
                min="0"
              />
            </div>
            <p className="text-sm text-medium-gray mt-1">Leave empty for unlimited budget</p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoEnroll"
                checked={formData.autoEnroll}
                onChange={handleChange}
                className="checkbox"
              />
              <div>
                <span className="font-medium">Auto-enroll eligible dealers</span>
                <p className="text-sm text-medium-gray">Dealers will be automatically enrolled when program starts</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requiresApproval"
                checked={formData.requiresApproval}
                onChange={handleChange}
                className="checkbox"
              />
              <div>
                <span className="font-medium">Require enrollment approval</span>
                <p className="text-sm text-medium-gray">Admin must approve dealer enrollments</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
          disabled={isPending}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : program ? (
            'Update Program'
          ) : (
            'Create Program'
          )}
        </button>
      </div>
    </form>
  )
}
