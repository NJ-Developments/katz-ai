// ===========================================
// API Client for Admin Dashboard
// ===========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string) {
  return fetchAPI<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string) {
  return fetchAPI<any>('/auth/me', { token });
}

export async function registerUser(token: string, data: { email: string; password: string; name: string; role: string }) {
  return fetchAPI<{ user: any }>('/auth/register', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

// Stores
export async function getStore(token: string) {
  return fetchAPI<any>('/stores/me', { token });
}

export async function updateStorePolicies(token: string, storeId: string, policies: any) {
  return fetchAPI<any>(`/stores/${storeId}/policies`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ policies }),
  });
}

export async function getStoreUsers(token: string, storeId: string) {
  return fetchAPI<any[]>(`/stores/${storeId}/users`, { token });
}

// Inventory
export async function getInventory(token: string, page = 1, limit = 50) {
  return fetchAPI<{ data: any[]; pagination: any }>(`/inventory?page=${page}&limit=${limit}`, { token });
}

export async function searchInventory(token: string, query: string) {
  return fetchAPI<{ items: any[] }>(`/inventory/search?q=${encodeURIComponent(query)}`, { token });
}

export async function uploadInventoryCSV(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/inventory/upload-csv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message);
  }

  return response.json();
}

// Analytics
export async function getAnalytics(token: string) {
  return fetchAPI<any>('/analytics/overview', { token });
}

export async function getConversationLogs(token: string, limit = 50) {
  return fetchAPI<any[]>(`/analytics/conversations?limit=${limit}`, { token });
}
