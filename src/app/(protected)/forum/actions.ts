'use server'

import { auth } from '@/lib/auth'
import {
  listForumCategories,
  getForumCategory,
  createForumCategory,
  updateForumCategory,
  listForumPosts,
  getForumPost,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  createForumReply,
  updateForumReply,
  deleteForumReply,
  togglePostLike,
  toggleReplyLike,
  moderatePost,
  moderateReply,
  getForumStats,
  getRecentActivity,
} from '@/lib/services/forum'
import {
  forumPostFilterSchema,
  createForumPostSchema,
  updateForumPostSchema,
  createForumReplySchema,
  updateForumReplySchema,
  createForumCategorySchema,
  updateForumCategorySchema,
  moderatePostSchema,
  moderateReplySchema,
  forumPostTypeLabels,
  forumPostTypeColors,
  forumPostStatusLabels,
  forumPostStatusColors,
  forumAudienceLabels,
  type ForumPostType,
  type ForumPostStatus,
  type ForumAudience,
} from '@/lib/validations/forum'

// Types for UI
export type ForumCategoryListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  targetAudience: ForumAudience
  audienceLabel: string
  postCount: number
  lastPostAt: string | null
  isActive: boolean
  sortOrder: number
}

export type ForumPostListItem = {
  id: string
  title: string
  excerpt: string | null
  postType: ForumPostType
  postTypeLabel: string
  postTypeColor: { bg: string; text: string; icon: string }
  status: ForumPostStatus
  statusLabel: string
  statusColor: { bg: string; text: string }
  tags: string[]
  isPinned: boolean
  isLocked: boolean
  isFeatured: boolean
  isResolved: boolean
  viewCount: number
  replyCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  lastReplyAt: string | null
  authorId: string
  authorName: string
  authorRole: string
  dealerId: string | null
  dealerName: string | null
  dealerCode: string | null
  categoryId: string
  categoryName: string
  categorySlug: string
  categoryIcon: string | null
  categoryColor: string | null
}

export type ForumPostDetail = ForumPostListItem & {
  content: string
  hasLiked: boolean
  replies: ForumReplyItem[]
}

export type ForumReplyItem = {
  id: string
  content: string
  status: string
  isAcceptedAnswer: boolean
  isEdited: boolean
  editedAt: string | null
  likeCount: number
  hasLiked: boolean
  childReplyCount: number
  createdAt: string
  authorId: string
  authorName: string
  authorRole: string
  dealerId: string | null
  dealerName: string | null
  parentReplyId: string | null
}

export type ForumStats = {
  totalPosts: number
  totalReplies: number
  totalUsers: number
  activeThisWeek: number
  unresolvedQuestions: number
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getForumCategoriesAction(): Promise<ForumCategoryListItem[]> {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const categories = await listForumCategories(session.user.role)

  type CategoryItem = {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    targetAudience: string
    postCount: number
    lastPostAt: Date | null
    isActive: boolean
    sortOrder: number
  }

  return categories.map((cat: CategoryItem) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    targetAudience: cat.targetAudience as ForumAudience,
    audienceLabel: forumAudienceLabels[cat.targetAudience as ForumAudience] || cat.targetAudience,
    postCount: cat.postCount,
    lastPostAt: cat.lastPostAt?.toISOString() || null,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
  }))
}

export async function getForumCategoryAction(slugOrId: string): Promise<ForumCategoryListItem | null> {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const category = await getForumCategory(slugOrId, session.user.role)
  if (!category) return null

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
    targetAudience: category.targetAudience as ForumAudience,
    audienceLabel: forumAudienceLabels[category.targetAudience as ForumAudience] || category.targetAudience,
    postCount: category.postCount,
    lastPostAt: category.lastPostAt?.toISOString() || null,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
  }
}

export async function createForumCategoryAction(
  formData: FormData
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const rawData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || undefined,
      icon: (formData.get('icon') as string) || undefined,
      color: (formData.get('color') as string) || undefined,
      targetAudience: (formData.get('targetAudience') as string) || 'all',
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      isActive: formData.get('isActive') === 'true',
    }

    const validated = createForumCategorySchema.parse(rawData)
    return createForumCategory(validated)
  } catch (error) {
    console.error('Create forum category error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

export async function updateForumCategoryAction(
  categoryId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const rawData = {
      categoryId,
      name: (formData.get('name') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      icon: (formData.get('icon') as string) || undefined,
      color: (formData.get('color') as string) || undefined,
      targetAudience: (formData.get('targetAudience') as string) || undefined,
      sortOrder: formData.get('sortOrder') ? parseInt(formData.get('sortOrder') as string) : undefined,
      isActive: formData.has('isActive') ? formData.get('isActive') === 'true' : undefined,
    }

    const validated = updateForumCategorySchema.parse(rawData)
    return updateForumCategory(validated)
  } catch (error) {
    console.error('Update forum category error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

// ============================================================================
// POSTS
// ============================================================================

export async function getForumPostsAction(filters?: {
  categoryId?: string
  postType?: string
  status?: string
  search?: string
  tags?: string
  isPinned?: boolean
  isResolved?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const session = await auth()
  if (!session?.user) {
    return { posts: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  const validatedFilters = forumPostFilterSchema.parse({
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    sortBy: filters?.sortBy || 'lastReplyAt',
    sortOrder: filters?.sortOrder || 'desc',
    categoryId: filters?.categoryId,
    postType: filters?.postType || 'all',
    status: filters?.status || 'published',
    search: filters?.search,
    tags: filters?.tags,
    isPinned: filters?.isPinned,
    isResolved: filters?.isResolved,
  })

  const result = await listForumPosts(
    validatedFilters,
    session.user.id,
    session.user.role,
    session.user.dealerId || null
  )

  // Parse tags JSON
  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  type PostQueryResult = {
    id: string
    title: string
    excerpt: string | null
    postType: string
    status: string
    tags: string | null
    isPinned: boolean
    isLocked: boolean
    isFeatured: boolean
    isResolved: boolean
    viewCount: number
    replyCount: number
    likeCount: number
    createdAt: Date
    updatedAt: Date
    lastReplyAt: Date | null
    authorId: string
    author: { firstName: string | null; lastName: string | null; role: string }
    dealerId: string | null
    dealer: { name: string; code: string } | null
    categoryId: string
    category: { name: string; slug: string; icon: string | null; color: string | null }
  }

  // Transform for UI
  const posts: ForumPostListItem[] = result.posts.map((post: PostQueryResult) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    postType: post.postType as ForumPostType,
    postTypeLabel: forumPostTypeLabels[post.postType as ForumPostType] || post.postType,
    postTypeColor: forumPostTypeColors[post.postType as ForumPostType] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: 'MessageSquare',
    },
    status: post.status as ForumPostStatus,
    statusLabel: forumPostStatusLabels[post.status as ForumPostStatus] || post.status,
    statusColor: forumPostStatusColors[post.status as ForumPostStatus] || {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    tags: parseTags(post.tags),
    isPinned: post.isPinned,
    isLocked: post.isLocked,
    isFeatured: post.isFeatured,
    isResolved: post.isResolved,
    viewCount: post.viewCount,
    replyCount: post.replyCount,
    likeCount: post.likeCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString() || null,
    authorId: post.authorId,
    authorName: `${post.author.firstName} ${post.author.lastName}`,
    authorRole: post.author.role,
    dealerId: post.dealerId,
    dealerName: post.dealer?.name || null,
    dealerCode: post.dealer?.code || null,
    categoryId: post.categoryId,
    categoryName: post.category.name,
    categorySlug: post.category.slug,
    categoryIcon: post.category.icon,
    categoryColor: post.category.color,
  }))

  return {
    posts,
    pagination: result.pagination,
  }
}

export async function getForumPostAction(postId: string): Promise<ForumPostDetail | null> {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const post = await getForumPost(postId, session.user.id, session.user.role)
  if (!post) return null

  // Parse tags JSON
  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    postType: post.postType as ForumPostType,
    postTypeLabel: forumPostTypeLabels[post.postType as ForumPostType] || post.postType,
    postTypeColor: forumPostTypeColors[post.postType as ForumPostType] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: 'MessageSquare',
    },
    status: post.status as ForumPostStatus,
    statusLabel: forumPostStatusLabels[post.status as ForumPostStatus] || post.status,
    statusColor: forumPostStatusColors[post.status as ForumPostStatus] || {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    tags: parseTags(post.tags),
    isPinned: post.isPinned,
    isLocked: post.isLocked,
    isFeatured: post.isFeatured,
    isResolved: post.isResolved,
    viewCount: post.viewCount,
    replyCount: post.replyCount,
    likeCount: post.likeCount,
    hasLiked: post.hasLiked,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString() || null,
    authorId: post.authorId,
    authorName: `${post.author.firstName} ${post.author.lastName}`,
    authorRole: post.author.role,
    dealerId: post.dealerId,
    dealerName: post.dealer?.name || null,
    dealerCode: post.dealer?.code || null,
    categoryId: post.categoryId,
    categoryName: post.category.name,
    categorySlug: post.category.slug,
    categoryIcon: post.category.icon,
    categoryColor: post.category.color,
    replies: post.replies.map((reply: {
      id: string
      content: string
      status: string
      isAcceptedAnswer: boolean
      isEdited: boolean
      editedAt: Date | null
      likeCount: number
      hasLiked: boolean
      childReplyCount: number
      createdAt: Date
      authorId: string
      author: { firstName: string | null; lastName: string | null; role: string; dealer: { name: string } | null }
      dealerId: string | null
      parentReplyId: string | null
    }) => ({
      id: reply.id,
      content: reply.content,
      status: reply.status,
      isAcceptedAnswer: reply.isAcceptedAnswer,
      isEdited: reply.isEdited,
      editedAt: reply.editedAt?.toISOString() || null,
      likeCount: reply.likeCount,
      hasLiked: reply.hasLiked,
      childReplyCount: reply.childReplyCount,
      createdAt: reply.createdAt.toISOString(),
      authorId: reply.authorId,
      authorName: `${reply.author.firstName} ${reply.author.lastName}`,
      authorRole: reply.author.role,
      dealerId: reply.dealerId,
      dealerName: reply.author.dealer?.name || null,
      parentReplyId: reply.parentReplyId,
    })),
  }
}

export async function createForumPostAction(
  formData: FormData
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const rawData = {
      categoryId: formData.get('categoryId') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      postType: (formData.get('postType') as string) || 'discussion',
      tags: (formData.get('tags') as string) || undefined,
      status: (formData.get('status') as string) || 'published',
    }

    const validated = createForumPostSchema.parse(rawData)
    return createForumPost(validated, session.user.id, session.user.dealerId || null)
  } catch (error) {
    console.error('Create forum post error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    }
  }
}

export async function updateForumPostAction(
  postId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const rawData = {
      postId,
      title: (formData.get('title') as string) || undefined,
      content: (formData.get('content') as string) || undefined,
      tags: (formData.get('tags') as string) || undefined,
      status: (formData.get('status') as string) || undefined,
    }

    const validated = updateForumPostSchema.parse(rawData)
    return updateForumPost(validated, session.user.id, session.user.role)
  } catch (error) {
    console.error('Update forum post error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
    }
  }
}

export async function deleteForumPostAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  return deleteForumPost(postId, session.user.id, session.user.role)
}

// ============================================================================
// REPLIES
// ============================================================================

export async function createForumReplyAction(
  postId: string,
  content: string,
  parentReplyId?: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const validated = createForumReplySchema.parse({
      postId,
      content,
      parentReplyId,
    })

    return createForumReply(validated, session.user.id, session.user.dealerId || null)
  } catch (error) {
    console.error('Create forum reply error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reply',
    }
  }
}

export async function updateForumReplyAction(
  replyId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const validated = updateForumReplySchema.parse({
      replyId,
      content,
    })

    return updateForumReply(validated, session.user.id, session.user.role)
  } catch (error) {
    console.error('Update forum reply error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reply',
    }
  }
}

export async function deleteForumReplyAction(
  replyId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  return deleteForumReply(replyId, session.user.id, session.user.role)
}

// ============================================================================
// LIKES
// ============================================================================

export async function togglePostLikeAction(
  postId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, liked: false, error: 'Not authenticated' }
  }

  return togglePostLike(postId, session.user.id)
}

export async function toggleReplyLikeAction(
  replyId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, liked: false, error: 'Not authenticated' }
  }

  return toggleReplyLike(replyId, session.user.id)
}

// ============================================================================
// MODERATION (Admin only)
// ============================================================================

export async function moderateForumPostAction(
  postId: string,
  action: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const validated = moderatePostSchema.parse({
      postId,
      action,
      reason,
    })

    return moderatePost(validated, session.user.id)
  } catch (error) {
    console.error('Moderate forum post error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate post',
    }
  }
}

export async function moderateForumReplyAction(
  replyId: string,
  action: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!['super_admin', 'admin'].includes(session.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const validated = moderateReplySchema.parse({
      replyId,
      action,
      reason,
    })

    return moderateReply(validated, session.user.id)
  } catch (error) {
    console.error('Moderate forum reply error:', error)
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: { message: string }[] }
      return { success: false, error: zodError.issues[0]?.message || 'Validation error' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate reply',
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getForumStatsAction(): Promise<ForumStats> {
  const session = await auth()
  if (!session?.user) {
    return {
      totalPosts: 0,
      totalReplies: 0,
      totalUsers: 0,
      activeThisWeek: 0,
      unresolvedQuestions: 0,
    }
  }

  return getForumStats(session.user.role)
}

export async function getRecentForumActivityAction(limit: number = 10) {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const posts = await getRecentActivity(session.user.role, limit)

  // Parse tags JSON
  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  type UserPostQueryResult = {
    id: string
    title: string
    excerpt: string | null
    postType: string
    tags: string | null
    isPinned: boolean
    replyCount: number
    viewCount: number
    createdAt: Date
    lastReplyAt: Date | null
    author: { firstName: string | null; lastName: string | null }
    category: { name: string; slug: string; icon: string | null; color: string | null }
  }

  return posts.map((post: UserPostQueryResult) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    postType: post.postType as ForumPostType,
    postTypeLabel: forumPostTypeLabels[post.postType as ForumPostType] || post.postType,
    tags: parseTags(post.tags),
    isPinned: post.isPinned,
    replyCount: post.replyCount,
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString() || null,
    authorName: `${post.author.firstName} ${post.author.lastName}`,
    categoryName: post.category.name,
    categorySlug: post.category.slug,
    categoryIcon: post.category.icon,
    categoryColor: post.category.color,
  }))
}

// Check if user is admin
export async function isForumAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return ['super_admin', 'admin'].includes(session.user.role)
}

// Get current user info for forum
export async function getForumUserInfo(): Promise<{
  id: string
  name: string
  role: string
  dealerId: string | null
  isAdmin: boolean
} | null> {
  const session = await auth()
  if (!session?.user) return null

  return {
    id: session.user.id,
    name: session.user.name || 'Unknown User',
    role: session.user.role,
    dealerId: session.user.dealerId || null,
    isAdmin: ['super_admin', 'admin'].includes(session.user.role),
  }
}
