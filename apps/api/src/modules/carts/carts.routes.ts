// ===========================================
// Cart Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../lib/auth';

const createCartSchema = z.object({
  items: z.array(z.object({
    sku: z.string(),
    quantity: z.number().min(1),
  })),
  conversationId: z.string().optional(),
});

const updateCartSchema = z.object({
  items: z.array(z.object({
    sku: z.string(),
    quantity: z.number().min(0),
  })),
});

export async function cartRoutes(fastify: FastifyInstance) {
  /**
   * POST /carts
   * Create a new cart
   */
  fastify.post('/', { preHandler: requireAuth }, async (request) => {
    const body = createCartSchema.parse(request.body);
    const { userId, storeId } = request.user;

    // Hydrate items with product details
    const hydratedItems = await Promise.all(
      body.items.map(async (item) => {
        const product = await fastify.prisma.inventoryItem.findUnique({
          where: {
            sku_storeId: { sku: item.sku, storeId },
          },
        });

        return {
          sku: item.sku,
          name: product?.name || 'Unknown Product',
          price: product ? parseFloat(product.price.toString()) : 0,
          quantity: item.quantity,
          location: product
            ? `Aisle ${product.aisle}${product.bin ? `, Bin ${product.bin}` : ''}`
            : 'Unknown',
        };
      })
    );

    const cart = await fastify.prisma.cart.create({
      data: {
        storeId,
        userId,
        conversationId: body.conversationId,
        items: hydratedItems,
      },
    });

    return {
      id: cart.id,
      items: hydratedItems,
      total: hydratedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: cart.createdAt.toISOString(),
    };
  });

  /**
   * GET /carts/:id
   * Get cart by ID
   */
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { storeId } = request.user;

    const cart = await fastify.prisma.cart.findUnique({
      where: { id },
    });

    if (!cart) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Cart not found',
      });
    }

    // Verify store access
    if (cart.storeId !== storeId) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You cannot access this cart',
      });
    }

    const items = cart.items as any[];
    return {
      id: cart.id,
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      conversationId: cart.conversationId,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  });

  /**
   * PATCH /carts/:id
   * Update cart items
   */
  fastify.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateCartSchema.parse(request.body);
    const { storeId, userId } = request.user;

    const cart = await fastify.prisma.cart.findUnique({
      where: { id },
    });

    if (!cart) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Cart not found',
      });
    }

    if (cart.storeId !== storeId) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You cannot update this cart',
      });
    }

    // Merge and update items
    const currentItems = cart.items as any[];
    const updatedItems: any[] = [];

    for (const updateItem of body.items) {
      if (updateItem.quantity === 0) {
        // Remove item
        continue;
      }

      const existing = currentItems.find((i) => i.sku === updateItem.sku);
      if (existing) {
        updatedItems.push({ ...existing, quantity: updateItem.quantity });
      } else {
        // Add new item
        const product = await fastify.prisma.inventoryItem.findUnique({
          where: {
            sku_storeId: { sku: updateItem.sku, storeId },
          },
        });

        updatedItems.push({
          sku: updateItem.sku,
          name: product?.name || 'Unknown Product',
          price: product ? parseFloat(product.price.toString()) : 0,
          quantity: updateItem.quantity,
          location: product
            ? `Aisle ${product.aisle}${product.bin ? `, Bin ${product.bin}` : ''}`
            : 'Unknown',
        });
      }
    }

    // Keep items not in the update
    for (const item of currentItems) {
      if (!body.items.find((u) => u.sku === item.sku)) {
        updatedItems.push(item);
      }
    }

    const updatedCart = await fastify.prisma.cart.update({
      where: { id },
      data: { items: updatedItems },
    });

    return {
      id: updatedCart.id,
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      updatedAt: updatedCart.updatedAt.toISOString(),
    };
  });

  /**
   * GET /carts
   * List user's carts
   */
  fastify.get('/', { preHandler: requireAuth }, async (request) => {
    const { userId, storeId } = request.user;

    const carts = await fastify.prisma.cart.findMany({
      where: { userId, storeId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return carts.map((cart) => {
      const items = cart.items as any[];
      return {
        id: cart.id,
        itemCount: items.length,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        createdAt: cart.createdAt.toISOString(),
      };
    });
  });
}
