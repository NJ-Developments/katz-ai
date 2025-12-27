// ===========================================
// Assistant Routes
// Core AI assistant endpoints with Truth Mode
// ===========================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../lib/auth';
import { getLLMAdapter, LLMContext } from '../../adapters/llm';
import { getTranscriptionAdapter } from '../../adapters/transcription';
import { validateTruthMode, getSafeFallbackResponse } from './truth-mode';
import { InventoryItem, ProductCard, StorePolicy, LLMAssistantOutput } from '@katzai/shared';
import { SAFETY_KEYWORDS, SAFETY_DISCLAIMER } from '@katzai/shared';

const askSchema = z.object({
  transcript: z.string().min(1),
  conversationId: z.string().optional(),
  constraints: z.object({
    noDamage: z.boolean().optional(),
    noTools: z.boolean().optional(),
    noDrilling: z.boolean().optional(),
    maxWeight: z.number().optional(),
    minWeight: z.number().optional(),
    maxBudget: z.number().optional(),
    surfaceType: z.string().optional(),
  }).optional(),
});

export async function assistantRoutes(fastify: FastifyInstance) {
  /**
   * POST /assistant/ask
   * Main text-based assistant endpoint
   */
  fastify.post('/ask', { preHandler: requireAuth }, async (request, reply) => {
    const startTime = Date.now();
    const body = askSchema.parse(request.body);
    const { userId, storeId } = request.user;

    try {
      // 1. Get or create conversation
      let conversation = body.conversationId
        ? await fastify.prisma.conversation.findUnique({
            where: { id: body.conversationId },
          })
        : null;

      if (!conversation) {
        conversation = await fastify.prisma.conversation.create({
          data: {
            storeId,
            userId,
            messages: [],
            recommendedSkus: [],
          },
        });
      }

      // 2. Get store policies
      const store = await fastify.prisma.store.findUnique({
        where: { id: storeId },
      });
      const storePolicy = (store?.policies || {}) as StorePolicy;

      // 3. Search inventory based on transcript and constraints
      const searchConstraints = {
        ...body.constraints,
        inStockOnly: true,
      };

      // Apply store policy preferences
      if (storePolicy.preferNoDamage && !searchConstraints.noDamage) {
        // Don't override user's explicit choice, but note the preference
      }

      const inventoryResults = await searchInventory(
        fastify,
        storeId,
        body.transcript,
        searchConstraints
      );

      // 4. Prepare LLM context
      const allowedSkus = inventoryResults.map((item) => item.sku);
      const conversationHistory = (conversation.messages as any[]) || [];

      const llmContext: LLMContext = {
        transcript: body.transcript,
        conversationHistory,
        candidateItems: inventoryResults,
        allowedSkus,
        storePolicy,
        constraints: body.constraints || {},
      };

      // 5. Generate LLM response
      let llmOutput: LLMAssistantOutput;
      const llm = getLLMAdapter();

      if (inventoryResults.length === 0) {
        // No inventory matches - use safe fallback
        llmOutput = getSafeFallbackResponse('no_inventory');
      } else {
        llmOutput = await llm.generateResponse(llmContext);

        // 6. TRUTH MODE VALIDATION
        const validation = validateTruthMode(llmOutput, allowedSkus);

        if (!validation.isValid) {
          console.warn(`Truth Mode violation detected. Invalid SKUs: ${validation.invalidSkus.join(', ')}`);
          
          // Use validated output (with invalid SKUs removed)
          llmOutput = validation.validatedOutput;

          // If all SKUs were invalid, fall back to safe response
          if (llmOutput.recommended_skus.length === 0 && llmOutput.add_on_skus.length === 0) {
            llmOutput = getSafeFallbackResponse('validation_failed');
          }
        }
      }

      // 7. Check for safety-sensitive content
      const safetyNotes = checkSafetyKeywords(body.transcript, storePolicy);
      if (safetyNotes.length > 0) {
        llmOutput.safety_notes = [...llmOutput.safety_notes, ...safetyNotes];
      }

      // 8. Hydrate product cards from inventory
      const recommendedItems = hydrateProductCards(
        llmOutput.recommended_skus,
        inventoryResults,
        llmOutput.reasoning
      );

      const addOnItems = hydrateProductCards(
        llmOutput.add_on_skus,
        inventoryResults,
        llmOutput.reasoning
      );

      // 9. Update conversation
      const updatedMessages = [
        ...conversationHistory,
        { role: 'user', content: body.transcript, timestamp: new Date().toISOString() },
        { role: 'assistant', content: llmOutput.assistant_message, timestamp: new Date().toISOString() },
      ];

      const allRecommendedSkus = [
        ...new Set([
          ...conversation.recommendedSkus,
          ...llmOutput.recommended_skus,
          ...llmOutput.add_on_skus,
        ]),
      ];

      await fastify.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messages: updatedMessages,
          recommendedSkus: allRecommendedSkus,
        },
      });

      // 10. Log for analytics
      const processingTimeMs = Date.now() - startTime;

      await fastify.prisma.conversationLog.create({
        data: {
          conversationId: conversation.id,
          storeId,
          userId,
          userMessage: body.transcript,
          assistantMessage: llmOutput.assistant_message,
          recommendedSkus: llmOutput.recommended_skus,
          latencyMs: processingTimeMs,
          intent: extractIntent(body.transcript),
          constraints: body.constraints || {},
        },
      });

      // 11. Build response
      return {
        conversationId: conversation.id,
        assistantMessage: llmOutput.assistant_message,
        followUpQuestions: llmOutput.follow_up_questions,
        recommendedItems,
        addOnItems,
        cartSuggestion: llmOutput.cart.map((item) => {
          const product = inventoryResults.find((p) => p.sku === item.sku);
          return {
            sku: item.sku,
            name: product?.name || item.sku,
            price: product?.price || 0,
            quantity: item.qty,
            location: product ? `Aisle ${product.aisle}${product.bin ? `, Bin ${product.bin}` : ''}` : '',
          };
        }),
        safetyNotes: llmOutput.safety_notes,
        confidence: llmOutput.confidence,
        metadata: {
          processingTimeMs,
          inventorySearched: true,
          itemsConsidered: inventoryResults.length,
        },
      };
    } catch (error: any) {
      console.error('Assistant error:', error);
      
      const fallback = getSafeFallbackResponse('system_error');
      return {
        conversationId: body.conversationId || null,
        assistantMessage: fallback.assistant_message,
        followUpQuestions: [],
        recommendedItems: [],
        addOnItems: [],
        cartSuggestion: [],
        safetyNotes: [],
        confidence: 0,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          inventorySearched: false,
          itemsConsidered: 0,
          error: error.message,
        },
      };
    }
  });

  /**
   * POST /assistant/ask-audio
   * Audio-based assistant endpoint (transcribes then processes)
   */
  fastify.post('/ask-audio', { preHandler: requireAuth }, async (request, reply) => {
    const startTime = Date.now();

    // Get audio file from multipart
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No audio file uploaded',
      });
    }

    const audioBuffer = await data.toBuffer();
    const mimeType = data.mimetype || 'audio/webm';

    // Parse other fields
    const fields = data.fields as any;
    const conversationId = fields.conversationId?.value;
    const constraintsRaw = fields.constraints?.value;
    const constraints = constraintsRaw ? JSON.parse(constraintsRaw) : undefined;

    try {
      // Transcribe audio
      const transcriptionAdapter = getTranscriptionAdapter();
      const transcription = await transcriptionAdapter.transcribe(audioBuffer, mimeType);

      // Now process like text request
      const textRequest = {
        transcript: transcription.text,
        conversationId,
        constraints,
      };

      // Simulate internal call to /ask logic
      // In a real app, you'd refactor to share the core logic
      const response = await fastify.inject({
        method: 'POST',
        url: '/assistant/ask',
        headers: {
          authorization: request.headers.authorization,
        },
        payload: textRequest,
      });

      const result = JSON.parse(response.body);

      return {
        ...result,
        transcript: transcription.text,
        transcriptionMetadata: {
          confidence: transcription.confidence,
          language: transcription.language,
          durationMs: transcription.duration,
        },
      };
    } catch (error: any) {
      console.error('Audio assistant error:', error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to process audio',
      });
    }
  });
}

// ===========================================
// Helper Functions
// ===========================================

async function searchInventory(
  fastify: FastifyInstance,
  storeId: string,
  query: string,
  constraints: any
): Promise<InventoryItem[]> {
  // Extract key terms from query for search
  const searchTerms = extractSearchTerms(query);

  // Build where clause
  const where: any = {
    storeId,
    stock: { gt: 0 },
  };

  if (searchTerms.length > 0) {
    where.OR = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { tags: { has: term.toLowerCase() } },
      { category: { contains: term, mode: 'insensitive' } },
    ]);
  }

  if (constraints.maxBudget) {
    where.price = { lte: constraints.maxBudget };
  }

  // Query
  let items = await fastify.prisma.inventoryItem.findMany({
    where,
    take: 50,
    orderBy: { stock: 'desc' },
  });

  // Apply attribute filters
  items = items.filter((item) => {
    const attrs = item.attributes as Record<string, any>;
    const tags = item.tags;

    if (constraints.noDamage || constraints.noDrilling) {
      if (tags.includes('drilling-required') || attrs.requires_drill) {
        return false;
      }
    }

    if (constraints.noTools) {
      if (!tags.includes('no-tools') && !tags.includes('no-damage')) {
        return false;
      }
    }

    if (constraints.minWeight && attrs.weight_capacity_lbs) {
      if (attrs.weight_capacity_lbs < constraints.minWeight) {
        return false;
      }
    }

    if (constraints.surfaceType && attrs.surface_types) {
      const surfaces = attrs.surface_types as string[];
      if (!surfaces.some((s) => s.toLowerCase().includes(constraints.surfaceType.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  // Convert to proper type
  return items.slice(0, 20).map((item) => ({
    ...item,
    price: parseFloat(item.price.toString()),
  })) as unknown as InventoryItem[];
}

function extractSearchTerms(query: string): string[] {
  // Simple term extraction - in production, could use NLP
  const stopWords = new Set(['a', 'an', 'the', 'is', 'it', 'to', 'and', 'or', 'for', 'on', 'in', 'my', 'i', 'how', 'do', 'can', 'what', 'want', 'need']);
  
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Add some domain-specific mappings
  const mappings: Record<string, string[]> = {
    hang: ['hanging', 'hooks', 'strips', 'anchors'],
    picture: ['hanging', 'frame', 'hooks'],
    mirror: ['hanging', 'heavy-duty', 'anchors'],
    damage: ['no-damage', 'rental-friendly', 'command'],
    rental: ['no-damage', 'rental-friendly', 'removable'],
    drill: ['anchors', 'drilling-required', 'screws'],
    heavy: ['heavy-duty', 'anchors', 'toggle'],
    drywall: ['drywall', 'anchors', 'monkey'],
    concrete: ['concrete', 'masonry', 'tapcon'],
  };

  const expandedTerms = new Set(words);
  words.forEach((word) => {
    if (mappings[word]) {
      mappings[word].forEach((term) => expandedTerms.add(term));
    }
  });

  return Array.from(expandedTerms);
}

function hydrateProductCards(
  skus: string[],
  inventory: InventoryItem[],
  reasoning: Record<string, string>
): ProductCard[] {
  return skus.map((sku) => {
    const product = inventory.find((p) => p.sku === sku);
    if (!product) {
      return null;
    }

    return {
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      location: `Aisle ${product.aisle}${product.bin ? `, Bin ${product.bin}` : ''}`,
      whyItWorks: reasoning[sku] || product.description,
      attributes: product.attributes,
    };
  }).filter(Boolean) as ProductCard[];
}

function checkSafetyKeywords(transcript: string, policy: StorePolicy): string[] {
  if (!policy.safetyDisclaimers) {
    return [];
  }

  const lower = transcript.toLowerCase();
  const matches = SAFETY_KEYWORDS.filter((keyword) => lower.includes(keyword));

  if (matches.length > 0) {
    return [SAFETY_DISCLAIMER];
  }

  return [];
}

function extractIntent(transcript: string): string {
  const lower = transcript.toLowerCase();

  if (lower.includes('hang') || lower.includes('picture') || lower.includes('frame')) {
    return 'hang_item';
  }
  if (lower.includes('mount') || lower.includes('tv') || lower.includes('shelf')) {
    return 'mount_item';
  }
  if (lower.includes('fix') || lower.includes('repair')) {
    return 'repair';
  }
  if (lower.includes('find') || lower.includes('where')) {
    return 'locate_product';
  }

  return 'general_question';
}
