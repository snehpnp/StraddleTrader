'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState, saveUser, clearAuth, getUser } from '@/lib/auth';
import { authApi } from '@/lib/api-services';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      // Tokens are in HTTP-only cookies (managed by browser)
      // We only check user data in localStorage to know if user was logged in
      const user = getUser();
      
      if (user) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    
    initAuth();
  }, []);

  // Update state helper (tokens are in cookies, only save user to localStorage)
  const setAuthState = useCallback((user: User) => {
    saveUser(user);
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.login(email, password) as { 
        success: boolean; 
        user: User;
      };
      
      if (!response.success) {
        throw new Error('Login failed');
      }
      
      // Tokens are automatically set as HTTP-only cookies by backend
      setAuthState(response.user);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [setAuthState]);

  // Register function
  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.register(name, email, password) as { 
        success: boolean; 
        user: User;
      };
      
      if (!response.success) {
        throw new Error('Registration failed');
      }
      
      // Tokens are automatically set as HTTP-only cookies by backend
      setAuthState(response.user);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [setAuthState]);

  // Logout function
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      // Call logout API to invalidate token
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      clearAuth();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.replace('/login');
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile() as { success: boolean; user: User };
      if (response.success && response.user) {
        saveUser(response.user);
        setState((prev) => ({
          ...prev,
          user: response.user,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
