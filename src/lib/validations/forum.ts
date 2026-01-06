import { z } from 'zod'

// Forum post statuses
export const forumPostStatusOptions = ['draft', 'published', 'hidden', 'locked'] as const
export type ForumPostStatus = (typeof forumPostStatusOptions)[number]

// Forum post types
export const forumPostTypeOptions = ['discussion', 'question', 'announcement', 'tip'] as const
export type ForumPostType = (typeof forumPostTypeOptions)[number]

// Forum reply statuses
export const forumReplyStatusOptions = ['published', 'hidden', 'deleted'] as const
export type ForumReplyStatus = (typeof forumReplyStatusOptions)[number]

// Target audiences for forum categories
export const forumAudienceOptions = ['all', 'techs', 'sales', 'marketing', 'admin'] as const
export type ForumAudience = (typeof forumAudienceOptions)[number]

// Filter schema for listing forum posts
export const forumPostFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  postType: z.enum(['all', ...forumPostTypeOptions]).optional().default('all'),
  status: z.enum(['all', ...forumPostStatusOptions]).optional().default('published'),
  authorId: z.string().optional(),
  dealerId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isResolved: z.boolean().optional(),
  tags: z.string().optional(), // Comma-separated tags
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastReplyAt', 'viewCount', 'replyCount', 'likeCount']).default('lastReplyAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ForumPostFilterInput = z.infer<typeof forumPostFilterSchema>

// Schema for creating a new forum post
export const createForumPostSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content cannot exceed 50,000 characters'),
  postType: z.enum(forumPostTypeOptions).default('discussion'),
  tags: z.string().optional(), // Comma-separated tags
  status: z.enum(forumPostStatusOptions).default('published'),
})

export type CreateForumPostInput = z.infer<typeof createForumPostSchema>

// Schema for updating a forum post
export const updateForumPostSchema = z.object({
  postId: z.string().min(1),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content cannot exceed 50,000 characters')
    .optional(),
  tags: z.string().optional(),
  status: z.enum(forumPostStatusOptions).optional(),
})

export type UpdateForumPostInput = z.infer<typeof updateForumPostSchema>

// Schema for creating a reply
export const createForumReplySchema = z.object({
  postId: z.string().min(1),
  parentReplyId: z.string().optional(),
  content: z.string()
    .min(1, 'Reply cannot be empty')
    .max(20000, 'Reply cannot exceed 20,000 characters'),
})

export type CreateForumReplyInput = z.infer<typeof createForumReplySchema>

// Schema for updating a reply
export const updateForumReplySchema = z.object({
  replyId: z.string().min(1),
  content: z.string()
    .min(1, 'Reply cannot be empty')
    .max(20000, 'Reply cannot exceed 20,000 characters'),
})

export type UpdateForumReplyInput = z.infer<typeof updateForumReplySchema>

// Schema for moderating a post (admin)
export const moderatePostSchema = z.object({
  postId: z.string().min(1),
  action: z.enum(['pin', 'unpin', 'lock', 'unlock', 'hide', 'unhide', 'feature', 'unfeature', 'delete']),
  reason: z.string().max(500).optional(),
})

export type ModeratePostInput = z.infer<typeof moderatePostSchema>

// Schema for moderating a reply (admin)
export const moderateReplySchema = z.object({
  replyId: z.string().min(1),
  action: z.enum(['hide', 'unhide', 'delete', 'accept_answer']),
  reason: z.string().max(500).optional(),
})

export type ModerateReplyInput = z.infer<typeof moderateReplySchema>

// Schema for creating a forum category (admin)
export const createForumCategorySchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(7).optional(), // Hex color
  targetAudience: z.enum(forumAudienceOptions).default('all'),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
})

export type CreateForumCategoryInput = z.infer<typeof createForumCategorySchema>

// Schema for updating a forum category (admin)
export const updateForumCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(7).optional(),
  targetAudience: z.enum(forumAudienceOptions).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateForumCategoryInput = z.infer<typeof updateForumCategorySchema>

// Post type labels
export const forumPostTypeLabels: Record<ForumPostType, string> = {
  discussion: 'Discussion',
  question: 'Question',
  announcement: 'Announcement',
  tip: 'Tip & Trick',
}

// Post type colors
export const forumPostTypeColors: Record<ForumPostType, { bg: string; text: string; icon: string }> = {
  discussion: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'MessageSquare' },
  question: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'HelpCircle' },
  announcement: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'Megaphone' },
  tip: { bg: 'bg-green-100', text: 'text-green-700', icon: 'Lightbulb' },
}

// Post status labels
export const forumPostStatusLabels: Record<ForumPostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  hidden: 'Hidden',
  locked: 'Locked',
}

// Post status colors
export const forumPostStatusColors: Record<ForumPostStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
  published: { bg: 'bg-green-100', text: 'text-green-700' },
  hidden: { bg: 'bg-red-100', text: 'text-red-700' },
  locked: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

// Audience labels
export const forumAudienceLabels: Record<ForumAudience, string> = {
  all: 'Everyone',
  techs: 'Technicians',
  sales: 'Sales Team',
  marketing: 'Marketing',
  admin: 'Administrators',
}

// Audience icons
export const forumAudienceIcons: Record<ForumAudience, string> = {
  all: 'Users',
  techs: 'Wrench',
  sales: 'TrendingUp',
  marketing: 'Megaphone',
  admin: 'Shield',
}

// Default forum categories for seeding
export const defaultForumCategories = [
  {
    name: 'Technical Support',
    slug: 'technical-support',
    description: 'Technical discussions, troubleshooting, and installation tips',
    icon: 'Wrench',
    color: '#3B82F6',
    targetAudience: 'techs' as ForumAudience,
    sortOrder: 1,
  },
  {
    name: 'Sales Strategies',
    slug: 'sales-strategies',
    description: 'Sales tips, success stories, and best practices',
    icon: 'TrendingUp',
    color: '#10B981',
    targetAudience: 'sales' as ForumAudience,
    sortOrder: 2,
  },
  {
    name: 'Marketing Ideas',
    slug: 'marketing-ideas',
    description: 'Marketing campaigns, promotional materials, and brand discussions',
    icon: 'Megaphone',
    color: '#8B5CF6',
    targetAudience: 'marketing' as ForumAudience,
    sortOrder: 3,
  },
  {
    name: 'Product Discussions',
    slug: 'product-discussions',
    description: 'General product questions, features, and feedback',
    icon: 'Package',
    color: '#F59E0B',
    targetAudience: 'all' as ForumAudience,
    sortOrder: 4,
  },
  {
    name: 'General',
    slug: 'general',
    description: 'Off-topic discussions and community chat',
    icon: 'MessageSquare',
    color: '#6B7280',
    targetAudience: 'all' as ForumAudience,
    sortOrder: 5,
  },
  {
    name: 'Announcements',
    slug: 'announcements',
    description: 'Official announcements from THOR Industries',
    icon: 'Bell',
    color: '#EF4444',
    targetAudience: 'all' as ForumAudience,
    sortOrder: 0,
  },
]

// Helper to generate excerpt from content
export function generateExcerpt(content: string, maxLength: number = 200): string {
  // Strip markdown/html
  const plainText = content
    .replace(/[#*_~`>\[\]()!]/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  return plainText.substring(0, maxLength).trim() + '...'
}

// Helper to parse tags string to array
export function parseTags(tagsString?: string): string[] {
  if (!tagsString) return []
  return tagsString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
}

// Helper to stringify tags array
export function stringifyTags(tags: string[]): string {
  return tags.join(', ')
}
