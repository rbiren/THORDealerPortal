'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileUpload } from '@/components/documents/FileUpload'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '../actions'

export default function UploadDocumentPage() {
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [isPublic, setIsPublic] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleUpload = async (files: File[]) => {
    // In a real implementation, this would:
    // 1. Get presigned URLs for each file
    // 2. Upload files directly to S3
    // 3. Register documents in the database
    console.log('Uploading files:', files.map((f) => f.name))

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setUploadComplete(true)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/documents"
          className="text-sm text-olive hover:underline flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Documents
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload files to the document library
        </p>
      </div>

      {uploadComplete ? (
        /* Success State */
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Complete
          </h2>
          <p className="text-gray-500 mb-6">
            Your documents have been uploaded successfully.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/documents"
              className="px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/90"
            >
              View Documents
            </Link>
            <button
              onClick={() => setUploadComplete(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Upload More
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Settings */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-olive rounded focus:ring-olive"
                />
                <span className="text-sm text-gray-700">
                  Make documents publicly accessible to all dealers
                </span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select Files
            </h2>

            <FileUpload
              onUpload={handleUpload}
              maxSize={50 * 1024 * 1024}
              maxFiles={10}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip"
            />

            {/* File Type Help */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Allowed file types
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'PDF',
                  'Word',
                  'Excel',
                  'PowerPoint',
                  'Images',
                  'Text',
                  'CSV',
                  'ZIP',
                ].map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-white border rounded text-xs text-gray-600"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 50MB • Maximum files per upload: 10
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
