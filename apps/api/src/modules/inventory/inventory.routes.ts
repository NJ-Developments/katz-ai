// ===========================================
// Inventory Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { requireAuth, requireManager } from '../../lib/auth';
import { SearchConstraints } from '@katzai/shared';

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  noDamage: z.coerce.boolean().optional(),
  noTools: z.coerce.boolean().optional(),
  noDrilling: z.coerce.boolean().optional(),
  maxWeight: z.coerce.number().optional(),
  minWeight: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  surfaceType: z.string().optional(),
  inStockOnly: z.coerce.boolean().default(true),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function inventoryRoutes(fastify: FastifyInstance) {
  /**
   * POST /inventory/upload-csv
   * Upload inventory CSV file
   */
  fastify.post('/upload-csv', { preHandler: requireManager }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }

    const buffer = await data.toBuffer();
    const csvContent = buffer.toString('utf-8');

    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid CSV format',
      });
    }

    const storeId = request.user.storeId;
    const results = {
      created: 0,
      updated: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Parse and validate record
        const item = {
          sku: record.sku?.trim(),
          name: record.name?.trim(),
          description: record.description?.trim() || '',
          category: record.category?.trim() || 'other',
          price: parseFloat(record.price) || 0,
          stock: parseInt(record.stock) || 0,
          aisle: record.aisle?.trim() || '',
          bin: record.bin?.trim() || null,
          tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
          attributes: record.attributes ? JSON.parse(record.attributes) : {},
        };

        if (!item.sku || !item.name) {
          results.errors.push({ row: i + 2, error: 'Missing required field: sku or name' });
          continue;
        }

        // Upsert item
        const existing = await fastify.prisma.inventoryItem.findUnique({
          where: {
            sku_storeId: { sku: item.sku, storeId },
          },
        });

        if (existing) {
          await fastify.prisma.inventoryItem.update({
            where: { id: existing.id },
            data: item,
          });
          results.updated++;
        } else {
          await fastify.prisma.inventoryItem.create({
            data: { ...item, storeId },
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push({ row: i + 2, error: err.message });
      }
    }

    return {
      message: 'CSV processed',
      results,
    };
  });

  /**
   * GET /inventory/search
   * Search inventory with constraints
   */
  fastify.get('/search', { preHandler: requireAuth }, async (request) => {
    const startTime = Date.now();
    const params = searchSchema.parse(request.query);
    const storeId = request.user.storeId;

    // Build where clause
    const where: any = {
      storeId,
    };

    // Text search
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { tags: { has: params.q.toLowerCase() } },
        { category: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (params.category) {
      where.category = params.category;
    }

    // In-stock filter
    if (params.inStockOnly) {
      where.stock = { gt: 0 };
    }

    // Budget filter
    if (params.maxBudget) {
      where.price = { lte: params.maxBudget };
    }

    // Query items
    let items = await fastify.prisma.inventoryItem.findMany({
      where,
      take: params.limit * 2, // Get more, then filter
      orderBy: [
        { stock: 'desc' },
        { name: 'asc' },
      ],
    });

    // Apply attribute-based filters
    items = items.filter((item) => {
      const attrs = item.attributes as Record<string, any>;
      const tags = item.tags;

      // No damage filter
      if (params.noDamage) {
        if (!tags.some(t => ['no-damage', 'rental-friendly', 'removable'].includes(t))) {
          return false;
        }
      }

      // No tools filter
      if (params.noTools) {
        if (!tags.some(t => ['no-tools'].includes(t)) && attrs.requires_drill) {
          return false;
        }
      }

      // No drilling filter
      if (params.noDrilling) {
        if (tags.includes('drilling-required') || attrs.requires_drill) {
          return false;
        }
      }

      // Weight capacity filter
      if (params.minWeight && attrs.weight_capacity_lbs) {
        if (attrs.weight_capacity_lbs < params.minWeight) {
          return false;
        }
      }

      // Surface type filter
      if (params.surfaceType && attrs.surface_types) {
        const surfaces = attrs.surface_types as string[];
        if (!surfaces.some(s => s.toLowerCase().includes(params.surfaceType!.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });

    // Limit results
    items = items.slice(0, params.limit);

    const searchTimeMs = Date.now() - startTime;

    return {
      items: items.map((item) => ({
        ...item,
        price: parseFloat(item.price.toString()),
      })),
      totalCount: items.length,
      searchMetadata: {
        query: params.q || '',
        constraintsApplied: {
          noDamage: params.noDamage,
          noTools: params.noTools,
          noDrilling: params.noDrilling,
          maxWeight: params.maxWeight,
          minWeight: params.minWeight,
          maxBudget: params.maxBudget,
          surfaceType: params.surfaceType,
          inStockOnly: params.inStockOnly,
        },
        searchTimeMs,
      },
    };
  });

  /**
   * GET /inventory/:sku
   * Get single inventory item by SKU
   */
  fastify.get('/:sku', { preHandler: requireAuth }, async (request, reply) => {
    const { sku } = request.params as { sku: string };
    const storeId = request.user.storeId;

    const item = await fastify.prisma.inventoryItem.findUnique({
      where: {
        sku_storeId: { sku, storeId },
      },
    });

    if (!item) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Item with SKU "${sku}" not found`,
      });
    }

    return {
      ...item,
      price: parseFloat(item.price.toString()),
    };
  });

  /**
   * GET /inventory
   * List all inventory items (paginated)
   */
  fastify.get('/', { preHandler: requireAuth }, async (request) => {
    const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };
    const storeId = request.user.storeId;

    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      fastify.prisma.inventoryItem.findMany({
        where: { storeId },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      fastify.prisma.inventoryItem.count({
        where: { storeId },
      }),
    ]);

    return {
      data: items.map((item) => ({
        ...item,
        price: parseFloat(item.price.toString()),
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  });
}
