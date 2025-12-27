// ===========================================
// Stores Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireManager, requireAdmin } from '../../lib/auth';
import { DEFAULT_STORE_POLICIES } from '@katzai/shared';

const createStoreSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  policies: z.object({
    preferNoDamage: z.boolean().default(false),
    preferNoTools: z.boolean().default(false),
    suggestDrillingFirst: z.boolean().default(false),
    maxBudgetDefault: z.number().optional(),
    safetyDisclaimers: z.boolean().default(true),
    customInstructions: z.string().optional(),
  }).optional(),
});

const updatePoliciesSchema = z.object({
  policies: z.object({
    preferNoDamage: z.boolean().optional(),
    preferNoTools: z.boolean().optional(),
    suggestDrillingFirst: z.boolean().optional(),
    maxBudgetDefault: z.number().optional(),
    safetyDisclaimers: z.boolean().optional(),
    customInstructions: z.string().optional(),
  }),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function storeRoutes(fastify: FastifyInstance) {
  /**
   * POST /stores
   * Create a new store (admin only, or first-time setup)
   */
  fastify.post('/', async (request, reply) => {
    const body = createStoreSchema.parse(request.body);

    // Generate unique slug
    let slug = slugify(body.name);
    let slugSuffix = 0;
    
    while (await fastify.prisma.store.findUnique({ where: { slug } })) {
      slugSuffix++;
      slug = `${slugify(body.name)}-${slugSuffix}`;
    }

    const store = await fastify.prisma.store.create({
      data: {
        name: body.name,
        slug,
        address: body.address,
        policies: body.policies || DEFAULT_STORE_POLICIES,
      },
    });

    return store;
  });

  /**
   * GET /stores/me
   * Get current user's store
   */
  fastify.get('/me', { preHandler: requireAuth }, async (request) => {
    const store = await fastify.prisma.store.findUnique({
      where: { id: request.user.storeId },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  });

  /**
   * GET /stores/:id
   * Get store by ID
   */
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Users can only access their own store unless admin
    if (id !== request.user.storeId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only access your own store',
      });
    }

    const store = await fastify.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Store not found',
      });
    }

    return store;
  });

  /**
   * PATCH /stores/:id/policies
   * Update store policies
   */
  fastify.patch('/:id/policies', { preHandler: requireManager }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updatePoliciesSchema.parse(request.body);

    // Verify access
    if (id !== request.user.storeId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only update your own store policies',
      });
    }

    const store = await fastify.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Store not found',
      });
    }

    const currentPolicies = store.policies as Record<string, any>;
    const updatedPolicies = { ...currentPolicies, ...body.policies };

    const updatedStore = await fastify.prisma.store.update({
      where: { id },
      data: { policies: updatedPolicies },
    });

    return updatedStore;
  });

  /**
   * GET /stores/:id/users
   * Get all users in a store
   */
  fastify.get('/:id/users', { preHandler: requireManager }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Verify access
    if (id !== request.user.storeId && request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only view users in your own store',
      });
    }

    const users = await fastify.prisma.user.findMany({
      where: { storeId: id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  });
}
