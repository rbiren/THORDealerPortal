'use client'

import { useState } from 'react'
import { downloadFile } from '@/lib/export'
import type { ExportFormat } from '@/app/(protected)/reports/export/actions'

type ExportAction = (format: ExportFormat) => Promise<{
  content: string
  filename: string
  mimeType: string
}>

interface ExportButtonProps {
  onExport: ExportAction
  label?: string
  className?: string
}

export function ExportButton({
  onExport,
  label = 'Export',
  className = '',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setError(null)

    try {
      const result = await onExport(format)
      downloadFile(result.content, result.filename, result.mimeType)
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/90 disabled:opacity-50 ${className}`}
      >
        {isExporting ? (
          <svg
            className="animate-spin h-4 w-4"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        {label}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium">CSV</div>
                  <div className="text-xs text-gray-500">Comma-separated</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <svg
                  className="h-5 w-5 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium">Excel CSV</div>
                  <div className="text-xs text-gray-500">UTF-8 compatible</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium">PDF Preview</div>
                  <div className="text-xs text-gray-500">Printable format</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}

// Simpler single-format export button
interface SingleExportButtonProps {
  onExport: () => Promise<{
    content: string
    filename: string
    mimeType: string
  }>
  format: 'csv' | 'excel' | 'pdf'
  label?: string
  className?: string
}

export function SingleExportButton({
  onExport,
  format,
  label,
  className = '',
}: SingleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const formatLabels = {
    csv: 'Export CSV',
    excel: 'Export Excel',
    pdf: 'Export PDF',
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await onExport()
      downloadFile(result.content, result.filename, result.mimeType)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 ${className}`}
    >
      {isExporting ? (
        <svg
          className="animate-spin h-4 w-4"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
      {label || formatLabels[format]}
    </button>
  )
}
