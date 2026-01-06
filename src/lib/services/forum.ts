'use server'

import { prisma } from '@/lib/prisma'
import {
  type CreateForumPostInput,
  type UpdateForumPostInput,
  type CreateForumReplyInput,
  type UpdateForumReplyInput,
  type ForumPostFilterInput,
  type CreateForumCategoryInput,
  type UpdateForumCategoryInput,
  type ModeratePostInput,
  type ModerateReplyInput,
  type ForumAudience,
  generateExcerpt,
  parseTags,
} from '@/lib/validations/forum'

// Check if user can access a forum category based on audience
function canAccessCategory(targetAudience: string, userRole: string): boolean {
  if (targetAudience === 'all') return true
  if (['super_admin', 'admin'].includes(userRole)) return true

  // Map user roles to audience categories
  const roleAudienceMap: Record<string, string[]> = {
    dealer_admin: ['all', 'sales', 'techs', 'marketing'],
    dealer_user: ['all', 'sales', 'techs', 'marketing'],
    readonly: ['all'],
  }

  return roleAudienceMap[userRole]?.includes(targetAudience) ?? false
}

// Get accessible category IDs for a user
async function getAccessibleCategoryIds(userRole: string): Promise<string[]> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  if (isAdmin) {
    const categories = await prisma.forumCategory.findMany({
      where: { isActive: true },
      select: { id: true },
    })
    return categories.map(c => c.id)
  }

  // For non-admins, filter by audience
  const categories = await prisma.forumCategory.findMany({
    where: {
      isActive: true,
      targetAudience: {
        in: ['all', 'techs', 'sales', 'marketing'],
      },
    },
    select: { id: true },
  })
  return categories.map(c => c.id)
}

// ============================================================================
// FORUM CATEGORIES
// ============================================================================

export async function listForumCategories(userRole: string) {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  const where: Record<string, unknown> = {}

  if (!isAdmin) {
    where.isActive = true
    where.targetAudience = {
      in: ['all', 'techs', 'sales', 'marketing'],
    }
  }

  const categories = await prisma.forumCategory.findMany({
    where,
    include: {
      _count: {
        select: {
          posts: {
            where: { status: 'published' },
          },
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return categories.map(cat => ({
    ...cat,
    postCount: cat._count.posts,
  }))
}

export async function getForumCategory(
  slugOrId: string,
  userRole: string
) {
  const category = await prisma.forumCategory.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
    },
    include: {
      _count: {
        select: {
          posts: {
            where: { status: 'published' },
          },
        },
      },
    },
  })

  if (!category) return null

  // Check access
  if (!canAccessCategory(category.targetAudience, userRole)) {
    return null
  }

  return {
    ...category,
    postCount: category._count.posts,
  }
}

export async function createForumCategory(
  data: CreateForumCategoryInput
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  try {
    // Check for duplicate slug
    const existing = await prisma.forumCategory.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      return { success: false, error: 'A category with this slug already exists' }
    }

    const category = await prisma.forumCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        targetAudience: data.targetAudience,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    })

    return { success: true, categoryId: category.id }
  } catch (error) {
    console.error('Create forum category error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

export async function updateForumCategory(
  data: UpdateForumCategoryInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const category = await prisma.forumCategory.findUnique({
      where: { id: data.categoryId },
    })

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    await prisma.forumCategory.update({
      where: { id: data.categoryId },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        targetAudience: data.targetAudience,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Update forum category error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

// ============================================================================
// FORUM POSTS
// ============================================================================

export async function listForumPosts(
  filters: ForumPostFilterInput,
  userId: string,
  userRole: string,
  dealerId: string | null
) {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)
  const accessibleCategoryIds = await getAccessibleCategoryIds(userRole)

  const where: Record<string, unknown> = {
    categoryId: { in: accessibleCategoryIds },
  }

  // Status filter - non-admins only see published posts
  if (!isAdmin) {
    where.status = 'published'
  } else if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  // Category filter
  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  // Post type filter
  if (filters.postType && filters.postType !== 'all') {
    where.postType = filters.postType
  }

  // Author filter
  if (filters.authorId) {
    where.authorId = filters.authorId
  }

  // Dealer filter
  if (filters.dealerId) {
    where.dealerId = filters.dealerId
  }

  // Pinned filter
  if (filters.isPinned !== undefined) {
    where.isPinned = filters.isPinned
  }

  // Resolved filter (for questions)
  if (filters.isResolved !== undefined) {
    where.isResolved = filters.isResolved
    where.postType = 'question'
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { content: { contains: filters.search } },
      { tags: { contains: filters.search } },
    ]
  }

  // Tags filter
  if (filters.tags) {
    const tagList = parseTags(filters.tags)
    if (tagList.length > 0) {
      where.AND = tagList.map(tag => ({
        tags: { contains: tag },
      }))
    }
  }

  // Count total
  const total = await prisma.forumPost.count({ where })

  // Build order by - pinned posts first, then by selected sort
  const orderBy: Record<string, string>[] = [
    { isPinned: 'desc' },
    { [filters.sortBy]: filters.sortOrder },
  ]

  // Get paginated results
  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
      },
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          replies: {
            where: { status: 'published' },
          },
          likes: true,
        },
      },
    },
    orderBy,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  })

  return {
    posts: posts.map(post => ({
      ...post,
      replyCount: post._count.replies,
      likeCount: post._count.likes,
    })),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  }
}

export async function getForumPost(
  postId: string,
  userId: string,
  userRole: string,
  incrementView: boolean = true
) {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  const post = await prisma.forumPost.findFirst({
    where: { id: postId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          targetAudience: true,
        },
      },
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          dealer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      replies: {
        where: isAdmin ? {} : { status: 'published' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              dealer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              childReplies: {
                where: { status: 'published' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  })

  if (!post) return null

  // Check category access
  if (!canAccessCategory(post.category.targetAudience, userRole)) {
    return null
  }

  // Check post visibility
  if (!isAdmin && post.status !== 'published') {
    // Allow author to see their own drafts
    if (post.authorId !== userId) {
      return null
    }
  }

  // Increment view count
  if (incrementView) {
    await prisma.forumPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    })
  }

  // Check if current user has liked this post
  const userLike = await prisma.forumPostLike.findUnique({
    where: {
      postId_userId: {
        postId: post.id,
        userId,
      },
    },
  })

  // Get user likes for replies
  const replyLikes = await prisma.forumReplyLike.findMany({
    where: {
      replyId: { in: post.replies.map(r => r.id) },
      userId,
    },
    select: { replyId: true },
  })
  const likedReplyIds = new Set(replyLikes.map(l => l.replyId))

  return {
    ...post,
    likeCount: post._count.likes,
    hasLiked: !!userLike,
    replies: post.replies.map(reply => ({
      ...reply,
      likeCount: reply._count.likes,
      childReplyCount: reply._count.childReplies,
      hasLiked: likedReplyIds.has(reply.id),
    })),
  }
}

export async function createForumPost(
  data: CreateForumPostInput,
  userId: string,
  dealerId: string | null
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Verify category exists and is accessible
    const category = await prisma.forumCategory.findUnique({
      where: { id: data.categoryId },
    })

    if (!category || !category.isActive) {
      return { success: false, error: 'Invalid category' }
    }

    const tags = data.tags ? JSON.stringify(parseTags(data.tags)) : null
    const excerpt = generateExcerpt(data.content)

    const post = await prisma.forumPost.create({
      data: {
        categoryId: data.categoryId,
        authorId: userId,
        dealerId,
        title: data.title,
        content: data.content,
        excerpt,
        postType: data.postType,
        tags,
        status: data.status,
      },
    })

    // Update category post count and last post time
    if (data.status === 'published') {
      await prisma.forumCategory.update({
        where: { id: data.categoryId },
        data: {
          postCount: { increment: 1 },
          lastPostAt: new Date(),
        },
      })
    }

    return { success: true, postId: post.id }
  } catch (error) {
    console.error('Create forum post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    }
  }
}

export async function updateForumPost(
  data: UpdateForumPostInput,
  userId: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: data.postId },
    })

    if (!post) {
      return { success: false, error: 'Post not found' }
    }

    // Only author or admin can update
    if (!isAdmin && post.authorId !== userId) {
      return { success: false, error: 'Not authorized to edit this post' }
    }

    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }

    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.excerpt = generateExcerpt(data.content)
    }

    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(parseTags(data.tags))
    }

    if (data.status !== undefined && isAdmin) {
      updateData.status = data.status
    }

    await prisma.forumPost.update({
      where: { id: data.postId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('Update forum post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
    }
  }
}

export async function deleteForumPost(
  postId: string,
  userId: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return { success: false, error: 'Post not found' }
    }

    // Only author (for drafts) or admin can delete
    if (!isAdmin && (post.authorId !== userId || post.status !== 'draft')) {
      return { success: false, error: 'Not authorized to delete this post' }
    }

    await prisma.forumPost.delete({
      where: { id: postId },
    })

    // Update category post count
    if (post.status === 'published') {
      await prisma.forumCategory.update({
        where: { id: post.categoryId },
        data: {
          postCount: { decrement: 1 },
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Delete forum post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post',
    }
  }
}

// ============================================================================
// FORUM REPLIES
// ============================================================================

export async function createForumReply(
  data: CreateForumReplyInput,
  userId: string,
  dealerId: string | null
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: data.postId },
    })

    if (!post) {
      return { success: false, error: 'Post not found' }
    }

    if (post.isLocked) {
      return { success: false, error: 'This post is locked and cannot receive replies' }
    }

    // If this is a nested reply, verify parent exists
    if (data.parentReplyId) {
      const parentReply = await prisma.forumReply.findUnique({
        where: { id: data.parentReplyId },
      })

      if (!parentReply || parentReply.postId !== data.postId) {
        return { success: false, error: 'Invalid parent reply' }
      }
    }

    const reply = await prisma.forumReply.create({
      data: {
        postId: data.postId,
        authorId: userId,
        dealerId,
        parentReplyId: data.parentReplyId || null,
        content: data.content,
        status: 'published',
      },
    })

    // Update post reply count and last reply info
    await prisma.forumPost.update({
      where: { id: data.postId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyById: userId,
      },
    })

    return { success: true, replyId: reply.id }
  } catch (error) {
    console.error('Create forum reply error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reply',
    }
  }
}

export async function updateForumReply(
  data: UpdateForumReplyInput,
  userId: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: data.replyId },
    })

    if (!reply) {
      return { success: false, error: 'Reply not found' }
    }

    if (!isAdmin && reply.authorId !== userId) {
      return { success: false, error: 'Not authorized to edit this reply' }
    }

    await prisma.forumReply.update({
      where: { id: data.replyId },
      data: {
        content: data.content,
        isEdited: true,
        editedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Update forum reply error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reply',
    }
  }
}

export async function deleteForumReply(
  replyId: string,
  userId: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      include: { post: true },
    })

    if (!reply) {
      return { success: false, error: 'Reply not found' }
    }

    if (!isAdmin && reply.authorId !== userId) {
      return { success: false, error: 'Not authorized to delete this reply' }
    }

    await prisma.forumReply.delete({
      where: { id: replyId },
    })

    // Update post reply count
    await prisma.forumPost.update({
      where: { id: reply.postId },
      data: {
        replyCount: { decrement: 1 },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Delete forum reply error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reply',
    }
  }
}

// ============================================================================
// LIKES
// ============================================================================

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    const existingLike = await prisma.forumPostLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.forumPostLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return { success: true, liked: false }
    } else {
      // Like
      await prisma.$transaction([
        prisma.forumPostLike.create({
          data: { postId, userId },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ])
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('Toggle post like error:', error)
    return {
      success: false,
      liked: false,
      error: error instanceof Error ? error.message : 'Failed to toggle like',
    }
  }
}

export async function toggleReplyLike(
  replyId: string,
  userId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    const existingLike = await prisma.forumReplyLike.findUnique({
      where: {
        replyId_userId: { replyId, userId },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.forumReplyLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.forumReply.update({
          where: { id: replyId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return { success: true, liked: false }
    } else {
      // Like
      await prisma.$transaction([
        prisma.forumReplyLike.create({
          data: { replyId, userId },
        }),
        prisma.forumReply.update({
          where: { id: replyId },
          data: { likeCount: { increment: 1 } },
        }),
      ])
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('Toggle reply like error:', error)
    return {
      success: false,
      liked: false,
      error: error instanceof Error ? error.message : 'Failed to toggle like',
    }
  }
}

// ============================================================================
// MODERATION (Admin only)
// ============================================================================

export async function moderatePost(
  data: ModeratePostInput,
  moderatorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: data.postId },
    })

    if (!post) {
      return { success: false, error: 'Post not found' }
    }

    const updateData: Record<string, unknown> = {
      moderatedById: moderatorId,
      moderatedAt: new Date(),
      moderationReason: data.reason || null,
    }

    switch (data.action) {
      case 'pin':
        updateData.isPinned = true
        break
      case 'unpin':
        updateData.isPinned = false
        break
      case 'lock':
        updateData.isLocked = true
        break
      case 'unlock':
        updateData.isLocked = false
        break
      case 'hide':
        updateData.status = 'hidden'
        break
      case 'unhide':
        updateData.status = 'published'
        break
      case 'feature':
        updateData.isFeatured = true
        break
      case 'unfeature':
        updateData.isFeatured = false
        break
      case 'delete':
        await prisma.forumPost.delete({ where: { id: data.postId } })
        return { success: true }
    }

    await prisma.forumPost.update({
      where: { id: data.postId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('Moderate post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate post',
    }
  }
}

export async function moderateReply(
  data: ModerateReplyInput,
  moderatorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: data.replyId },
      include: { post: true },
    })

    if (!reply) {
      return { success: false, error: 'Reply not found' }
    }

    const updateData: Record<string, unknown> = {
      moderatedById: moderatorId,
      moderatedAt: new Date(),
      moderationReason: data.reason || null,
    }

    switch (data.action) {
      case 'hide':
        updateData.status = 'hidden'
        break
      case 'unhide':
        updateData.status = 'published'
        break
      case 'delete':
        await prisma.forumReply.delete({ where: { id: data.replyId } })
        await prisma.forumPost.update({
          where: { id: reply.postId },
          data: { replyCount: { decrement: 1 } },
        })
        return { success: true }
      case 'accept_answer':
        if (reply.post.postType !== 'question') {
          return { success: false, error: 'Can only accept answers on question posts' }
        }
        // Unmark any existing accepted answer
        await prisma.forumReply.updateMany({
          where: { postId: reply.postId, isAcceptedAnswer: true },
          data: { isAcceptedAnswer: false },
        })
        updateData.isAcceptedAnswer = true
        // Mark post as resolved
        await prisma.forumPost.update({
          where: { id: reply.postId },
          data: {
            isResolved: true,
            acceptedReplyId: data.replyId,
          },
        })
        break
    }

    await prisma.forumReply.update({
      where: { id: data.replyId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('Moderate reply error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate reply',
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getForumStats(userRole: string): Promise<{
  totalPosts: number
  totalReplies: number
  totalUsers: number
  activeThisWeek: number
  unresolvedQuestions: number
}> {
  const accessibleCategoryIds = await getAccessibleCategoryIds(userRole)

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [totalPosts, totalReplies, activeThisWeek, unresolvedQuestions] = await Promise.all([
    prisma.forumPost.count({
      where: {
        categoryId: { in: accessibleCategoryIds },
        status: 'published',
      },
    }),
    prisma.forumReply.count({
      where: {
        post: {
          categoryId: { in: accessibleCategoryIds },
        },
        status: 'published',
      },
    }),
    prisma.forumPost.count({
      where: {
        categoryId: { in: accessibleCategoryIds },
        status: 'published',
        OR: [
          { createdAt: { gte: oneWeekAgo } },
          { lastReplyAt: { gte: oneWeekAgo } },
        ],
      },
    }),
    prisma.forumPost.count({
      where: {
        categoryId: { in: accessibleCategoryIds },
        status: 'published',
        postType: 'question',
        isResolved: false,
      },
    }),
  ])

  // Count unique users who have posted or replied
  const uniqueAuthors = await prisma.forumPost.findMany({
    where: {
      categoryId: { in: accessibleCategoryIds },
      status: 'published',
    },
    select: { authorId: true },
    distinct: ['authorId'],
  })

  return {
    totalPosts,
    totalReplies,
    totalUsers: uniqueAuthors.length,
    activeThisWeek,
    unresolvedQuestions,
  }
}

export async function getRecentActivity(
  userRole: string,
  limit: number = 10
) {
  const accessibleCategoryIds = await getAccessibleCategoryIds(userRole)

  const recentPosts = await prisma.forumPost.findMany({
    where: {
      categoryId: { in: accessibleCategoryIds },
      status: 'published',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
      },
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: [
      { lastReplyAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    take: limit,
  })

  return recentPosts.map(post => ({
    ...post,
    replyCount: post._count.replies,
  }))
}
