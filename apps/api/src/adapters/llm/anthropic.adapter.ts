// ===========================================
// Anthropic Claude LLM Adapter
// Default adapter using Claude for reasoning
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { LLMAdapter, LLMContext, SYSTEM_PROMPT } from './llm.adapter';
import { LLMAssistantOutput } from '@katzai/shared';

export class AnthropicAdapter implements LLMAdapter {
  name = 'anthropic-claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
  }

  async generateResponse(context: LLMContext): Promise<LLMAssistantOutput> {
    // Build inventory context for the LLM
    const inventoryContext = this.buildInventoryContext(context);
    
    // Build conversation messages
    const messages: Anthropic.MessageParam[] = [
      // Include conversation history
      ...context.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Add current user message with context
      {
        role: 'user' as const,
        content: this.buildUserPrompt(context, inventoryContext),
      },
    ];

    try {
      const response = await this.client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Parse JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as LLMAssistantOutput;
      return this.normalizeResponse(parsed);
    } catch (error: any) {
      console.error('Claude API error:', error);
      // Return safe fallback
      return this.getSafeFallback(error.message);
    }
  }

  private buildInventoryContext(context: LLMContext): string {
    if (context.candidateItems.length === 0) {
      return 'AVAILABLE INVENTORY: No matching products found in inventory.';
    }

    const itemsList = context.candidateItems.map((item) => {
      const attrs = item.attributes as Record<string, any>;
      return `- SKU: ${item.sku}
  Name: ${item.name}
  Price: $${item.price}
  Stock: ${item.stock} units
  Location: Aisle ${item.aisle}${item.bin ? `, Bin ${item.bin}` : ''}
  Category: ${item.category}
  Tags: ${item.tags.join(', ')}
  Weight Capacity: ${attrs.weight_capacity_lbs || 'N/A'} lbs
  Surfaces: ${attrs.surface_types?.join(', ') || 'various'}
  Requires Drill: ${attrs.requires_drill ? 'Yes' : 'No'}
  Description: ${item.description}`;
    }).join('\n\n');

    return `AVAILABLE INVENTORY (ONLY recommend from this list):
ALLOWED SKUs: [${context.allowedSkus.join(', ')}]

${itemsList}`;
  }

  private buildUserPrompt(context: LLMContext, inventoryContext: string): string {
    const policyContext = this.buildPolicyContext(context.storePolicy);
    const constraintContext = this.buildConstraintContext(context.constraints);

    return `${inventoryContext}

${policyContext}

${constraintContext}

CUSTOMER QUESTION:
"${context.transcript}"

Remember: You can ONLY recommend SKUs from this list: [${context.allowedSkus.join(', ')}]
If no products match, set recommended_skus=[] and explain why.

Respond with valid JSON only.`;
  }

  private buildPolicyContext(policy: any): string {
    const policies: string[] = [];
    
    if (policy.preferNoDamage) {
      policies.push('- Prefer damage-free/rental-friendly options');
    }
    if (policy.preferNoTools) {
      policies.push('- Prefer no-tools-required options');
    }
    if (!policy.suggestDrillingFirst) {
      policies.push('- Only suggest drilling as a last resort');
    }
    if (policy.safetyDisclaimers) {
      policies.push('- Include safety disclaimers for electrical/plumbing tasks');
    }
    if (policy.customInstructions) {
      policies.push(`- ${policy.customInstructions}`);
    }

    if (policies.length === 0) {
      return 'STORE POLICIES: Standard recommendations.';
    }

    return `STORE POLICIES:\n${policies.join('\n')}`;
  }

  private buildConstraintContext(constraints: LLMContext['constraints']): string {
    const constraintsList: string[] = [];

    if (constraints.noDamage) {
      constraintsList.push('- Customer wants NO DAMAGE / rental-friendly options');
    }
    if (constraints.noTools) {
      constraintsList.push('- Customer wants NO TOOLS required');
    }
    if (constraints.noDrilling) {
      constraintsList.push('- Customer wants NO DRILLING');
    }
    if (constraints.maxWeight) {
      constraintsList.push(`- Need to support at least ${constraints.maxWeight} lbs`);
    }
    if (constraints.surfaceType) {
      constraintsList.push(`- Surface type: ${constraints.surfaceType}`);
    }
    if (constraints.maxBudget) {
      constraintsList.push(`- Budget limit: $${constraints.maxBudget}`);
    }

    if (constraintsList.length === 0) {
      return 'CUSTOMER CONSTRAINTS: None specified.';
    }

    return `CUSTOMER CONSTRAINTS:\n${constraintsList.join('\n')}`;
  }

  private normalizeResponse(parsed: any): LLMAssistantOutput {
    return {
      assistant_message: parsed.assistant_message || 'I apologize, but I encountered an issue processing your request.',
      follow_up_questions: parsed.follow_up_questions || [],
      recommended_skus: parsed.recommended_skus || [],
      add_on_skus: parsed.add_on_skus || [],
      cart: parsed.cart || [],
      safety_notes: parsed.safety_notes || [],
      reasoning: parsed.reasoning || {},
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  }

  private getSafeFallback(errorMessage: string): LLMAssistantOutput {
    return {
      assistant_message: "I'm having trouble processing your request right now. Could you please rephrase your question, or I can help you find a store associate?",
      follow_up_questions: [],
      recommended_skus: [],
      add_on_skus: [],
      cart: [],
      safety_notes: [],
      reasoning: {},
      confidence: 0,
    };
  }
}
