// ===========================================
// Employee Routes
// Endpoints specific to employee users
// ===========================================

import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../lib/auth';

export async function employeeRoutes(fastify: FastifyInstance) {
  /**
   * GET /employee/recent-conversations
   * Get recent conversations for the current user
   */
  fastify.get('/recent-conversations', { preHandler: requireAuth }, async (request) => {
    const { userId, storeId } = request.user;
    const { limit = '5' } = request.query as { limit?: string };
    const limitNum = Math.min(parseInt(limit) || 5, 20);

    const conversations = await fastify.prisma.conversation.findMany({
      where: {
        userId,
        storeId,
      },
      orderBy: { updatedAt: 'desc' },
      take: limitNum,
    });

    return conversations.map((conv) => {
      const messages = typeof conv.messages === 'string' 
        ? JSON.parse(conv.messages) 
        : (conv.messages as any[]);
      const recommendedSkus = typeof conv.recommendedSkus === 'string'
        ? JSON.parse(conv.recommendedSkus)
        : (conv.recommendedSkus as string[]);
      
      // Get first user message as preview
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      const preview = firstUserMessage?.content || 'New conversation';

      // Calculate relative time
      const timestamp = formatRelativeTime(conv.updatedAt);

      return {
        id: conv.id,
        preview: preview.length > 60 ? preview.substring(0, 60) + '...' : preview,
        timestamp,
        itemCount: recommendedSkus.length,
      };
    });
  });

  /**
   * GET /employee/recent-recommendations
   * Get recent product recommendations made to the user
   */
  fastify.get('/recent-recommendations', { preHandler: requireAuth }, async (request) => {
    const { userId, storeId } = request.user;
    const { limit = '5' } = request.query as { limit?: string };
    const limitNum = Math.min(parseInt(limit) || 5, 20);

    // Get recent conversation logs with recommendations
    const logs = await fastify.prisma.conversationLog.findMany({
      where: {
        userId,
        storeId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Get more to extract unique SKUs
    });

    // Collect unique SKUs from recommendations
    const seenSkus = new Set<string>();
    const skuList: { sku: string; timestamp: Date }[] = [];

    for (const log of logs) {
      const skus = typeof log.recommendedSkus === 'string'
        ? JSON.parse(log.recommendedSkus)
        : (log.recommendedSkus as string[]);
      
      for (const sku of skus) {
        if (!seenSkus.has(sku)) {
          seenSkus.add(sku);
          skuList.push({ sku, timestamp: log.createdAt });
          if (skuList.length >= limitNum) break;
        }
      }
      if (skuList.length >= limitNum) break;
    }

    // Fetch product details for these SKUs
    const products = await fastify.prisma.inventoryItem.findMany({
      where: {
        storeId,
        sku: { in: skuList.map((s) => s.sku) },
      },
    });

    // Build response with product details
    return skuList.map(({ sku, timestamp }) => {
      const product = products.find((p) => p.sku === sku);
      return {
        sku,
        name: product?.name || 'Unknown Product',
        price: product ? parseFloat(product.price.toString()) : 0,
        location: product 
          ? `Aisle ${product.aisle}${product.bin ? `, Bin ${product.bin}` : ''}`
          : 'Unknown',
        recommendedAt: formatRelativeTime(timestamp),
      };
    });
  });
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
