// ===========================================
// Analytics Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { requireAuth, requireManager } from '../../lib/auth';

export async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * GET /analytics/overview
   * Get analytics overview for the store
   */
  fastify.get('/overview', { preHandler: requireManager }, async (request) => {
    const { storeId } = request.user;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get conversation counts
    const [totalConversations, conversationsToday, conversationsThisWeek] = await Promise.all([
      fastify.prisma.conversationLog.count({
        where: { storeId },
      }),
      fastify.prisma.conversationLog.count({
        where: {
          storeId,
          createdAt: { gte: todayStart },
        },
      }),
      fastify.prisma.conversationLog.count({
        where: {
          storeId,
          createdAt: { gte: weekStart },
        },
      }),
    ]);

    // Get average latency
    const latencyResult = await fastify.prisma.conversationLog.aggregate({
      where: { storeId },
      _avg: { latencyMs: true },
    });
    const averageLatencyMs = Math.round(latencyResult._avg.latencyMs || 0);

    // Get top intents
    const intentCounts = await fastify.prisma.conversationLog.groupBy({
      by: ['intent'],
      where: { storeId, intent: { not: null } },
      _count: { intent: true },
      orderBy: { _count: { intent: 'desc' } },
      take: 5,
    });

    const topIntents = intentCounts.map((row) => ({
      intent: row.intent || 'unknown',
      count: row._count.intent,
    }));

    // Get top recommended SKUs
    const logs = await fastify.prisma.conversationLog.findMany({
      where: { storeId },
      select: { recommendedSkus: true },
      take: 1000,
    });

    const skuCounts: Record<string, number> = {};
    logs.forEach((log) => {
      log.recommendedSkus.forEach((sku) => {
        skuCounts[sku] = (skuCounts[sku] || 0) + 1;
      });
    });

    const topSkus = Object.entries(skuCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Get product names for top SKUs
    const topRecommendedSkus = await Promise.all(
      topSkus.map(async ([sku, count]) => {
        const product = await fastify.prisma.inventoryItem.findFirst({
          where: { sku, storeId },
          select: { name: true },
        });
        return {
          sku,
          name: product?.name || sku,
          count,
        };
      })
    );

    // Calculate conversion rate (carts created / conversations)
    const cartCount = await fastify.prisma.cart.count({
      where: { storeId },
    });
    const conversionRate = totalConversations > 0
      ? Math.round((cartCount / totalConversations) * 100) / 100
      : 0;

    return {
      totalConversations,
      conversationsToday,
      conversationsThisWeek,
      averageLatencyMs,
      topIntents,
      topRecommendedSkus,
      conversionRate,
    };
  });

  /**
   * GET /analytics/conversations
   * Get recent conversation logs
   */
  fastify.get('/conversations', { preHandler: requireManager }, async (request) => {
    const { storeId } = request.user;
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

    const logs = await fastify.prisma.conversationLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return logs.map((log) => ({
      id: log.id,
      conversationId: log.conversationId,
      userMessage: log.userMessage,
      assistantMessage: log.assistantMessage.substring(0, 200) + (log.assistantMessage.length > 200 ? '...' : ''),
      recommendedSkus: log.recommendedSkus,
      latencyMs: log.latencyMs,
      intent: log.intent,
      createdAt: log.createdAt.toISOString(),
    }));
  });
}
