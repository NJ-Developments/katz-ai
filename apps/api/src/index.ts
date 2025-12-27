// ===========================================
// KatzAI Backend API - Main Entry Point
// ===========================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from './config';
import { prismaPlugin } from './plugins/prisma';
import { authRoutes } from './modules/auth/auth.routes';
import { storeRoutes } from './modules/stores/stores.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { assistantRoutes } from './modules/assistant/assistant.routes';
import { cartRoutes } from './modules/carts/carts.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { employeeRoutes } from './modules/employee/employee.routes';

const server = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true,
      credentials: true,
    });

    await server.register(helmet);

    await server.register(jwt, {
      secret: config.JWT_SECRET,
      sign: {
        expiresIn: config.JWT_EXPIRES_IN,
      },
    });

    await server.register(rateLimit, {
      max: config.RATE_LIMIT_MAX,
      timeWindow: config.RATE_LIMIT_WINDOW_MS,
    });

    await server.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    await server.register(prismaPlugin);

    // Register routes
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(storeRoutes, { prefix: '/stores' });
    await server.register(inventoryRoutes, { prefix: '/inventory' });
    await server.register(assistantRoutes, { prefix: '/assistant' });
    await server.register(cartRoutes, { prefix: '/carts' });
    await server.register(analyticsRoutes, { prefix: '/analytics' });
    await server.register(employeeRoutes, { prefix: '/employee' });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    await server.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    });

    console.log(`🚀 KatzAI API running at http://${config.API_HOST}:${config.API_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
