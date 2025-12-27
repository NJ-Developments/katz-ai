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

interface MentionedProduct {
  sku: string
  name: string
  price: number
  aisle: string
  bin: string | null
  stock: number
}

export async function askAssistant(
  question: string,
  products: Product[],
  conversationHistory: ConversationMessage[] = []
): Promise<{ response: string; suggestedQuestions: string[]; mentionedProducts: MentionedProduct[] }> {
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

  const prompt = `You are a friendly, warm hardware store employee named Katz. You genuinely enjoy helping people with their projects and making their lives easier. Speak naturally like a helpful colleague would - use casual, conversational language.

STORE INVENTORY (${products.length} products in ${categories.length} categories):
${productList}

${historyContext}
CUSTOMER'S QUESTION: "${question}"

YOUR PERSONALITY:
- Warm and genuinely helpful, like talking to a knowledgeable friend
- Use natural phrases like "Oh perfect!", "Great choice!", "Here's what I'd grab...", "You'll want to..."
- Share quick tips or pro advice when relevant
- Be enthusiastic but not over-the-top
- Keep responses concise - customers are busy!

RULES:
1. ONLY recommend products from the inventory above
2. Always mention exact location (Aisle + Bin) so they can find it fast
3. Briefly explain why each product works for their need
4. If suggesting multiple options, keep comparisons short and helpful
5. If nothing matches, be honest and suggest what type of product they need
6. For follow-ups, reference the previous chat naturally

FORMAT YOUR RESPONSE:
- Write your helpful response naturally
- At the very end, add a line starting with "PRODUCTS:" followed by the SKUs you mentioned, separated by commas (e.g., PRODUCTS: HT-HAMMER-16, PT-DRILL-20V)
- Then add "SUGGESTED:" followed by 3 follow-up questions separated by | 

Example ending:
PRODUCTS: HT-HAMMER-16, FA-NAIL-16D-1LB
SUGGESTED: What size nails work best? | Do I need a stud finder? | Got any safety glasses?`

  try {
    const result = await model.generateContent(prompt)
    const fullResponse = result.response.text()
    
    // Parse response
    const lines = fullResponse.split('\n')
    const productsLine = lines.find(l => l.startsWith('PRODUCTS:'))
    const suggestedLine = lines.find(l => l.startsWith('SUGGESTED:'))
    
    // Extract mentioned product SKUs
    let mentionedSkus: string[] = []
    if (productsLine) {
      mentionedSkus = productsLine
        .replace('PRODUCTS:', '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }
    
    // Match SKUs to full product info
    const mentionedProducts: MentionedProduct[] = mentionedSkus
      .map(sku => products.find(p => p.sku === sku))
      .filter((p): p is Product => p !== undefined)
      .map(p => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        aisle: p.aisle,
        bin: p.bin,
        stock: p.stock
      }))
    
    // Parse suggested questions
    let suggestedQuestions: string[] = []
    if (suggestedLine) {
      suggestedQuestions = suggestedLine
        .replace('SUGGESTED:', '')
        .split('|')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 3)
    }
    
    // Clean response (remove the metadata lines)
    let response = lines
      .filter(l => !l.startsWith('PRODUCTS:') && !l.startsWith('SUGGESTED:'))
      .join('\n')
      .trim()
    
    // Default suggestions if none provided
    if (suggestedQuestions.length === 0) {
      suggestedQuestions = [
        'What else would I need?',
        'Got anything cheaper?',
        'Any pro tips?'
      ]
    }
    
    return { response, suggestedQuestions, mentionedProducts }
  } catch (error: unknown) {
    const err = error as Error
    console.error('AI error:', err.message)
    return {
      response: "Hmm, I'm having a little trouble right now. Give me a sec and try again?",
      suggestedQuestions: ['What products do you have?', 'I need help with a project', 'Show me your best sellers'],
      mentionedProducts: []
    }
  }
}
