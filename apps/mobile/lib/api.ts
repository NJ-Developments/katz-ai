// ===========================================
// API Client for Mobile App
// ===========================================

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

// Token storage
const TOKEN_KEY = 'katzai_token';
const USER_KEY = 'katzai_user';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredUser(): Promise<any | null> {
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export async function setStoredUser(user: any): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

// API fetch helper
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string) {
  const response = await fetchAPI<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await setStoredToken(response.token);
  await setStoredUser(response.user);

  return response;
}

export async function logout() {
  await clearStoredToken();
}

export async function getMe() {
  return fetchAPI<any>('/auth/me');
}

// Assistant
export async function askAssistant(
  transcript: string,
  conversationId?: string,
  constraints?: any
) {
  return fetchAPI<any>('/assistant/ask', {
    method: 'POST',
    body: JSON.stringify({
      transcript,
      conversationId,
      constraints,
    }),
  });
}

export async function askAssistantWithAudio(
  audioUri: string,
  mimeType: string,
  conversationId?: string,
  constraints?: any
) {
  const token = await getStoredToken();
  
  const formData = new FormData();
  
  // Add audio file
  formData.append('file', {
    uri: audioUri,
    type: mimeType,
    name: 'recording.webm',
  } as any);

  if (conversationId) {
    formData.append('conversationId', conversationId);
  }

  if (constraints) {
    formData.append('constraints', JSON.stringify(constraints));
  }

  const response = await fetch(`${API_URL}/assistant/ask-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message);
  }

  return response.json();
}

// Convenience wrapper for assistant screen
export async function askAudio(audioUri: string, sessionId?: string) {
  return askAssistantWithAudio(audioUri, 'audio/m4a', sessionId);
}

// Inventory
export async function searchInventory(query: string, constraints?: any) {
  const params = new URLSearchParams({ q: query });
  if (constraints) {
    Object.entries(constraints).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  return fetchAPI<{ items: any[] }>(`/inventory/search?${params}`);
}

export async function getInventoryItem(sku: string) {
  return fetchAPI<any>(`/inventory/${sku}`);
}

// Carts
export async function createCart(items: Array<{ sku: string; quantity: number }>, conversationId?: string) {
  return fetchAPI<any>('/carts', {
    method: 'POST',
    body: JSON.stringify({ items, conversationId }),
  });
}

export async function getCart(cartId: string) {
  return fetchAPI<any>(`/carts/${cartId}`);
}

export async function getUserCarts() {
  return fetchAPI<any[]>('/carts');
}
