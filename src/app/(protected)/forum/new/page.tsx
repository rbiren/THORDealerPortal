'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import {
  getForumCategoriesAction,
  createForumPostAction,
  type ForumCategoryListItem,
} from '../actions'
import {
  forumPostTypeOptions,
  forumPostTypeLabels,
  type ForumPostType,
} from '@/lib/validations/forum'

// Icon mapping for post types
const postTypeIcons: Record<ForumPostType, React.ComponentType<{ className?: string }>> = {
  discussion: MessageSquare,
  question: HelpCircle,
  announcement: Megaphone,
  tip: Lightbulb,
}

const postTypeDescriptions: Record<ForumPostType, string> = {
  discussion: 'Start a conversation or share your thoughts',
  question: 'Ask for help or advice from the community',
  announcement: 'Share important news or updates',
  tip: 'Share a helpful tip or best practice',
}

export default function NewForumPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCategorySlug = searchParams.get('category')

  const [categories, setCategories] = useState<ForumCategoryListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [categoryId, setCategoryId] = useState('')
  const [postType, setPostType] = useState<ForumPostType>('discussion')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    async function loadCategories() {
      const result = await getForumCategoriesAction()
      setCategories(result)

      // Pre-select category if provided via URL
      if (preselectedCategorySlug) {
        const matchingCategory = result.find(c => c.slug === preselectedCategorySlug)
        if (matchingCategory) {
          setCategoryId(matchingCategory.id)
        }
      }

      setIsLoading(false)
    }
    loadCategories()
  }, [preselectedCategorySlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('categoryId', categoryId)
    formData.set('postType', postType)
    formData.set('title', title)
    formData.set('content', content)
    formData.set('tags', tags)
    formData.set('status', 'published')

    const result = await createForumPostAction(formData)

    if (result.success && result.postId) {
      router.push(`/forum/post/${result.postId}`)
    } else {
      setError(result.error || 'Failed to create post')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/forum"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forum
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-1">
          Share your question, idea, or discussion with the community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error creating post</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Post Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What kind of post is this?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {forumPostTypeOptions.map((type) => {
              const Icon = postTypeIcons[type]
              const isSelected = postType === type

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? 'text-primary' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          isSelected ? 'text-primary' : 'text-gray-900'
                        }`}
                      >
                        {forumPostTypeLabels[type]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {postTypeDescriptions[type]}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder={
              postType === 'question'
                ? 'What would you like to ask?'
                : 'Give your post a descriptive title'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/200 characters
          </p>
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={10}
            rows={10}
            placeholder={
              postType === 'question'
                ? 'Provide details about your question. What have you tried? What result did you expect?'
                : 'Write your post content here. Be clear and provide enough context for others to understand.'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports basic formatting. Minimum 10 characters.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., installation, warranty, troubleshooting"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas. Tags help others find your post.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Link
            href="/forum"
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !categoryId || !title || !content}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
