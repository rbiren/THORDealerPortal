'use client'

import { useState, useTransition } from 'react'
import {
  addProductImage,
  deleteProductImage,
  setImagePrimary,
  type ProductDetail,
} from '../actions'

type Props = {
  product: ProductDetail
}

export function ImageManager({ product }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImageUrl.trim()) return

    setMessage(null)
    startTransition(async () => {
      const result = await addProductImage(
        product.id,
        newImageUrl.trim(),
        newImageAlt.trim() || undefined,
        product.images.length === 0
      )

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setNewImageUrl('')
        setNewImageAlt('')
        setShowAddForm(false)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    setMessage(null)
    startTransition(async () => {
      const result = await deleteProductImage(imageId)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  const handleSetPrimary = async (imageId: string) => {
    setMessage(null)
    startTransition(async () => {
      const result = await setImagePrimary(imageId)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <svg
            className="-ml-0.5 mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Image
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Image Form */}
      {showAddForm && (
        <form onSubmit={handleAddImage} className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                required
                placeholder="https://example.com/image.jpg"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="imageAlt" className="block text-sm font-medium text-gray-700">
                Alt Text <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="imageAlt"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Descriptive text for the image"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Add Image
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewImageUrl('')
                setNewImageAlt('')
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Image Grid */}
      {product.images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {product.images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              <img
                src={image.url}
                alt={image.altText || ''}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={isPending}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Set as primary"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3l14 9-14 9V3z"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={isPending}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                    title="Delete image"
                  >
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">No images uploaded yet</p>
          <p className="text-sm">Click "Add Image" to upload the first image</p>
        </div>
      )}
    </div>
  )
}
