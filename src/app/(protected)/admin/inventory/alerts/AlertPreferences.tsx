'use client'

import { useState } from 'react'

export type AlertPreferencesData = {
  emailEnabled: boolean
  frequency: 'immediate' | 'daily' | 'weekly'
  criticalOnly: boolean
  locationIds: string[]
  categoryIds: string[]
}

type Props = {
  initialPreferences?: AlertPreferencesData
  locations: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  onSave: (preferences: AlertPreferencesData) => Promise<void>
  onClose: () => void
}

export function AlertPreferences({
  initialPreferences,
  locations,
  categories,
  onSave,
  onClose,
}: Props) {
  const [preferences, setPreferences] = useState<AlertPreferencesData>(
    initialPreferences ?? {
      emailEnabled: true,
      frequency: 'daily',
      criticalOnly: false,
      locationIds: [],
      categoryIds: [],
    }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      await onSave(preferences)
      onClose()
    } catch (err) {
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  function toggleLocation(id: string) {
    setPreferences((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(id)
        ? prev.locationIds.filter((l) => l !== id)
        : [...prev.locationIds, id],
    }))
  }

  function toggleCategory(id: string) {
    setPreferences((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }))
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content w-full max-w-md mx-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Alert Preferences</h2>
          <button onClick={onClose} className="text-medium-gray hover:text-charcoal">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="card-body space-y-6">
          {error && <div className="alert-error">{error}</div>}

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-charcoal">Email Notifications</label>
              <p className="text-sm text-medium-gray">
                Receive alerts via email
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setPreferences((prev) => ({
                  ...prev,
                  emailEnabled: !prev.emailEnabled,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailEnabled ? 'bg-olive' : 'bg-light-gray'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.emailEnabled && (
            <>
              {/* Frequency */}
              <div>
                <label className="label">Notification Frequency</label>
                <select
                  value={preferences.frequency}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      frequency: e.target.value as AlertPreferencesData['frequency'],
                    }))
                  }
                  className="select"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
                <p className="helper-text">
                  {preferences.frequency === 'immediate'
                    ? 'Receive notifications as soon as stock goes low'
                    : preferences.frequency === 'daily'
                    ? 'Receive a daily summary of low stock items'
                    : 'Receive a weekly summary of low stock items'}
                </p>
              </div>

              {/* Critical Only */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-charcoal">Critical Only</label>
                  <p className="text-sm text-medium-gray">
                    Only notify for critical (out of stock) items
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      criticalOnly: !prev.criticalOnly,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.criticalOnly ? 'bg-olive' : 'bg-light-gray'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.criticalOnly ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Location Filters */}
              {locations.length > 0 && (
                <div>
                  <label className="label">Monitor Locations</label>
                  <p className="helper-text mb-2">
                    Select specific locations or leave empty for all
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {locations.map((location) => (
                      <label
                        key={location.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={preferences.locationIds.includes(location.id)}
                          onChange={() => toggleLocation(location.id)}
                          className="rounded border-light-gray"
                        />
                        <span className="text-sm">{location.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Filters */}
              {categories.length > 0 && (
                <div>
                  <label className="label">Monitor Categories</label>
                  <p className="helper-text mb-2">
                    Select specific categories or leave empty for all
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={preferences.categoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="rounded border-light-gray"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card-footer flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
