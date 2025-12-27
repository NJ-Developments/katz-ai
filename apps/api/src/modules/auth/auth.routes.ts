// ===========================================
// Auth Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth, requireManager } from '../../lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['EMPLOYEE', 'MANAGER']).default('EMPLOYEE'),
  storeId: z.string().optional(), // Required for non-managers
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Login and receive JWT token
   */
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await fastify.prisma.user.findUnique({
      where: { email: body.email },
      include: { store: true },
    });

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      storeId: user.storeId,
      role: user.role,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  });

  /**
   * POST /auth/register
   * Register new user (managers can create employees in their store)
   */
  fastify.post('/register', { preHandler: requireManager }, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const managerUser = request.user;

    // Use manager's store if not specified
    const storeId = body.storeId || managerUser.storeId;

    // Verify store exists and manager has access
    if (storeId !== managerUser.storeId && managerUser.role !== 'ADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You can only create users for your own store',
      });
    }

    // Check if email already exists
    const existing = await fastify.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Create user
    const user = await fastify.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role,
        storeId,
      },
      include: { store: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  });

  /**
   * GET /auth/me
   * Get current user profile
   */
  fastify.get('/me', { preHandler: requireAuth }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { store: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      storeName: user.store.name,
      createdAt: user.createdAt.toISOString(),
    };
  });
}
