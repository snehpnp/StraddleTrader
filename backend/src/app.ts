/// <reference types="node" />
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import brokerRoutes from './routes/broker.routes';
import strategyRoutes from './routes/strategy.routes';
import marketRoutes from './routes/market.routes';
import portfolioRoutes from './routes/portfolio.routes';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, sanitizeRequest, securityAudit } from './middleware/security';
import { apiRateLimit } from './middleware/rateLimit';
import { tokenRefreshMiddleware } from './middleware/tokenRefresh';

dotenv.config();

const app = express();

// Security Middleware (apply first)
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(securityAudit);

// Cookie Parser Middleware
app.use(cookieParser());

// CORS Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting Middleware
app.use('/api/', apiRateLimit);

// Token Refresh Middleware
app.use('/api/', tokenRefreshMiddleware);

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
