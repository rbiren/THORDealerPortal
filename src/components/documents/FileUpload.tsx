'use client'

import { useState, useRef, useCallback } from 'react'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: UploadStatus
  error?: string
  url?: string
}

export interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  disabled?: boolean
  className?: string
}

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB default

export function validateFile(
  file: File,
  options?: { maxSize?: number; allowedTypes?: string[] }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || MAX_FILE_SIZE
  const allowedTypes = options?.allowedTypes || ALLOWED_TYPES

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatBytes(maxSize)} limit`,
    }
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    }
  }

  return { valid: true }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function FileUpload({
  onUpload,
  accept,
  maxSize = MAX_FILE_SIZE,
  maxFiles = 10,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: UploadedFile[] = []
      const validFiles: File[] = []

      const filesArray = Array.from(fileList).slice(0, maxFiles - files.length)

      for (const file of filesArray) {
        const validation = validateFile(file, { maxSize })
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: validation.valid ? 'idle' : 'error',
          error: validation.error,
        }

        newFiles.push(uploadedFile)
        if (validation.valid) {
          validFiles.push(file)
        }
      }

      setFiles((prev) => [...prev, ...newFiles])

      if (validFiles.length > 0) {
        setIsUploading(true)

        // Simulate upload progress
        const updateProgress = (fileId: string, progress: number) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, progress, status: progress === 100 ? 'success' : 'uploading' }
                : f
            )
          )
        }

        // Simulate progress for each file
        for (const file of newFiles.filter((f) => f.status !== 'error')) {
          for (let i = 0; i <= 100; i += 10) {
            await new Promise((resolve) => setTimeout(resolve, 50))
            updateProgress(file.id, i)
          }
        }

        try {
          await onUpload(validFiles)
          setFiles((prev) =>
            prev.map((f) =>
              validFiles.some((vf) => vf.name === f.name)
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          )
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              validFiles.some((vf) => vf.name === f.name)
                ? { ...f, status: 'error', error: 'Upload failed' }
                : f
            )
          )
        }

        setIsUploading(false)
      }
    },
    [files.length, maxFiles, maxSize, onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled || isUploading) return

      const { files: droppedFiles } = e.dataTransfer
      if (droppedFiles?.length) {
        processFiles(droppedFiles)
      }
    },
    [disabled, isUploading, processFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target
      if (selectedFiles?.length) {
        processFiles(selectedFiles)
      }
      // Reset input value
      e.target.value = ''
    },
    [processFiles]
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-olive bg-olive/5' : 'border-gray-300 hover:border-olive'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-olive/10 rounded-full">
            <svg
              className="h-8 w-8 text-olive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or <span className="text-olive font-medium">browse</span> to select files
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Max {formatBytes(maxSize)} per file • Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* File Icon */}
                <div
                  className={`flex-shrink-0 p-2 rounded ${
                    file.status === 'error'
                      ? 'bg-red-100'
                      : file.status === 'success'
                        ? 'bg-green-100'
                        : 'bg-gray-200'
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${
                      file.status === 'error'
                        ? 'text-red-500'
                        : file.status === 'success'
                          ? 'text-green-500'
                          : 'text-gray-500'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {file.status === 'success' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    ) : file.status === 'error' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    )}
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(file.size)}
                    {file.error && (
                      <span className="text-red-500 ml-2">{file.error}</span>
                    )}
                  </p>
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="flex-shrink-0 w-24">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-olive rounded-full transition-all duration-200"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-0.5">
                      {file.progress}%
                    </p>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                  disabled={file.status === 'uploading'}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Simpler dropzone component
export function SimpleDropzone({
  onDrop,
  accept,
  disabled = false,
}: {
  onDrop: (files: File[]) => void
  accept?: string
  disabled?: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsDragging(false)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled && e.dataTransfer.files.length) {
          onDrop(Array.from(e.dataTransfer.files))
        }
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        ${isDragging ? 'border-olive bg-olive/5' : 'border-gray-300 hover:border-olive'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => {
          if (e.target.files?.length) {
            onDrop(Array.from(e.target.files))
            e.target.value = ''
          }
        }}
        disabled={disabled}
        className="hidden"
      />
      <svg
        className="h-8 w-8 mx-auto text-gray-400 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      <p className="text-sm text-gray-600">
        Drop files or <span className="text-olive">click to browse</span>
      </p>
    </div>
  )
}
