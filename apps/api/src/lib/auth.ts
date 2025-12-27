// ===========================================
// Authentication Middleware & Utilities
// ===========================================

import { FastifyRequest, FastifyReply } from 'fastify';

type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface JWTPayload {
  userId: string;
  storeId: string;
  role: UserRole;
  email: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

/**
 * Middleware: Require authentication
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}

/**
 * Middleware: Require specific role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    
    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
      });
    }
  };
}

/**
 * Middleware: Require manager or admin role
 */
export const requireManager = requireRole('MANAGER', 'ADMIN');

/**
 * Middleware: Require admin role
 */
export const requireAdmin = requireRole('ADMIN');
