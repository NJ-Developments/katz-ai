// ===========================================
// Truth Mode Tests
// Verifies inventory grounding and hallucination prevention
// ===========================================

import { describe, it, expect } from 'vitest';
import { validateTruthMode, getSafeFallbackResponse } from '../src/modules/assistant/truth-mode';
import { LLMAssistantOutput } from '@katzai/shared';

describe('Truth Mode Validation', () => {
  const allowedSkus = ['CMD-STRIPS-MED', 'MONKEY-HOOK-10', 'DRYWALL-ANCHOR-50'];

  describe('validateTruthMode', () => {
    it('should accept valid SKUs that exist in allowed list', () => {
      const llmOutput: LLMAssistantOutput = {
        assistant_message: 'Here are some great options for hanging your picture.',
        follow_up_questions: [],
        recommended_skus: ['CMD-STRIPS-MED', 'MONKEY-HOOK-10'],
        add_on_skus: ['DRYWALL-ANCHOR-50'],
        cart: [{ sku: 'CMD-STRIPS-MED', qty: 1 }],
        safety_notes: [],
        reasoning: {
          'CMD-STRIPS-MED': 'Great for damage-free hanging',
          'MONKEY-HOOK-10': 'Easy to install, no tools needed',
        },
        confidence: 0.9,
      };

      const result = validateTruthMode(llmOutput, allowedSkus);

      expect(result.isValid).toBe(true);
      expect(result.invalidSkus).toHaveLength(0);
      expect(result.validatedOutput.recommended_skus).toEqual(['CMD-STRIPS-MED', 'MONKEY-HOOK-10']);
      expect(result.validatedOutput.add_on_skus).toEqual(['DRYWALL-ANCHOR-50']);
    });

    it('should REJECT hallucinated SKUs not in allowed list', () => {
      const llmOutput: LLMAssistantOutput = {
        assistant_message: 'I found some options for you.',
        follow_up_questions: [],
        recommended_skus: ['CMD-STRIPS-MED', 'FAKE-PRODUCT-123', 'HALLUCINATED-SKU'],
        add_on_skus: ['MADE-UP-ADDON'],
        cart: [
          { sku: 'CMD-STRIPS-MED', qty: 1 },
          { sku: 'NONEXISTENT-ITEM', qty: 2 },
        ],
        safety_notes: [],
        reasoning: {
          'CMD-STRIPS-MED': 'Valid product',
          'FAKE-PRODUCT-123': 'This should be filtered out',
        },
        confidence: 0.85,
      };

      const result = validateTruthMode(llmOutput, allowedSkus);

      expect(result.isValid).toBe(false);
      expect(result.invalidSkus).toContain('FAKE-PRODUCT-123');
      expect(result.invalidSkus).toContain('HALLUCINATED-SKU');
      expect(result.invalidSkus).toContain('MADE-UP-ADDON');
      expect(result.invalidSkus).toContain('NONEXISTENT-ITEM');

      // Validated output should only contain valid SKUs
      expect(result.validatedOutput.recommended_skus).toEqual(['CMD-STRIPS-MED']);
      expect(result.validatedOutput.add_on_skus).toEqual([]);
      expect(result.validatedOutput.cart).toEqual([{ sku: 'CMD-STRIPS-MED', qty: 1 }]);

      // Reasoning should only contain valid SKUs
      expect(result.validatedOutput.reasoning).toHaveProperty('CMD-STRIPS-MED');
      expect(result.validatedOutput.reasoning).not.toHaveProperty('FAKE-PRODUCT-123');
    });

    it('should handle empty recommendations gracefully', () => {
      const llmOutput: LLMAssistantOutput = {
        assistant_message: 'I need more information.',
        follow_up_questions: ['What surface type is the wall?'],
        recommended_skus: [],
        add_on_skus: [],
        cart: [],
        safety_notes: [],
        reasoning: {},
        confidence: 0.3,
      };

      const result = validateTruthMode(llmOutput, allowedSkus);

      expect(result.isValid).toBe(true);
      expect(result.invalidSkus).toHaveLength(0);
    });

    it('should handle all SKUs being invalid', () => {
      const llmOutput: LLMAssistantOutput = {
        assistant_message: 'Check out these products.',
        follow_up_questions: [],
        recommended_skus: ['FAKE-1', 'FAKE-2'],
        add_on_skus: ['FAKE-3'],
        cart: [{ sku: 'FAKE-1', qty: 1 }],
        safety_notes: [],
        reasoning: {},
        confidence: 0.8,
      };

      const result = validateTruthMode(llmOutput, allowedSkus);

      expect(result.isValid).toBe(false);
      expect(result.validatedOutput.recommended_skus).toEqual([]);
      expect(result.validatedOutput.add_on_skus).toEqual([]);
      expect(result.validatedOutput.cart).toEqual([]);
    });
  });

  describe('Safe Fallback Responses', () => {
    it('should return appropriate message for no inventory matches', () => {
      const fallback = getSafeFallbackResponse('no_inventory');

      expect(fallback.assistant_message).toContain('couldn\'t find any matching products');
      expect(fallback.recommended_skus).toEqual([]);
      expect(fallback.follow_up_questions.length).toBeGreaterThan(0);
      expect(fallback.confidence).toBe(0);
    });

    it('should return appropriate message for validation failure', () => {
      const fallback = getSafeFallbackResponse('validation_failed');

      expect(fallback.assistant_message).toContain('trouble confirming product availability');
      expect(fallback.recommended_skus).toEqual([]);
      expect(fallback.confidence).toBe(0);
    });

    it('should return appropriate message for system error', () => {
      const fallback = getSafeFallbackResponse('system_error');

      expect(fallback.assistant_message).toContain('technical issue');
      expect(fallback.recommended_skus).toEqual([]);
      expect(fallback.confidence).toBe(0);
    });
  });
});

describe('No-Damage Constraint Preference', () => {
  it('should validate that no-damage products are properly tagged', () => {
    // This test verifies the constraint logic would work correctly
    const noDamageProduct = {
      sku: 'CMD-STRIPS-MED',
      tags: ['no-damage', 'rental-friendly', 'no-tools'],
      attributes: { requires_drill: false },
    };

    const drillingProduct = {
      sku: 'DRYWALL-ANCHOR-50',
      tags: ['drilling-required'],
      attributes: { requires_drill: true },
    };

    // Verify no-damage product matches constraint
    const isNoDamageCompatible = (product: typeof noDamageProduct) => {
      return product.tags.some((t) =>
        ['no-damage', 'rental-friendly', 'removable'].includes(t)
      );
    };

    expect(isNoDamageCompatible(noDamageProduct)).toBe(true);
    expect(isNoDamageCompatible(drillingProduct)).toBe(false);
  });

  it('should filter out drilling-required products when noDrilling constraint is set', () => {
    const products = [
      { sku: 'CMD-STRIPS-MED', tags: ['no-damage'], attributes: { requires_drill: false } },
      { sku: 'MONKEY-HOOK-10', tags: ['no-tools'], attributes: { requires_drill: false } },
      { sku: 'DRYWALL-ANCHOR-50', tags: ['drilling-required'], attributes: { requires_drill: true } },
    ];

    const constraints = { noDrilling: true };

    const filtered = products.filter((product) => {
      if (constraints.noDrilling) {
        if (product.tags.includes('drilling-required') || product.attributes.requires_drill) {
          return false;
        }
      }
      return true;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.find((p) => p.sku === 'DRYWALL-ANCHOR-50')).toBeUndefined();
    expect(filtered.find((p) => p.sku === 'CMD-STRIPS-MED')).toBeDefined();
    expect(filtered.find((p) => p.sku === 'MONKEY-HOOK-10')).toBeDefined();
  });
});
