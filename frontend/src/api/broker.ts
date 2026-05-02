import { axiosInstance } from './axios';

export interface Broker {
  _id: string;
  name: string;
  brokerId: string;
  status: 'connected' | 'disconnected' | 'error';
  isDefault: boolean;
  apiKey?: string;
  createdAt: string;
}

// Get all brokers
export const getBrokers = () =>
  axiosInstance.get<{ success: boolean; brokers: Broker[] }>('/api/broker');

// Get broker status
export const getBrokerStatus = () =>
  axiosInstance.get<{ success: boolean; status: string; connected: boolean; brokerUserId?: string; lastSyncedAt?: string }>('/api/broker/status');

// Save broker credentials
export const saveCredentials = (apiKey: string, apiSecret: string) =>
  axiosInstance.post<{ success: boolean; message: string }>('/api/broker/credentials', { apiKey, apiSecret });

// Get Stoxkart login URL
export const getLoginUrl = () =>
  axiosInstance.get<{ success: boolean; url: string }>('/api/broker/login-url');

// Connect broker (with auth token from redirect)
export const connectBroker = (authToken: string) =>
  axiosInstance.post<{ success: boolean; message: string }>('/api/broker/connect', { authToken });

// Disconnect broker
export const disconnectBroker = () =>
  axiosInstance.post<{ success: boolean; message: string }>('/api/broker/disconnect', {});

// Set default broker
export const setDefaultBroker = (id: string) =>
  axiosInstance.post<{ success: boolean }>(`/api/broker/${id}/default`, {});

// Test broker connection
export const testBrokerConnection = (id: string) =>
  axiosInstance.post<{ success: boolean; message: string }>(`/api/broker/${id}/test`, {});
