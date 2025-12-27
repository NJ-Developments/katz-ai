// ===========================================
// LLM Adapter Factory
// ===========================================

import { config } from '../../config';
import { LLMAdapter } from './llm.adapter';
import { AnthropicAdapter } from './anthropic.adapter';

let llmInstance: LLMAdapter | null = null;

export function getLLMAdapter(): LLMAdapter {
  if (llmInstance) {
    return llmInstance;
  }

  switch (config.LLM_PROVIDER) {
    case 'anthropic':
      llmInstance = new AnthropicAdapter();
      break;
    case 'openai':
      // Could add OpenAI adapter here in future
      throw new Error('OpenAI adapter not yet implemented - use anthropic');
    default:
      throw new Error(`Unknown LLM provider: ${config.LLM_PROVIDER}`);
  }

  console.log(`📡 LLM Adapter initialized: ${llmInstance.name}`);
  return llmInstance;
}

export * from './llm.adapter';
