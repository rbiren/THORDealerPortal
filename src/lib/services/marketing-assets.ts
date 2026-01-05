/**
 * Marketing Asset Library Service
 * Phase 8.6: Digital assets, Co-branding, Campaign templates
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreateAssetCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  categoryId: string;
  assetType: 'image' | 'video' | 'document' | 'template' | 'branding';
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  brand?: string;
  campaign?: string;
  year?: number;
  availableToTiers?: string[];
  availableToRegions?: string[];
  uploadedById?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  templateType: 'email' | 'flyer' | 'social_post' | 'banner' | 'signage';
  category?: string;
  templateUrl?: string;
  previewUrl?: string;
  customizableFields?: Array<{
    field: string;
    type: string;
    label: string;
    defaultValue?: string;
  }>;
  availableToTiers?: string[];
}

export interface AssetSearchOptions {
  search?: string;
  categoryId?: string;
  assetType?: string;
  brand?: string;
  campaign?: string;
  tags?: string[];
  dealerTier?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// ASSET CATEGORIES
// ============================================================================

/**
 * Create an asset category
 */
export async function createAssetCategory(input: CreateAssetCategoryInput) {
  return prisma.marketingAssetCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder || 0,
    },
    include: { parent: true },
  });
}

/**
 * Get asset category tree
 */
export async function getAssetCategoryTree() {
  const categories = await prisma.marketingAssetCategory.findMany({
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { assets: { where: { status: 'active' } } } },
        },
      },
      _count: { select: { assets: { where: { status: 'active' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return categories.filter((c) => !c.parentId);
}

/**
 * Get category by ID or slug
 */
export async function getAssetCategory(idOrSlug: string) {
  return prisma.marketingAssetCategory.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: 'asc' } },
      assets: {
        where: { status: 'active' },
        orderBy: { downloadCount: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Update category
 */
export async function updateAssetCategory(
  id: string,
  input: Partial<CreateAssetCategoryInput>
) {
  return prisma.marketingAssetCategory.update({
    where: { id },
    data: input,
  });
}

// ============================================================================
// MARKETING ASSETS
// ============================================================================

/**
 * Create a marketing asset
 */
export async function createAsset(input: CreateAssetInput) {
  return prisma.marketingAsset.create({
    data: {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      assetType: input.assetType,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      width: input.width,
      height: input.height,
      duration: input.duration,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      brand: input.brand,
      campaign: input.campaign,
      year: input.year,
      availableToTiers: input.availableToTiers
        ? JSON.stringify(input.availableToTiers)
        : null,
      availableToRegions: input.availableToRegions
        ? JSON.stringify(input.availableToRegions)
        : null,
      uploadedById: input.uploadedById,
      status: 'active',
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

/**
 * Get an asset by ID
 */
export async function getAsset(id: string, incrementView = false) {
  const asset = await prisma.marketingAsset.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!asset) return null;

  if (incrementView) {
    await prisma.marketingAsset.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return {
    ...asset,
    tags: asset.tags ? JSON.parse(asset.tags) : [],
    availableToTiers: asset.availableToTiers
      ? JSON.parse(asset.availableToTiers)
      : [],
    availableToRegions: asset.availableToRegions
      ? JSON.parse(asset.availableToRegions)
      : [],
  };
}

/**
 * Search and list assets
 */
export async function searchAssets(options: AssetSearchOptions = {}) {
  const {
    search,
    categoryId,
    assetType,
    brand,
    campaign,
    tags,
    dealerTier,
    page = 1,
    limit = 20,
  } = options;

  const where: Prisma.MarketingAssetWhereInput = {
    status: 'active',
  };

  if (categoryId) where.categoryId = categoryId;
  if (assetType) where.assetType = assetType;
  if (brand) where.brand = brand;
  if (campaign) where.campaign = campaign;

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  if (tags && tags.length > 0) {
    where.AND = tags.map((tag) => ({
      tags: { contains: tag },
    }));
  }

  const [assets, total] = await Promise.all([
    prisma.marketingAsset.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ downloadCount: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketingAsset.count({ where }),
  ]);

  // Filter by tier access if provided
  let filteredAssets = assets;
  if (dealerTier) {
    filteredAssets = assets.filter((asset) => {
      if (!asset.availableToTiers) return true;
      const tiers = JSON.parse(asset.availableToTiers);
      return tiers.length === 0 || tiers.includes(dealerTier);
    });
  }

  return {
    assets: filteredAssets.map((a) => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : [],
      availableToTiers: a.availableToTiers ? JSON.parse(a.availableToTiers) : [],
      availableToRegions: a.availableToRegions
        ? JSON.parse(a.availableToRegions)
        : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Update an asset
 */
export async function updateAsset(
  id: string,
  input: Partial<Omit<CreateAssetInput, 'url' | 'mimeType' | 'fileSize'>>
) {
  const updateData: Prisma.MarketingAssetUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;
  if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
  if (input.brand !== undefined) updateData.brand = input.brand;
  if (input.campaign !== undefined) updateData.campaign = input.campaign;
  if (input.year !== undefined) updateData.year = input.year;
  if (input.availableToTiers !== undefined) {
    updateData.availableToTiers = JSON.stringify(input.availableToTiers);
  }
  if (input.availableToRegions !== undefined) {
    updateData.availableToRegions = JSON.stringify(input.availableToRegions);
  }

  return prisma.marketingAsset.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

/**
 * Archive an asset
 */
export async function archiveAsset(id: string) {
  return prisma.marketingAsset.update({
    where: { id },
    data: { status: 'archived' },
  });
}

/**
 * Delete an asset
 */
export async function deleteAsset(id: string) {
  // Delete associated downloads first
  await prisma.marketingAssetDownload.deleteMany({
    where: { assetId: id },
  });

  return prisma.marketingAsset.delete({ where: { id } });
}

// ============================================================================
// ASSET DOWNLOADS
// ============================================================================

/**
 * Record an asset download
 */
export async function recordAssetDownload(
  assetId: string,
  userId: string,
  dealerId: string,
  ipAddress?: string
) {
  // Create download record
  const download = await prisma.marketingAssetDownload.create({
    data: {
      assetId,
      userId,
      dealerId,
      ipAddress,
    },
  });

  // Increment download count
  await prisma.marketingAsset.update({
    where: { id: assetId },
    data: { downloadCount: { increment: 1 } },
  });

  return download;
}

/**
 * Get download history for an asset
 */
export async function getAssetDownloadHistory(
  assetId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;

  const [downloads, total] = await Promise.all([
    prisma.marketingAssetDownload.findMany({
      where: { assetId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        dealer: { select: { id: true, name: true, code: true } },
      },
      orderBy: { downloadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketingAssetDownload.count({ where: { assetId } }),
  ]);

  return {
    downloads,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get dealer's download history
 */
export async function getDealerDownloadHistory(
  dealerId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options;

  const [downloads, total] = await Promise.all([
    prisma.marketingAssetDownload.findMany({
      where: { dealerId },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetType: true,
            thumbnailUrl: true,
          },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { downloadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketingAssetDownload.count({ where: { dealerId } }),
  ]);

  return {
    downloads,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

/**
 * Create a campaign template
 */
export async function createTemplate(input: CreateTemplateInput) {
  return prisma.campaignTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      templateType: input.templateType,
      category: input.category,
      templateUrl: input.templateUrl,
      previewUrl: input.previewUrl,
      customizableFields: input.customizableFields
        ? JSON.stringify(input.customizableFields)
        : null,
      availableToTiers: input.availableToTiers
        ? JSON.stringify(input.availableToTiers)
        : null,
      status: 'active',
    },
  });
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string) {
  const template = await prisma.campaignTemplate.findUnique({
    where: { id },
  });

  if (!template) return null;

  return {
    ...template,
    customizableFields: template.customizableFields
      ? JSON.parse(template.customizableFields)
      : [],
    availableToTiers: template.availableToTiers
      ? JSON.parse(template.availableToTiers)
      : [],
  };
}

/**
 * List templates
 */
export async function listTemplates(options: {
  templateType?: string;
  category?: string;
  dealerTier?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { templateType, category, dealerTier, page = 1, limit = 20 } = options;

  const where: Prisma.CampaignTemplateWhereInput = {
    status: 'active',
  };

  if (templateType) where.templateType = templateType;
  if (category) where.category = category;

  const [templates, total] = await Promise.all([
    prisma.campaignTemplate.findMany({
      where,
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaignTemplate.count({ where }),
  ]);

  // Filter by tier access if provided
  let filteredTemplates = templates;
  if (dealerTier) {
    filteredTemplates = templates.filter((template) => {
      if (!template.availableToTiers) return true;
      const tiers = JSON.parse(template.availableToTiers);
      return tiers.length === 0 || tiers.includes(dealerTier);
    });
  }

  return {
    templates: filteredTemplates.map((t) => ({
      ...t,
      customizableFields: t.customizableFields
        ? JSON.parse(t.customizableFields)
        : [],
      availableToTiers: t.availableToTiers
        ? JSON.parse(t.availableToTiers)
        : [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Increment template use count
 */
export async function recordTemplateUse(templateId: string) {
  return prisma.campaignTemplate.update({
    where: { id: templateId },
    data: { useCount: { increment: 1 } },
  });
}

/**
 * Update template
 */
export async function updateTemplate(
  id: string,
  input: Partial<CreateTemplateInput>
) {
  const updateData: Prisma.CampaignTemplateUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.templateType !== undefined) updateData.templateType = input.templateType;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.templateUrl !== undefined) updateData.templateUrl = input.templateUrl;
  if (input.previewUrl !== undefined) updateData.previewUrl = input.previewUrl;
  if (input.customizableFields !== undefined) {
    updateData.customizableFields = JSON.stringify(input.customizableFields);
  }
  if (input.availableToTiers !== undefined) {
    updateData.availableToTiers = JSON.stringify(input.availableToTiers);
  }

  return prisma.campaignTemplate.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Archive template
 */
export async function archiveTemplate(id: string) {
  return prisma.campaignTemplate.update({
    where: { id },
    data: { status: 'archived' },
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get asset library statistics
 */
export async function getAssetLibraryStats() {
  const [
    totalAssets,
    activeAssets,
    totalCategories,
    totalDownloads,
    downloadsByType,
    topAssets,
  ] = await Promise.all([
    prisma.marketingAsset.count(),
    prisma.marketingAsset.count({ where: { status: 'active' } }),
    prisma.marketingAssetCategory.count(),
    prisma.marketingAssetDownload.count(),
    prisma.marketingAsset.groupBy({
      by: ['assetType'],
      _sum: { downloadCount: true },
      _count: { id: true },
    }),
    prisma.marketingAsset.findMany({
      where: { status: 'active' },
      orderBy: { downloadCount: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        assetType: true,
        downloadCount: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalAssets,
    activeAssets,
    totalCategories,
    totalDownloads,
    byType: Object.fromEntries(
      downloadsByType.map((d) => [
        d.assetType,
        { count: d._count.id, downloads: d._sum.downloadCount },
      ])
    ),
    topAssets,
  };
}

/**
 * Get popular assets
 */
export async function getPopularAssets(limit = 10, dealerTier?: string) {
  const assets = await prisma.marketingAsset.findMany({
    where: { status: 'active' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { downloadCount: 'desc' },
    take: limit * 2, // Get more to filter by tier
  });

  // Filter by tier access if provided
  let filteredAssets = assets;
  if (dealerTier) {
    filteredAssets = assets.filter((asset) => {
      if (!asset.availableToTiers) return true;
      const tiers = JSON.parse(asset.availableToTiers);
      return tiers.length === 0 || tiers.includes(dealerTier);
    });
  }

  return filteredAssets.slice(0, limit).map((a) => ({
    ...a,
    tags: a.tags ? JSON.parse(a.tags) : [],
  }));
}

/**
 * Get recent assets
 */
export async function getRecentAssets(limit = 10, dealerTier?: string) {
  const assets = await prisma.marketingAsset.findMany({
    where: { status: 'active' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2,
  });

  // Filter by tier access
  let filteredAssets = assets;
  if (dealerTier) {
    filteredAssets = assets.filter((asset) => {
      if (!asset.availableToTiers) return true;
      const tiers = JSON.parse(asset.availableToTiers);
      return tiers.length === 0 || tiers.includes(dealerTier);
    });
  }

  return filteredAssets.slice(0, limit).map((a) => ({
    ...a,
    tags: a.tags ? JSON.parse(a.tags) : [],
  }));
}

/**
 * Get assets by brand
 */
export async function getBrands() {
  const brands = await prisma.marketingAsset.groupBy({
    by: ['brand'],
    where: { status: 'active', brand: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return brands.map((b) => ({
    brand: b.brand,
    assetCount: b._count.id,
  }));
}

/**
 * Get assets by campaign
 */
export async function getCampaigns() {
  const campaigns = await prisma.marketingAsset.groupBy({
    by: ['campaign'],
    where: { status: 'active', campaign: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return campaigns.map((c) => ({
    campaign: c.campaign,
    assetCount: c._count.id,
  }));
}
