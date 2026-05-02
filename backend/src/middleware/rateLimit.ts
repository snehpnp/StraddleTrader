import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, CLEANUP_INTERVAL);

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export const rateLimit = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.maxRequests || 100; // 100 requests per window
  const message = options.message || 'Too many requests, please try again later';

  return (req: Request, res: Response, next: NextFunction): void => {
    // Get client identifier (IP + user agent or user ID if authenticated)
    const identifier = (req as Request & { userId?: string }).userId 
      ? `user:${(req as Request & { userId?: string }).userId}`
      : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

// Stricter rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes',
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Rate limit exceeded, please slow down',
});
