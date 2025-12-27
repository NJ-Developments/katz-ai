import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface Product {
  sku: string
  name: string
  description: string
  price: number
  stock: number
  aisle: string
  bin: string | null
  attributes: string
  category?: string
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function askAssistant(
  question: string,
  products: Product[],
  conversationHistory: ConversationMessage[] = []
): Promise<{ response: string; suggestedQuestions: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' })

  // Build product catalog with categories
  const categories = [...new Set(products.map(p => p.category || 'General'))]
  
  const productList = products
    .map(
      (p) =>
        `• ${p.sku}: ${p.name} ($${p.price}) - ${p.stock} in stock\n  Location: Aisle ${p.aisle}${p.bin ? `, Bin ${p.bin}` : ''}\n  Category: ${p.category || 'General'}\n  ${p.description}\n  Specs: ${p.attributes}`
    )
    .join('\n\n')

  // Build conversation context (last 6 messages)
  const recentHistory = conversationHistory.slice(-6)
  const historyContext = recentHistory.length > 0
    ? `\nPREVIOUS CONVERSATION:\n${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`
    : ''

  const prompt = `You are KatzAI, a friendly and knowledgeable hardware store assistant. You help customers find the right products for their projects.

STORE INVENTORY (${products.length} products in ${categories.length} categories):
${productList}

${historyContext}
CUSTOMER'S CURRENT QUESTION: "${question}"

INSTRUCTIONS:
1. Recommend products ONLY from the inventory above
2. Always include the exact location (Aisle and Bin) so they can find it
3. Explain WHY each product is good for their specific need
4. If multiple options exist, compare them (price, quality, features)
5. If nothing matches, say so honestly and suggest what they might need
6. Be conversational, friendly, and concise
7. For follow-up questions, reference the previous conversation
8. If the question is unclear, ask a clarifying question

At the END of your response, on a new line, add exactly 3 suggested follow-up questions the customer might ask, formatted as:
SUGGESTED: question1 | question2 | question3`

  try {
    const result = await model.generateContent(prompt)
    const fullResponse = result.response.text()
    
    // Parse suggested questions
    const lines = fullResponse.split('\n')
    const suggestedLine = lines.find(l => l.startsWith('SUGGESTED:'))
    let suggestedQuestions: string[] = []
    let response = fullResponse
    
    if (suggestedLine) {
      suggestedQuestions = suggestedLine
        .replace('SUGGESTED:', '')
        .split('|')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 3)
      response = lines.filter(l => !l.startsWith('SUGGESTED:')).join('\n').trim()
    }
    
    // Default suggestions if none provided
    if (suggestedQuestions.length === 0) {
      suggestedQuestions = [
        'What tools do I need for this?',
        'Do you have anything cheaper?',
        'Where can I find this?'
      ]
    }
    
    return { response, suggestedQuestions }
  } catch (error: unknown) {
    const err = error as Error
    console.error('AI error:', err.message)
    return {
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      suggestedQuestions: ['What products do you have?', 'I need help with a project', 'Show me your best sellers']
    }
  }
}
