import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import passwordRoutes from './routes/passwordRoutes';
import hashRoutes from './routes/hashRoutes';
import storageRoutes from './routes/storageRoutes';
import labRoutes from './routes/labRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import reportRoutes from './routes/reportRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '2mb' }));

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded. Please wait before issuing further requests.' },
});
app.use('/api', apiLimiter);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'Password Security Testing and Assessment System (PSTS)',
    version: '1.0.0',
    zero_plaintext_policy: true,
    timestamp: new Date().toISOString(),
  });
});

// Mount all REST API modules per SRS Section 6
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/hash', hashRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err.message);
  res.status(500).json({
    error: 'An unexpected error occurred in the PSTS server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
