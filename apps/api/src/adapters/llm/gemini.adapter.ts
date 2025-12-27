// ===========================================
// Google Gemini LLM Adapter (FREE TIER!)
// Using Gemini 1.5 Flash for fast, free inference
// ===========================================

import { config } from '../../config';
import { LLMAdapter, LLMContext, SYSTEM_PROMPT } from './llm.adapter';
import { LLMAssistantOutput } from '@katzai/shared';

export class GeminiAdapter implements LLMAdapter {
  name = 'google-gemini';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = config.GEMINI_API_KEY || '';
    this.model = config.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async generateResponse(context: LLMContext): Promise<LLMAssistantOutput> {
    // Validate API key is present
    if (!this.apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return this.getSafeFallback('AI not configured - missing GEMINI_API_KEY');
    }

    // Build inventory context for the LLM
    const inventoryContext = this.buildInventoryContext(context);
    
    // Build conversation history
    const history = context.conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Build current prompt
    const userPrompt = this.buildUserPrompt(context, inventoryContext);

    const requestBody = {
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    };

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      // Extract text from Gemini response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        throw new Error('No text response from Gemini');
      }

      // Parse JSON response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.normalizeResponse(parsed);
    } catch (error: any) {
      console.error('Gemini API error:', error);
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

Respond with valid JSON matching the schema in your system instructions.`;
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
      constraintsList.push(`- Item weight capacity must support at least ${constraints.maxWeight} lbs`);
    }
    if (constraints.surfaceType) {
      constraintsList.push(`- Must work on: ${constraints.surfaceType}`);
    }
    if (constraints.maxBudget) {
      constraintsList.push(`- Budget: Under $${constraints.maxBudget}`);
    }

    if (constraintsList.length === 0) {
      return 'CUSTOMER CONSTRAINTS: None specified.';
    }

    return `CUSTOMER CONSTRAINTS:\n${constraintsList.join('\n')}`;
  }

  private normalizeResponse(response: any): LLMAssistantOutput {
    return {
      assistant_message: response.assistant_message || "I'm sorry, I couldn't process that request.",
      follow_up_questions: Array.isArray(response.follow_up_questions) ? response.follow_up_questions : [],
      recommended_skus: Array.isArray(response.recommended_skus) 
        ? response.recommended_skus.filter((sku: any) => typeof sku === 'string')
        : [],
      add_on_skus: Array.isArray(response.add_on_skus) ? response.add_on_skus : [],
      cart: Array.isArray(response.cart) ? response.cart : [],
      safety_notes: Array.isArray(response.safety_notes) ? response.safety_notes : [],
      reasoning: response.reasoning || {},
      confidence: typeof response.confidence === 'number' ? response.confidence : 0.5,
    };
  }

  private getSafeFallback(errorMessage: string): LLMAssistantOutput {
    console.error('Using fallback response due to:', errorMessage);
    return {
      assistant_message: "I apologize, but I'm having trouble processing your request right now. Could you please try again or rephrase your question?",
      follow_up_questions: ['What product are you looking for today?'],
      recommended_skus: [],
      add_on_skus: [],
      cart: [],
      safety_notes: [],
      reasoning: {},
      confidence: 0,
    };
  }
}
