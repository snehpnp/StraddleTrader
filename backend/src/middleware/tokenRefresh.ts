import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './auth';

interface TokenPayload {
  userId: string;
  type?: string;
  exp?: number;
  iat?: number;
}

// Token blacklist for logged out tokens
const tokenBlacklist = new Set<string>();

// Cleanup old blacklisted tokens periodically (tokens older than 24 hours)
const TOKEN_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Token refresh window (refresh if token expires within this time)
const REFRESH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Store for refresh tokens
interface RefreshTokenData {
  userId: string;
  expiresAt: number;
}

const refreshTokens: Map<string, RefreshTokenData> = new Map();

// Generate access token
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' } // Short lived access token (15 minutes)
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' } // Long lived refresh token (7 days)
  );
  
  refreshTokens.set(refreshToken, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  
  return refreshToken;
};

// Verify if token is blacklisted
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// Blacklist a token (on logout)
export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

// Token refresh middleware
export const tokenRefreshMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      // If token expires soon, add refresh hint to response
      if (expiresIn < REFRESH_WINDOW_MS && expiresIn > 0) {
        res.setHeader('X-Token-Refresh-Required', 'true');
      }
    }
  } catch {
    // Ignore decode errors
  }
  
  next();
};

// Enhanced auth middleware with blacklist check
export const enhancedAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Read token from cookies first, then fallback to Authorization header
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }
  
  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    res.status(401).json({
      success: false,
      message: 'Token has been revoked. Please login again.',
    });
    return;
  }
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as TokenPayload;
    
    // Check token type
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type.',
      });
      return;
    }
    
    req.userId = decoded.userId;
    
    // Add token info to request for potential refresh
    (req as AuthRequest & { tokenExp?: number }).tokenExp = decoded.exp;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Refresh token endpoint handler
export const handleRefreshToken = (req: Request, res: Response): void => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: 'Refresh token required.',
    });
    return;
  }
  
  // Check if refresh token exists and is valid
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
    return;
  }
  
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret'
    ) as TokenPayload;
    
    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type.',
      });
      return;
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);
    
    // Remove old refresh token
    refreshTokens.delete(refreshToken);
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token.',
    });
  }
};

// Logout handler - clear cookies and blacklist token
export const handleLogout = (req: AuthRequest, res: Response): void => {
  // Read token from cookies or header
  let token = req.cookies?.access_token;
  if (!token) {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Blacklist the token if found
  if (token) {
    blacklistToken(token);
  }

  // Also remove refresh token from store if provided
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  // Clear cookies
  res.clearCookie('access_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.clearCookie('refresh_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// Cleanup function for expired refresh tokens
export const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  refreshTokens.forEach((data, token) => {
    if (data.expiresAt < now) {
      refreshTokens.delete(token);
    }
  });
};

// Run cleanup periodically
setInterval(cleanupExpiredTokens, TOKEN_CLEANUP_INTERVAL);
