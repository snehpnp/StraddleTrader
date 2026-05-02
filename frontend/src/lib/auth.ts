// Auth utilities and types
// NOTE: Tokens are now stored in HTTP-only cookies by the backend
// This file only manages user data in localStorage

export interface User {
  id: string;
  name: string;
  email: string;
}

// Legacy interface - kept for backward compatibility
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Storage key for user data only (tokens are in HTTP-only cookies)
const USER_KEY = 'user_data';

// Save user data to localStorage
export const saveUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Get user data from localStorage
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Clear user data from localStorage (tokens are cleared by backend via cookies)
export const clearAuth = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};

// Check if user is authenticated (based on user data in localStorage)
// The actual token validation happens on the server via cookies
export const isAuthenticated = (): boolean => {
  return !!getUser();
};

// Legacy exports for backward compatibility (tokens are in cookies now)
export const getAccessToken = (): null => {
  // Tokens are now in HTTP-only cookies, not accessible from JS
  return null;
};

export const getRefreshToken = (): null => {
  // Tokens are now in HTTP-only cookies, not accessible from JS
  return null;
};

// These functions are kept for backward compatibility but do nothing
// since tokens are managed by cookies
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const saveTokens = (_tokens?: AuthTokens): void => {
  // Tokens are set by backend as HTTP-only cookies
};
