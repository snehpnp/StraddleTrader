'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?returnUrl=${returnUrl}`);
    }

    // If authenticated and on a public route, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      router.replace(returnUrl || '/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback or nothing while redirecting
  if (!isAuthenticated) {
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    if (!isPublicRoute) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Hook for route protection logic
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?returnUrl=${returnUrl}`);
      return false;
    }
    return true;
  };

  const redirectIfAuthenticated = () => {
    if (!isLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      router.replace(returnUrl || '/dashboard');
      return true;
    }
    return false;
  };

  return { requireAuth, redirectIfAuthenticated, isAuthenticated, isLoading };
}
