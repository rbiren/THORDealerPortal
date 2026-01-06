'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Heart,
  Clock,
  Pin,
  Lock,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Reply,
  Send,
  HelpCircle,
  Megaphone,
  Lightbulb,
  AlertCircle,
  Shield,
} from 'lucide-react'
import {
  getForumPostAction,
  createForumReplyAction,
  togglePostLikeAction,
  toggleReplyLikeAction,
  moderateForumPostAction,
  moderateForumReplyAction,
  isForumAdmin,
  getForumUserInfo,
  type ForumPostDetail,
  type ForumReplyItem,
} from '../../actions'
import { type ForumPostType } from '@/lib/validations/forum'

// Icon mapping for post types
const postTypeIcons: Record<ForumPostType, React.ComponentType<{ className?: string }>> = {
  discussion: MessageSquare,
  question: HelpCircle,
  announcement: Megaphone,
  tip: Lightbulb,
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

function ReplyComponent({
  reply,
  postAuthorId,
  currentUserId,
  isAdmin,
  onLike,
  onReply,
  onAcceptAnswer,
  isQuestionPost,
}: {
  reply: ForumReplyItem
  postAuthorId: string
  currentUserId: string | null
  isAdmin: boolean
  onLike: (replyId: string) => void
  onReply: (replyId: string) => void
  onAcceptAnswer: (replyId: string) => void
  isQuestionPost: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isOwnReply = currentUserId === reply.authorId
  const isPostAuthor = currentUserId === postAuthorId
  const canAcceptAnswer = isQuestionPost && (isPostAuthor || isAdmin)

  const roleLabel = ['super_admin', 'admin'].includes(reply.authorRole)
    ? 'THOR Staff'
    : reply.dealerName || 'Dealer'

  return (
    <div
      id={`reply-${reply.id}`}
      className={`py-4 ${reply.isAcceptedAnswer ? 'bg-green-50 -mx-6 px-6 rounded-lg border border-green-200' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600 font-medium text-sm">
            {reply.authorName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{reply.authorName}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  ['super_admin', 'admin'].includes(reply.authorRole)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {roleLabel}
              </span>
              {reply.isAcceptedAnswer && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accepted Answer
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatRelativeDate(reply.createdAt)}
              </span>
              {reply.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {/* Menu */}
            {(isOwnReply || isAdmin || canAcceptAnswer) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {canAcceptAnswer && !reply.isAcceptedAnswer && (
                      <button
                        onClick={() => {
                          onAcceptAnswer(reply.id)
                          setShowMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept as Answer
                      </button>
                    )}
                    {isOwnReply && (
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Reply
                      </button>
                    )}
                    {(isOwnReply || isAdmin) && (
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Reply
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                      >
                        <Flag className="h-4 w-4" />
                        Hide Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply content */}
          <div className="mt-2 text-gray-700 whitespace-pre-wrap">
            {reply.content}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => onLike(reply.id)}
              className={`flex items-center gap-1 text-sm ${
                reply.hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${reply.hasLiked ? 'fill-current' : ''}`} />
              {reply.likeCount > 0 && reply.likeCount}
            </button>
            <button
              onClick={() => onReply(reply.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForumPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [post, setPost] = useState<ForumPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<{
    id: string
    name: string
    role: string
    dealerId: string | null
    isAdmin: boolean
  } | null>(null)

  // Reply state
  const [replyContent, setReplyContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  // Admin menu
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  const loadPost = useCallback(async () => {
    const [postData, adminStatus, userInfo] = await Promise.all([
      getForumPostAction(postId),
      isForumAdmin(),
      getForumUserInfo(),
    ])
    setPost(postData)
    setIsAdmin(adminStatus)
    setCurrentUser(userInfo)
    setIsLoading(false)
  }, [postId])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  const handleLikePost = async () => {
    if (!post) return
    const result = await togglePostLikeAction(post.id)
    if (result.success) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              hasLiked: result.liked,
              likeCount: result.liked ? prev.likeCount + 1 : prev.likeCount - 1,
            }
          : null
      )
    }
  }

  const handleLikeReply = async (replyId: string) => {
    const result = await toggleReplyLikeAction(replyId)
    if (result.success) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.map((r) =>
                r.id === replyId
                  ? {
                      ...r,
                      hasLiked: result.liked,
                      likeCount: result.liked ? r.likeCount + 1 : r.likeCount - 1,
                    }
                  : r
              ),
            }
          : null
      )
    }
  }

  const handleReplyTo = (replyId: string) => {
    setReplyingToId(replyId)
    replyInputRef.current?.focus()
  }

  const handleAcceptAnswer = async (replyId: string) => {
    const result = await moderateForumReplyAction(replyId, 'accept_answer')
    if (result.success) {
      loadPost()
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !post) return

    setIsSubmittingReply(true)
    setReplyError(null)

    const result = await createForumReplyAction(
      post.id,
      replyContent.trim(),
      replyingToId || undefined
    )

    if (result.success) {
      setReplyContent('')
      setReplyingToId(null)
      loadPost()
    } else {
      setReplyError(result.error || 'Failed to post reply')
    }

    setIsSubmittingReply(false)
  }

  const handleModeratePost = async (action: string) => {
    if (!post) return
    const result = await moderateForumPostAction(post.id, action)
    if (result.success) {
      loadPost()
    }
    setShowAdminMenu(false)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-8" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h2>
          <p className="text-gray-500 mb-6">
            This post may have been removed or you don&apos;t have permission to view it.
          </p>
          <Link
            href="/forum"
            className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90"
          >
            Back to Forum
          </Link>
        </div>
      </div>
    )
  }

  const TypeIcon = postTypeIcons[post.postType] || MessageSquare
  const roleLabel = ['super_admin', 'admin'].includes(post.authorRole)
    ? 'THOR Staff'
    : post.dealerName || 'Dealer'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/forum"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forum
        </Link>
      </div>

      {/* Post */}
      <article className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Post Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {post.isPinned && (
                  <span className="inline-flex items-center text-amber-600" title="Pinned">
                    <Pin className="h-4 w-4" />
                  </span>
                )}
                {post.isLocked && (
                  <span className="inline-flex items-center text-gray-400" title="Locked">
                    <Lock className="h-4 w-4" />
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${post.postTypeColor.bg} ${post.postTypeColor.text}`}
                >
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {post.postTypeLabel}
                </span>
                {post.postType === 'question' && post.isResolved && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </span>
                )}
                <Link
                  href={`/forum/${post.categorySlug}`}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${post.categoryColor}20` || '#f3f4f6',
                    color: post.categoryColor || '#6b7280',
                  }}
                >
                  {post.categoryName}
                </Link>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>

              <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                <span>
                  Posted by <span className="font-medium text-gray-700">{post.authorName}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    ['super_admin', 'admin'].includes(post.authorRole)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {roleLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>

            {/* Admin Menu */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Shield className="h-5 w-5 text-gray-400" />
                </button>
                {showAdminMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                      Moderation
                    </div>
                    <button
                      onClick={() => handleModeratePost(post.isPinned ? 'unpin' : 'pin')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pin className="h-4 w-4" />
                      {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                    </button>
                    <button
                      onClick={() => handleModeratePost(post.isLocked ? 'unlock' : 'lock')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      {post.isLocked ? 'Unlock Post' : 'Lock Post'}
                    </button>
                    <button
                      onClick={() =>
                        handleModeratePost(post.status === 'hidden' ? 'unhide' : 'hide')
                      }
                      className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    >
                      <Flag className="h-4 w-4" />
                      {post.status === 'hidden' ? 'Unhide Post' : 'Hide Post'}
                    </button>
                    <button
                      onClick={() => handleModeratePost('delete')}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 py-6">
          <div className="prose prose-gray max-w-none whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Stats & Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {post.replyCount} replies
            </span>
          </div>
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              post.hasLiked
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.hasLiked ? 'fill-current' : ''}`} />
            {post.likeCount > 0 ? post.likeCount : 'Like'}
          </button>
        </div>
      </article>

      {/* Replies Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {post.replyCount} {post.replyCount === 1 ? 'Reply' : 'Replies'}
        </h2>

        {/* Replies List */}
        {post.replies.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="px-6">
              {post.replies.map((reply) => (
                <ReplyComponent
                  key={reply.id}
                  reply={reply}
                  postAuthorId={post.authorId}
                  currentUserId={currentUser?.id || null}
                  isAdmin={isAdmin}
                  onLike={handleLikeReply}
                  onReply={handleReplyTo}
                  onAcceptAnswer={handleAcceptAnswer}
                  isQuestionPost={post.postType === 'question'}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reply Form */}
        {!post.isLocked ? (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">
              {replyingToId ? 'Reply to comment' : 'Add your reply'}
            </h3>

            {replyingToId && (
              <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Replying to a comment...
                </span>
                <button
                  onClick={() => setReplyingToId(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {replyError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                {replyError}
              </div>
            )}

            <form onSubmit={handleSubmitReply}>
              <textarea
                ref={replyInputRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts, answer the question, or add to the discussion..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
              <div className="mt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmittingReply}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              This post is locked. No new replies can be added.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
