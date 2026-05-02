import { axiosInstance } from './axios';

export interface Strategy {
  _id: string;
  name: string;
  symbol?: string;
  exchange?: string;
  strategyType?: 'straddle' | 'strangle' | 'iron_condor';
  config?: {
    underlying?: string;
    symbol?: string;
    expiry?: string;
    direction?: 'long' | 'short';
    quantityLots?: number;
    [key: string]: unknown;
  };
  status: 'draft' | 'active' | 'stopped' | 'completed' | 'error';
  currentPnL?: number;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Get all strategies
export const getStrategies = () =>
  axiosInstance.get<{ success: boolean; strategies: Strategy[] }>('/api/strategy');

// Get strategy by ID
export const getStrategy = (id: string) =>
  axiosInstance.get<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}`);

// Create new strategy
export const createStrategy = (data: Partial<Strategy> & Record<string, unknown>) =>
  axiosInstance.post<{ success: boolean; strategy: Strategy }>('/api/strategy', data);

// Update strategy
export const updateStrategy = (id: string, data: Partial<Strategy>) =>
  axiosInstance.put<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}`, data);

// Delete strategy
export const deleteStrategy = (id: string) =>
  axiosInstance.delete<{ success: boolean }>(`/api/strategy/${id}`);

// Activate strategy
export const activateStrategy = (id: string) =>
  axiosInstance.post<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}/activate`, {});

// Deactivate strategy
export const deactivateStrategy = (id: string) =>
  axiosInstance.post<{ success: boolean; strategy: Strategy }>(`/api/strategy/${id}/deactivate`, {});

// Exit strategy
export const exitStrategy = (id: string) =>
  axiosInstance.post<{ success: boolean }>(`/api/strategy/${id}/exit`, {});
