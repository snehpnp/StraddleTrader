import { api, publicApi } from './api-client';
import type { User } from './auth';

// ============================================
// AUTH APIs (NO TOKEN REQUIRED - use publicApi)
// ============================================

export const authApi = {
  // Login - tokens are set as HTTP-only cookies by backend
  login: (email: string, password: string) =>
    publicApi.post<{ success: boolean; user: User }>('/api/auth/login', {
      email,
      password,
    }),

  // Register - tokens are set as HTTP-only cookies by backend
  register: (name: string, email: string, password: string) =>
    publicApi.post<{ success: boolean; user: User }>('/api/auth/register', {
      name,
      email,
      password,
    }),

  // Logout - clears cookies on backend
  logout: () => publicApi.post('/api/auth/logout', {}),

  // Profile APIs (require token in cookies)
  getProfile: () => api.get<{ success: boolean; user: User }>('/api/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; user: User }>('/api/auth/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { oldPassword, newPassword }),
};

// ============================================
// STRATEGY APIs (TOKEN REQUIRED - use api)
// ============================================

export interface Strategy {
  _id: string;
  name: string;
  symbol: string;
  exchange: string;
  status: 'active' | 'inactive' | 'completed' | 'error';
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const strategyApi = {
  getAll: () => api.get<{ success: boolean; strategies: Strategy[] }>('/api/strategy'),

  getById: (id: string) => api.get<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}`),

  create: (data: Partial<Strategy>) =>
    api.post<{ success: boolean; strategy: Strategy }>('/api/strategy', data),

  update: (id: string, data: Partial<Strategy>) =>
    api.put<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}`, data),

  delete: (id: string) => api.delete<{ success: boolean }>(`/api/strategy/${id}`),

  activate: (id: string) => api.post<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}/activate`, {}),

  deactivate: (id: string) =>
    api.post<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}/deactivate`, {}),

  exit: (id: string) => api.post<{ success: boolean }>(`/api/strategy/${id}/exit`, {}),
};

// ============================================
// BROKER APIs (TOKEN REQUIRED - use api)
// ============================================

export interface Broker {
  _id: string;
  name: string;
  brokerId: string;
  status: 'connected' | 'disconnected' | 'error';
  isDefault: boolean;
  apiKey?: string;
  createdAt: string;
}

export const brokerApi = {
  getAll: () => api.get<{ success: boolean; brokers: Broker[] }>('/api/broker'),

  connect: (data: { brokerId: string; apiKey: string; apiSecret?: string; pin?: string }) =>
    api.post<{ success: boolean; broker: Broker }>('/api/broker/connect', data),

  disconnect: (id: string) => api.post<{ success: boolean }>(`/api/broker/${id}/disconnect`, {}),

  setDefault: (id: string) => api.post<{ success: boolean }>(`/api/broker/${id}/default`, {}),

  testConnection: (id: string) => api.post<{ success: boolean; message: string }>(`/api/broker/${id}/test`, {}),
};

// ============================================
// PORTFOLIO APIs (TOKEN REQUIRED - use api)
// ============================================

export interface Portfolio {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: Position[];
  holdings: Holding[];
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
}

export const portfolioApi = {
  getSummary: () => api.get<{ success: boolean; portfolio: Portfolio }>('/api/portfolio'),

  getPositions: () => api.get<{ success: boolean; positions: Position[] }>('/api/portfolio/positions'),

  getHoldings: () => api.get<{ success: boolean; holdings: Holding[] }>('/api/portfolio/holdings'),

  getPnL: (params?: { from?: string; to?: string }) =>
    api.get<{ success: boolean; pnl: unknown }>('/api/portfolio/pnl', { params }),
};

// ============================================
// MARKET APIs (TOKEN REQUIRED - use api)
// ============================================

export const marketApi = {
  getQuote: (symbol: string, exchange?: string) =>
    api.get<{ success: boolean; quote: unknown }>('/api/market/quote', { params: { symbol, exchange } }),

  getOHLC: (symbol: string, timeframe?: string, limit?: number) =>
    api.get<{ success: boolean; data: unknown[] }>('/api/market/ohlc', { params: { symbol, timeframe, limit } }),

  getInstruments: (exchange?: string) =>
    api.get<{ success: boolean; instruments: unknown[] }>('/api/market/instruments', { params: { exchange } }),
};
