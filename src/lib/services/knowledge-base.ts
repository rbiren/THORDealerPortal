/**
 * Knowledge Base Service
 * Phase 8.1: Communication Hub - Self-service articles and FAQs
 */

import { prisma } from '@/lib/prisma';

// Types
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CreateArticleInput {
  categoryId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  authorId?: string;
  targetRoles?: string[];
  targetTiers?: string[];
}

export interface UpdateArticleInput {
  categoryId?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  targetRoles?: string[];
  targetTiers?: string[];
  isPublished?: boolean;
}

export interface ArticleFilterOptions {
  categoryId?: string;
  isPublished?: boolean;
  search?: string;
  tags?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

/**
 * Create a knowledge base category
 */
export async function createCategory(input: CreateCategoryInput) {
  return prisma.knowledgeCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder || 0,
    },
    include: {
      parent: true,
      children: true,
      _count: { select: { articles: true } },
    },
  });
}

/**
 * Get all categories in a tree structure
 */
export async function getCategoryTree() {
  const categories = await prisma.knowledgeCategory.findMany({
    where: { isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { articles: { where: { isPublished: true } } } },
        },
      },
      _count: { select: { articles: { where: { isPublished: true } } } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Filter to only root categories for tree structure
  return categories.filter((c: { parentId: string | null }) => !c.parentId);
}

/**
 * Get a category by ID or slug
 */
export async function getCategory(idOrSlug: string) {
  return prisma.knowledgeCategory.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      articles: {
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Update a category
 */
export async function updateCategory(id: string, input: Partial<CreateCategoryInput>) {
  return prisma.knowledgeCategory.update({
    where: { id },
    data: input,
    include: {
      parent: true,
      children: true,
    },
  });
}

/**
 * Delete a category (soft delete by setting isActive = false)
 */
export async function deleteCategory(id: string) {
  // Check if category has articles
  const articleCount = await prisma.knowledgeArticle.count({
    where: { categoryId: id },
  });

  if (articleCount > 0) {
    throw new Error('Cannot delete category with existing articles');
  }

  return prisma.knowledgeCategory.update({
    where: { id },
    data: { isActive: false },
  });
}

// ============================================================================
// ARTICLE MANAGEMENT
// ============================================================================

/**
 * Create a knowledge base article
 */
export async function createArticle(input: CreateArticleInput) {
  return prisma.knowledgeArticle.create({
    data: {
      categoryId: input.categoryId,
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      authorId: input.authorId,
      targetRoles: input.targetRoles ? JSON.stringify(input.targetRoles) : null,
      targetTiers: input.targetTiers ? JSON.stringify(input.targetTiers) : null,
      isPublished: false,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Get an article by ID or slug
 */
export async function getArticle(idOrSlug: string, incrementView = false) {
  const article = await prisma.knowledgeArticle.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: true,
    },
  });

  if (article && incrementView) {
    await prisma.knowledgeArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return article;
}

/**
 * List articles with filtering and pagination
 */
export async function listArticles(
  filters: ArticleFilterOptions = {},
  pagination: PaginationOptions = {}
) {
  const {
    categoryId,
    isPublished,
    search,
    tags,
  } = filters;

  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = pagination;

  const where: Record<string, unknown> = {};

  if (categoryId) where.categoryId = categoryId;
  if (isPublished !== undefined) where.isPublished = isPublished;

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  if (tags && tags.length > 0) {
    // Search for articles containing any of the specified tags
    where.AND = tags.map((tag) => ({
      tags: { contains: tag },
    }));
  }

  const [articles, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);

  type ArticleType = typeof articles[number];
  return {
    articles: articles.map((a: ArticleType) => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : [],
      targetRoles: a.targetRoles ? JSON.parse(a.targetRoles) : [],
      targetTiers: a.targetTiers ? JSON.parse(a.targetTiers) : [],
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update an article
 */
export async function updateArticle(id: string, input: UpdateArticleInput) {
  const updateData: Record<string, unknown> = {};

  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
  if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
  if (input.targetRoles !== undefined) updateData.targetRoles = JSON.stringify(input.targetRoles);
  if (input.targetTiers !== undefined) updateData.targetTiers = JSON.stringify(input.targetTiers);

  if (input.isPublished !== undefined) {
    updateData.isPublished = input.isPublished;
    if (input.isPublished) {
      updateData.publishedAt = new Date();
    }
  }

  return prisma.knowledgeArticle.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });
}

/**
 * Publish an article
 */
export async function publishArticle(id: string) {
  return prisma.knowledgeArticle.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}

/**
 * Unpublish an article
 */
export async function unpublishArticle(id: string) {
  return prisma.knowledgeArticle.update({
    where: { id },
    data: {
      isPublished: false,
      publishedAt: null,
    },
  });
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string) {
  return prisma.knowledgeArticle.delete({
    where: { id },
  });
}

/**
 * Record feedback on an article
 */
export async function recordArticleFeedback(id: string, isHelpful: boolean) {
  return prisma.knowledgeArticle.update({
    where: { id },
    data: isHelpful
      ? { helpfulCount: { increment: 1 } }
      : { notHelpfulCount: { increment: 1 } },
  });
}

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

/**
 * Search articles across the knowledge base
 */
export async function searchArticles(
  query: string,
  options: {
    categoryId?: string;
    userRole?: string;
    dealerTier?: string;
    limit?: number;
  } = {}
) {
  const { categoryId, limit = 10 } = options;

  const where: Record<string, unknown> = {
    isPublished: true,
    OR: [
      { title: { contains: query } },
      { content: { contains: query } },
      { excerpt: { contains: query } },
      { tags: { contains: query } },
    ],
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const articles = await prisma.knowledgeArticle.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [
      { viewCount: 'desc' },
      { helpfulCount: 'desc' },
    ],
    take: limit,
  });

  // Filter by access rights if provided
  type SearchArticle = typeof articles[number];
  return articles.filter((article: SearchArticle) => {
    if (options.userRole && article.targetRoles) {
      const roles = JSON.parse(article.targetRoles);
      if (roles.length > 0 && !roles.includes(options.userRole)) {
        return false;
      }
    }
    if (options.dealerTier && article.targetTiers) {
      const tiers = JSON.parse(article.targetTiers);
      if (tiers.length > 0 && !tiers.includes(options.dealerTier)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get popular articles
 */
export async function getPopularArticles(limit = 10) {
  return prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
  });
}

/**
 * Get recently updated articles
 */
export async function getRecentArticles(limit = 10) {
  return prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}

/**
 * Get related articles based on tags
 */
export async function getRelatedArticles(articleId: string, limit = 5) {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id: articleId },
    select: { tags: true, categoryId: true },
  });

  if (!article) return [];

  const tags = article.tags ? JSON.parse(article.tags) : [];

  // Find articles in same category or with similar tags
  const relatedArticles = await prisma.knowledgeArticle.findMany({
    where: {
      id: { not: articleId },
      isPublished: true,
      OR: [
        { categoryId: article.categoryId },
        ...tags.map((tag: string) => ({ tags: { contains: tag } })),
      ],
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
  });

  return relatedArticles;
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats() {
  const [
    totalCategories,
    totalArticles,
    publishedArticles,
    draftArticles,
    totalViews,
    totalHelpful,
    totalNotHelpful,
  ] = await Promise.all([
    prisma.knowledgeCategory.count({ where: { isActive: true } }),
    prisma.knowledgeArticle.count(),
    prisma.knowledgeArticle.count({ where: { isPublished: true } }),
    prisma.knowledgeArticle.count({ where: { isPublished: false } }),
    prisma.knowledgeArticle.aggregate({ _sum: { viewCount: true } }),
    prisma.knowledgeArticle.aggregate({ _sum: { helpfulCount: true } }),
    prisma.knowledgeArticle.aggregate({ _sum: { notHelpfulCount: true } }),
  ]);

  const helpfulCount = totalHelpful._sum.helpfulCount || 0;
  const notHelpfulCount = totalNotHelpful._sum.notHelpfulCount || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;

  return {
    totalCategories,
    totalArticles,
    publishedArticles,
    draftArticles,
    totalViews: totalViews._sum.viewCount || 0,
    feedbackStats: {
      helpful: helpfulCount,
      notHelpful: notHelpfulCount,
      helpfulPercentage: totalFeedback > 0
        ? Math.round((helpfulCount / totalFeedback) * 100)
        : 0,
    },
  };
}
