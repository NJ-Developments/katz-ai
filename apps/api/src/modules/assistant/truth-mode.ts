// ===========================================
// Truth Mode Validator
// Ensures LLM responses only reference valid inventory
// ===========================================

import { LLMAssistantOutput } from '@katzai/shared';

export interface ValidationResult {
  isValid: boolean;
  invalidSkus: string[];
  validatedOutput: LLMAssistantOutput;
}

/**
 * Validates that all SKUs in the LLM response exist in the allowed list.
 * This is the core "Truth Mode" enforcement layer.
 */
export function validateTruthMode(
  llmOutput: LLMAssistantOutput,
  allowedSkus: string[]
): ValidationResult {
  const allowedSet = new Set(allowedSkus);
  const invalidSkus: string[] = [];

  // Check recommended_skus
  const validRecommendedSkus = llmOutput.recommended_skus.filter((sku) => {
    if (!allowedSet.has(sku)) {
      invalidSkus.push(sku);
      return false;
    }
    return true;
  });

  // Check add_on_skus
  const validAddOnSkus = llmOutput.add_on_skus.filter((sku) => {
    if (!allowedSet.has(sku)) {
      invalidSkus.push(sku);
      return false;
    }
    return true;
  });

  // Check cart items
  const validCart = llmOutput.cart.filter((item) => {
    if (!allowedSet.has(item.sku)) {
      invalidSkus.push(item.sku);
      return false;
    }
    return true;
  });

  // Filter reasoning to only include valid SKUs
  const validReasoning: Record<string, string> = {};
  for (const [sku, reason] of Object.entries(llmOutput.reasoning)) {
    if (allowedSet.has(sku)) {
      validReasoning[sku] = reason;
    }
  }

  const validatedOutput: LLMAssistantOutput = {
    ...llmOutput,
    recommended_skus: validRecommendedSkus,
    add_on_skus: validAddOnSkus,
    cart: validCart,
    reasoning: validReasoning,
  };

  return {
    isValid: invalidSkus.length === 0,
    invalidSkus: [...new Set(invalidSkus)], // Remove duplicates
    validatedOutput,
  };
}

/**
 * Returns a safe fallback message when validation fails or inventory is unavailable
 */
export function getSafeFallbackResponse(reason: 'no_inventory' | 'validation_failed' | 'system_error'): LLMAssistantOutput {
  const messages: Record<string, string> = {
    no_inventory: "I couldn't find any matching products in our current inventory. Could you tell me more about what you're looking for, or I can check if we have similar items? Alternatively, you can ask an associate to verify our stock in this area.",
    validation_failed: "I'm having trouble confirming product availability right now. Please ask an associate to help verify our current stock for this request.",
    system_error: "I'm experiencing a technical issue. Please try again in a moment, or ask an associate for help.",
  };

  return {
    assistant_message: messages[reason],
    follow_up_questions: reason === 'no_inventory' 
      ? ['What specific task are you trying to accomplish?', 'Do you have any preferences like damage-free or budget limits?']
      : [],
    recommended_skus: [],
    add_on_skus: [],
    cart: [],
    safety_notes: [],
    reasoning: {},
    confidence: 0,
  };
}
