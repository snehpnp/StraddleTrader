import axios, { AxiosResponse, AxiosError } from 'axios';
import { clearAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================
// 1. AUTHENTICATED API CLIENT (Token Required)
// ============================================
// Use this for all protected APIs that need authentication
// Token is automatically sent via cookies (withCredentials: true)
// No need to manually attach Authorization header

export const authApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookies are sent automatically
});

// Response interceptor - handle token expiration (401)
authApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // If 401 Unauthorized, clear auth and redirect to login
    if (error.response?.status === 401) {
      // Clear local user data
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session=expired';
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// 2. PUBLIC API CLIENT (No Token Required)
// ============================================
// Use this for public APIs like login, register, forgot password
// No token is attached automatically

export const publicApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ============================================
// Helper functions for authenticated APIs
// ============================================

export const api = {
  get: <T = unknown>(endpoint: string, config?: Record<string, unknown>) =>
    authApiClient.get<T>(endpoint, config).then((res: AxiosResponse<T>) => res.data),

  post: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    authApiClient.post<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  put: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    authApiClient.put<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  patch: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    authApiClient.patch<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  delete: <T = unknown>(endpoint: string, config?: Record<string, unknown>) =>
    authApiClient.delete<T>(endpoint, config).then((res: AxiosResponse<T>) => res.data),
};

// ============================================
// Helper functions for public APIs (no auth)
// ============================================

export const publicApi = {
  get: <T = unknown>(endpoint: string, config?: Record<string, unknown>) =>
    publicApiClient.get<T>(endpoint, config).then((res: AxiosResponse<T>) => res.data),

  post: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    publicApiClient.post<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  put: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    publicApiClient.put<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  patch: <T = unknown>(endpoint: string, data?: unknown, config?: Record<string, unknown>) =>
    publicApiClient.patch<T>(endpoint, data, config).then((res: AxiosResponse<T>) => res.data),

  delete: <T = unknown>(endpoint: string, config?: Record<string, unknown>) =>
    publicApiClient.delete<T>(endpoint, config).then((res: AxiosResponse<T>) => res.data),
};
