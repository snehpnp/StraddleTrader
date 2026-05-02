import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
  );
  
  next();
};

// Request sanitization middleware
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove potentially dangerous characters from body
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: Record<string, unknown>): void => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'string') {
          // Remove null bytes and trim
          obj[key] = value.replace(/\0/g, '').trim();
        } else if (typeof value === 'object' && value !== null) {
          sanitize(value as Record<string, unknown>);
        }
      });
    };
    sanitize(req.body);
  }
  
  next();
};

// CORS preflight handler
export const corsPreflight = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
};

// Request logging middleware for security audit
export const securityAudit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as Request & { userId?: string }).userId || 'anonymous';
    
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.warn(`[SECURITY] ${req.method} ${req.path} - ${res.statusCode} - User: ${userId} - IP: ${req.ip} - Duration: ${duration}ms`);
    }
  });
  
  next();
};
