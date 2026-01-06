'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  MessageSquare,
  Eye,
  Heart,
  Clock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
  Pin,
  Lock,
  CheckCircle,
  HelpCircle,
  Megaphone,
  Lightbulb,
  Users,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import {
  getForumCategoriesAction,
  getForumPostsAction,
  getForumStatsAction,
  type ForumCategoryListItem,
  type ForumPostListItem,
  type ForumStats,
} from './actions'
import {
  forumPostTypeOptions,
  forumPostTypeLabels,
} from '@/lib/validations/forum'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  HelpCircle,
  Megaphone,
  Lightbulb,
  Wrench,
  TrendingUp,
  Users,
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: ForumCategoryListItem }) {
  const IconComponent = iconMap[category.icon || 'MessageSquare'] || MessageSquare

  return (
    <Link
      href={`/forum/${category.slug}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${category.color}20` || '#f3f4f6' }}
        >
          <span style={{ color: category.color || '#6b7280' }}>
            <IconComponent className="h-5 w-5" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
              {category.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>
    </Link>
  )
}

function PostRow({ post }: { post: ForumPostListItem }) {
  const TypeIcon = iconMap[post.postTypeColor.icon] || MessageSquare

  return (
    <Link
      href={`/forum/post/${post.id}`}
      className="block bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {/* Type indicator */}
          <div
            className={`p-2 rounded-lg ${post.postTypeColor.bg}`}
          >
            <TypeIcon className={`h-5 w-5 ${post.postTypeColor.text}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {post.isPinned && (
                <span className="inline-flex items-center text-amber-600">
                  <Pin className="h-3.5 w-3.5" />
                </span>
              )}
              {post.isLocked && (
                <span className="inline-flex items-center text-gray-400">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              )}
              {post.postType === 'question' && post.isResolved && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${post.postTypeColor.bg} ${post.postTypeColor.text}`}
              >
                {post.postTypeLabel}
              </span>
              <span className="text-xs text-gray-400">
                in{' '}
                <span
                  className="font-medium hover:underline"
                  style={{ color: post.categoryColor || '#6b7280' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/forum/${post.categorySlug}`}>{post.categoryName}</Link>
                </span>
              </span>
            </div>

            <h3 className="text-base font-medium text-gray-900 line-clamp-1">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {post.excerpt}
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 4 && (
                  <span className="text-xs text-gray-400">
                    +{post.tags.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>
                by <span className="font-medium">{post.authorName}</span>
                {post.dealerName && (
                  <span className="text-gray-400"> ({post.dealerCode})</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(post.lastReplyAt || post.createdAt)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.replyCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.likeCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ForumPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<ForumCategoryListItem[]>([])
  const [posts, setPosts] = useState<ForumPostListItem[]>([])
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showCategories, setShowCategories] = useState(true)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [postType, setPostType] = useState(searchParams.get('type') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const hasActiveFilters = postType !== 'all' || search

  const loadData = useCallback(async () => {
    setIsLoading(true)

    const [categoriesResult, postsResult, statsResult] = await Promise.all([
      getForumCategoriesAction(),
      getForumPostsAction({
        search: search || undefined,
        postType: postType !== 'all' ? postType : undefined,
        page,
        pageSize: 20,
      }),
      getForumStatsAction(),
    ])

    setCategories(categoriesResult)
    setPosts(postsResult.posts)
    setPagination(postsResult.pagination)
    setStats(statsResult)
    setIsLoading(false)
  }, [search, postType, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (postType !== 'all') params.set('type', postType)
    if (page > 1) params.set('page', page.toString())

    const queryString = params.toString()
    router.replace(`/forum${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [search, postType, page, router])

  const clearFilters = () => {
    setSearch('')
    setPostType('all')
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
          <p className="text-gray-600 mt-1">
            Connect with fellow dealers, share knowledge, and get answers
          </p>
        </div>
        <Link
          href="/forum/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Posts"
            value={stats.totalPosts}
            icon={MessageSquare}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Replies"
            value={stats.totalReplies}
            icon={MessageSquare}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            label="Contributors"
            value={stats.totalUsers}
            icon={Users}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            label="Active This Week"
            value={stats.activeThisWeek}
            icon={TrendingUp}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Unanswered Questions"
            value={stats.unresolvedQuestions}
            icon={HelpCircle}
            color="bg-red-100 text-red-600"
          />
        </div>
      )}

      {/* Categories Section */}
      {showCategories && categories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => setShowCategories(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-primary text-primary bg-primary/5'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                {[postType !== 'all', !!search].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(`/forum/${e.target.value}`)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Post Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => {
                    setPostType(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Types</option>
                  {forumPostTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {forumPostTypeLabels[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-700">Recent Discussions</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-gray-500">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to start a discussion!'}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/forum/new"
                className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Link>
            )}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} posts
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
