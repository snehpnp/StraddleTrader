import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';
import { handleRefreshToken, handleLogout, enhancedAuthMiddleware } from '../middleware/tokenRefresh';

const router = Router();

// Public routes with stricter rate limiting
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);

// Token refresh endpoint
router.post('/refresh', authRateLimit, handleRefreshToken);

// Protected routes
router.get('/profile', enhancedAuthMiddleware, getProfile);
router.post('/logout', enhancedAuthMiddleware, handleLogout);

export default router;
