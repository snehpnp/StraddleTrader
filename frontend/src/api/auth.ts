import { publicAxios, axiosInstance } from './axios';
import type { User } from '@/lib/auth';

// Login - tokens are set as HTTP-only cookies by backend
export const login = (email: string, password: string) =>
  publicAxios.post<{ success: boolean; user: User }>('/api/auth/login', {
    email,
    password,
  });

// Register - tokens are set as HTTP-only cookies by backend
export const register = (name: string, email: string, password: string) =>
  publicAxios.post<{ success: boolean; user: User }>('/api/auth/register', {
    name,
    email,
    password,
  });

// Logout - clears cookies on backend
export const logout = () => publicAxios.post('/api/auth/logout', {});

// Get Profile (requires token in cookies)
export const getProfile = () =>
  axiosInstance.get<{ success: boolean; user: User }>('/api/auth/profile');

// Update Profile
export const updateProfile = (data: Partial<User>) =>
  axiosInstance.put<{ success: boolean; user: User }>('/api/auth/profile', data);

// Change Password
export const changePassword = (oldPassword: string, newPassword: string) =>
  axiosInstance.post('/api/auth/change-password', { oldPassword, newPassword });

// Forgot Password
export const forgotPassword = (email: string) =>
  publicAxios.post('/api/auth/forgot-password', { email });

// Reset Password
export const resetPassword = (token: string, password: string) =>
  publicAxios.post('/api/auth/reset-password', { token, password });
