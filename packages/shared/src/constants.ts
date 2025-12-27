// ===========================================
// Shared Constants for KatzAI Platform
// ===========================================

export const USER_ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN'] as const;

export const DEFAULT_STORE_POLICIES = {
  preferNoDamage: false,
  preferNoTools: false,
  suggestDrillingFirst: false,
  safetyDisclaimers: true,
};

export const INVENTORY_CATEGORIES = [
  'hanging',
  'hardware',
  'tools',
  'electrical',
  'plumbing',
  'paint',
  'lumber',
  'outdoor',
  'safety',
  'adhesives',
  'fasteners',
  'other',
] as const;

export const SURFACE_TYPES = [
  'painted drywall',
  'unpainted drywall',
  'plaster',
  'concrete',
  'brick',
  'tile',
  'glass',
  'wood',
  'metal',
  'vinyl',
  'other',
] as const;

export const SAFETY_KEYWORDS = [
  'electrical',
  'wiring',
  'circuit',
  'breaker',
  'plumbing',
  'gas line',
  'structural',
  'load-bearing',
  'asbestos',
  'lead paint',
  'high voltage',
] as const;

export const SAFETY_DISCLAIMER = `
⚠️ SAFETY NOTE: This task may involve electrical, plumbing, or structural work. 
For safety, we recommend consulting a licensed professional. 
Always turn off power/water before working on electrical/plumbing systems.
`.trim();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // Stores
  STORES: '/stores',
  STORE_ME: '/stores/me',
  STORE_POLICIES: '/stores/:id/policies',
  
  // Inventory
  INVENTORY_UPLOAD: '/inventory/upload-csv',
  INVENTORY_SEARCH: '/inventory/search',
  INVENTORY_ITEM: '/inventory/:sku',
  
  // Assistant
  ASSISTANT_ASK: '/assistant/ask',
  ASSISTANT_ASK_AUDIO: '/assistant/ask-audio',
  
  // Carts
  CARTS: '/carts',
  CART: '/carts/:id',
  
  // Analytics
  ANALYTICS_OVERVIEW: '/analytics/overview',
} as const;
