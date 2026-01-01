'use client'

import { useState, useEffect, useCallback } from 'react'

export interface PreviewDocument {
  id: string
  name: string
  url: string
  mimeType: string
  size: number
}

interface DocumentPreviewProps {
  document: PreviewDocument | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (document: PreviewDocument) => void
}

// Detect preview type from MIME type
export function getPreviewType(
  mimeType: string
): 'pdf' | 'image' | 'office' | 'text' | 'unsupported' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('text/')) return 'text'
  if (
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation')
  ) {
    return 'office'
  }
  return 'unsupported'
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentPreview({
  document,
  isOpen,
  onClose,
  onDownload,
}: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  // Reset state when document changes
  useEffect(() => {
    if (document) {
      setIsLoading(true)
      setError(null)
      setZoom(100)
    }
  }, [document?.id])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom((z) => Math.min(z + 25, 200))
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom((z) => Math.max(z - 25, 50))
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(100)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setError('Failed to load preview')
  }, [])

  if (!isOpen || !document) return null

  const previewType = getPreviewType(document.mimeType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              <FileTypeIcon mimeType={document.mimeType} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-gray-900 truncate">
                {document.name}
              </h2>
              <p className="text-sm text-gray-500">
                {formatSize(document.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {(previewType === 'pdf' || previewType === 'image') && (
              <div className="flex items-center gap-1 mr-4">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 25, 50))}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom out"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm text-gray-500 w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 25, 200))}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom in"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 hover:bg-gray-100 rounded ml-1"
                  title="Reset zoom"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}

            {/* Download */}
            {onDownload && (
              <button
                onClick={() => onDownload(document)}
                className="px-3 py-1.5 text-sm bg-olive text-white rounded-lg hover:bg-olive/90 flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Close (Esc)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {!error && (
            <PreviewContent
              document={document}
              previewType={previewType}
              zoom={zoom}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>Press Esc to close • Ctrl+/- to zoom</span>
          <span>{previewType === 'unsupported' ? 'Preview not available' : ''}</span>
        </div>
      </div>
    </div>
  )
}

// File type icon
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const getColor = () => {
    if (mimeType === 'application/pdf') return 'text-red-500'
    if (mimeType.startsWith('image/')) return 'text-purple-500'
    if (mimeType.includes('word')) return 'text-blue-500'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-green-500'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'text-orange-500'
    return 'text-gray-500'
  }

  return (
    <svg className={`h-8 w-8 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

// Preview content based on type
function PreviewContent({
  document,
  previewType,
  zoom,
  onLoad,
  onError,
}: {
  document: PreviewDocument
  previewType: 'pdf' | 'image' | 'office' | 'text' | 'unsupported'
  zoom: number
  onLoad: () => void
  onError: () => void
}) {
  switch (previewType) {
    case 'pdf':
      return (
        <iframe
          src={`${document.url}#toolbar=0&zoom=${zoom}`}
          className="w-full h-full"
          onLoad={onLoad}
          onError={onError}
          title={document.name}
        />
      )

    case 'image':
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
            onLoad={onLoad}
            onError={onError}
          />
        </div>
      )

    case 'office':
      // Microsoft Office Online Viewer or Google Docs Viewer could be used here
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Office Document</h3>
          <p className="text-gray-500 mb-4">
            Preview for Office documents requires external integration.
          </p>
          <p className="text-sm text-gray-400">
            Download the file to view it locally.
          </p>
        </div>
      )

    case 'text':
      return <TextPreview url={document.url} onLoad={onLoad} onError={onError} />

    default:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
          <p className="text-gray-500">
            This file type cannot be previewed in the browser.
          </p>
        </div>
      )
  }
}

// Text file preview
function TextPreview({
  url,
  onLoad,
  onError,
}: {
  url: string
  onLoad: () => void
  onError: () => void
}) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setLoading(false)
        onLoad()
      })
      .catch(() => {
        setLoading(false)
        onError()
      })
  }, [url, onLoad, onError])

  if (loading) return null

  return (
    <pre className="w-full h-full p-4 overflow-auto bg-white text-sm font-mono whitespace-pre-wrap">
      {content}
    </pre>
  )
}

// Simple image lightbox
export function ImageLightbox({
  src,
  alt,
  isOpen,
  onClose,
}: {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
        onClick={onClose}
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
