import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import connectDB from './config/database';

import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

async function bootstrap(): Promise<void> {
  const app = express();

  // ── Security Middleware ────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'],
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });
  app.use('/api/', limiter);

  // ── Body Parsing ──────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ───────────────────────────────────────────────
  // Place BEFORE routes so every request is logged
  app.use(morgan('dev'));

  // ── Database ──────────────────────────────────────────────
  await connectDB();

  // ── Top-level health check (accessible at /health) ────────
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'ResumeAI Pro API is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // ── Routes ────────────────────────────────────────────────
  app.use('/api', routes);

  // ── Error Handling ────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ── Start Server ──────────────────────────────────────────
  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║          🎯 ResumeAI Pro API Server              ║
╠══════════════════════════════════════════════════╣
║  Port:        ${String(config.port).padEnd(34)}║
║  Environment: ${config.nodeEnv.padEnd(34)}║
║  AI Provider: ${config.ai.provider.padEnd(34)}║
║  Frontend:    ${config.frontendUrl.padEnd(34)}║
╚══════════════════════════════════════════════════╝
    `);
  });

  // ── Graceful Shutdown ─────────────────────────────────────
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
