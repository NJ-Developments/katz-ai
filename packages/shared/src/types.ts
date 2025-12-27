// ===========================================
// Shared Types for KatzAI Platform
// ===========================================

// ============ AUTH ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserPublic;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  storeId: string;
}

// ============ USERS ============
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId: string;
  storeName?: string;
  createdAt: string;
}

// ============ STORES ============
export interface Store {
  id: string;
  name: string;
  slug: string;
  address?: string;
  policies: StorePolicy;
  createdAt: string;
  updatedAt: string;
}

export interface StorePolicy {
  preferNoDamage: boolean;
  preferNoTools: boolean;
  suggestDrillingFirst: boolean;
  maxBudgetDefault?: number;
  safetyDisclaimers: boolean;
  customInstructions?: string;
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  policies?: Partial<StorePolicy>;
}

export interface UpdateStorePoliciesRequest {
  policies: Partial<StorePolicy>;
}

// ============ INVENTORY ============
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  aisle: string;
  bin?: string;
  tags: string[];
  attributes: Record<string, any>;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySearchParams {
  query: string;
  constraints?: SearchConstraints;
  limit?: number;
}

export interface SearchConstraints {
  noDamage?: boolean;
  noTools?: boolean;
  noDrilling?: boolean;
  maxWeight?: number;
  minWeight?: number;
  maxBudget?: number;
  surfaceType?: string;
  category?: string;
  inStockOnly?: boolean;
}

export interface InventorySearchResult {
  items: InventoryItem[];
  totalCount: number;
  searchMetadata: {
    query: string;
    constraintsApplied: SearchConstraints;
    searchTimeMs: number;
  };
}

// ============ ASSISTANT ============
export interface AssistantAskRequest {
  transcript: string;
  conversationId?: string;
  constraints?: SearchConstraints;
}

export interface AssistantAskAudioRequest {
  conversationId?: string;
  constraints?: SearchConstraints;
  // Audio file sent as multipart form data
}

export interface AssistantResponse {
  conversationId: string;
  transcript?: string; // If audio was sent
  assistantMessage: string;
  followUpQuestions: string[];
  recommendedItems: ProductCard[];
  addOnItems: ProductCard[];
  cartSuggestion: CartItem[];
  safetyNotes: string[];
  confidence: number;
  metadata: {
    processingTimeMs: number;
    inventorySearched: boolean;
    itemsConsidered: number;
  };
}

export interface ProductCard {
  sku: string;
  name: string;
  price: number;
  stock: number;
  location: string;
  whyItWorks: string;
  attributes: Record<string, any>;
}

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  location: string;
}

// ============ LLM RESPONSE SCHEMA ============
// This is what the LLM must return - validated by backend
export interface LLMAssistantOutput {
  assistant_message: string;
  follow_up_questions: string[];
  recommended_skus: string[];
  add_on_skus: string[];
  cart: Array<{ sku: string; qty: number }>;
  safety_notes: string[];
  reasoning: Record<string, string>; // sku -> why it was recommended
  confidence: number;
}

// ============ CARTS ============
export interface Cart {
  id: string;
  items: CartItem[];
  storeId: string;
  userId: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCartRequest {
  items: Array<{ sku: string; quantity: number }>;
  conversationId?: string;
}

// ============ CONVERSATIONS ============
export interface Conversation {
  id: string;
  storeId: string;
  userId: string;
  messages: ConversationMessage[];
  recommendedSkus: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============ ANALYTICS ============
export interface AnalyticsOverview {
  totalConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  averageLatencyMs: number;
  topIntents: Array<{ intent: string; count: number }>;
  topRecommendedSkus: Array<{ sku: string; name: string; count: number }>;
  conversionRate: number;
}

// ============ API ERRORS ============
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, any>;
}

// ============ PAGINATION ============
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
